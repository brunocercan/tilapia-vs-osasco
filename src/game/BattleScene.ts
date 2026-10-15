import type { CharacterDefinition, PhaseDefinition } from '../data/types';
import { BALANCE } from '../data/balance';
import { ENEMY_BY_ID } from '../data/enemies';
import { BOSS_BY_ID } from '../data/bosses';
import { Fighter } from '../entities/Fighter';
import { createPlayerFighter } from '../entities/fighterFactory';
import type { RunState } from '../entities/RunState';
import type { RandomService } from '../services/RandomService';
import { MovementSystem } from '../systems/MovementSystem';
import { CombatSystem, type CombatEvent } from '../systems/CombatSystem';
import { StatusEffectSystem, type StatusTickEvent } from '../systems/StatusEffectSystem';
import { PassiveSystem, type PassiveTickEvent } from '../systems/PassiveSystem';
import { EquipmentSystem, type EquipmentTickEvent } from '../systems/EquipmentSystem';
import { ExperienceSystem } from '../systems/ExperienceSystem';
import { LevelSystem } from '../systems/LevelSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { BossSystem } from '../systems/BossSystem';
import { StatusEffectType } from '../entities/StatusEffect';
import { drawCharacterSprite, type SpriteDrawOptions } from '../render/sprites';
import { drawEnemySprite, ENEMY_SPRITE_ROWS } from '../render/enemySprites';
import { PhaseBackdrop } from '../render/PhaseBackdrop';

export interface BattleResult {
  victory: boolean;
  kills: number;
  /** Bosses derrotados nesta batalha (0 ou 1 por fase). */
  bossKills: number;
  /** Personagens vivos ao final (score, SPEC-JOGO §10). */
  survivors: number;
  /** Tempo total da run até o fim desta batalha. */
  elapsedSeconds: number;
  level: number;
}

interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  ttl: number;
}

interface Explosion {
  x: number;
  y: number;
  radius: number;
  ttl: number;
  total: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  damage: number;
  alive: boolean;
}

interface BossFight {
  fighter: Fighter;
  system: BossSystem;
}

/**
 * Cena de batalha de uma fase (SPEC-JOGO §2): waves de inimigos seguidas
 * do boss. Vitória ao derrotar o boss; derrota se o time morrer.
 */
export class BattleScene {
  private readonly fighters: Fighter[] = [];
  private readonly damageNumbers: DamageNumber[] = [];
  private readonly explosions: Explosion[] = [];
  private readonly projectiles: Projectile[] = [];
  private readonly countedDeaths = new Set<string>();
  private readonly movement = new MovementSystem();
  private readonly combat: CombatSystem;
  private readonly statusEffects = new StatusEffectSystem();
  private readonly passives = new PassiveSystem();
  private readonly equipment = new EquipmentSystem();
  private readonly bossDefinition;
  private readonly backdrop: PhaseBackdrop;

  private bossFight: BossFight | null = null;
  private waveIndex = 0;
  private summonCounter = 0;
  private elapsedSeconds = 0;
  private kills = 0;
  private endTimer: number | null = null;

  /** Largura/altura lógicas da área de batalha. */
  private width = 0;
  private height = 0;

  constructor(
    characters: readonly CharacterDefinition[],
    private readonly phase: PhaseDefinition,
    random: RandomService,
    private readonly runState: RunState,
    private readonly onEnd: (result: BattleResult) => void,
  ) {
    this.combat = new CombatSystem(random, this.equipment);

    const boss = BOSS_BY_ID.get(phase.bossId);
    if (!boss) {
      throw new Error(`Boss ${phase.bossId} não definido`);
    }
    this.bossDefinition = boss;
    this.backdrop = new PhaseBackdrop(phase);

    characters.forEach((character) => {
      const fighter = createPlayerFighter(character);
      fighter.facing = 1;
      EquipmentSystem.applyByIds(fighter, runState.equipmentIds.get(character.id) ?? []);
      // Reaplica os níveis da run (o Fighter recriado começa do nível 1)
      for (let level = 2; level <= runState.level; level++) {
        LevelSystem.applyLevelUp(fighter, level);
      }
      this.fighters.push(fighter);
    });
  }

  /** Define posições iniciais a partir do tamanho disponível. */
  layout(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.backdrop.layout(width, height);
    const lanes = BALANCE.arena.laneYFractions.map((fraction) => fraction * height);
    this.fighters
      .filter((f) => f.team === 'PLAYER')
      .forEach((fighter, index) => {
        fighter.x = width * BALANCE.arena.playerSpawnX;
        fighter.y = lanes[index % lanes.length];
      });
  }

  update(deltaSeconds: number): void {
    if (this.endTimer !== null) {
      this.endTimer -= deltaSeconds;
      this.updateVisuals(deltaSeconds);
      if (this.endTimer <= 0) {
        this.onEnd({
          victory: this.playersAlive() > 0 && this.bossDefeated(),
          kills: this.kills,
          bossKills: this.bossDefeated() ? 1 : 0,
          survivors: this.playersAlive(),
          elapsedSeconds: this.runState.elapsedSeconds,
          level: this.runState.level,
        });
      }
      return;
    }

    this.elapsedSeconds += deltaSeconds;
    this.runState.elapsedSeconds += deltaSeconds;

    this.spawnNextIfCleared();

    const bounds = {
      minX: BALANCE.arena.fighterHalfWidth,
      maxX: this.width - BALANCE.arena.fighterHalfWidth,
    };

    this.movement.update(this.fighters, deltaSeconds, bounds);
    this.bossFight?.system.update(this.fighters, deltaSeconds);
    this.combat.update(this.fighters, deltaSeconds, this.pushEvent);
    this.statusEffects.update(this.fighters, deltaSeconds, this.pushEvent);
    this.passives.update(this.fighters, deltaSeconds, this.pushEvent);
    this.equipment.update(this.fighters, deltaSeconds, this.pushEvent);
    this.updateProjectiles(deltaSeconds);
    this.grantXpFromDeaths();
    this.updateVisuals(deltaSeconds);

    this.kills = this.countedDeaths.size;
    if (this.playersAlive() === 0 || this.bossDefeated()) {
      this.endTimer = BALANCE.arena.endDelaySeconds;
    }
  }

  /** spawna a próxima onda ou o boss quando a arena estiver limpa (SPEC-JOGO §2). */
  private spawnNextIfCleared(): void {
    if (this.enemiesAlive() > 0 || this.bossFight) {
      return;
    }
    if (this.waveIndex < this.phase.waves.length) {
      this.spawnWave(this.phase.waves[this.waveIndex]);
      this.waveIndex += 1;
      this.pushEvent({ x: this.width * 0.6, y: this.height * 0.3, text: `ONDA ${this.waveIndex}`, color: 'rgba(232, 240, 224, 1)' });
    } else {
      this.spawnBoss();
    }
  }

  private spawnEnemyFighter(enemyId: string, index: number, instanceId?: string): Fighter {
    const definition = ENEMY_BY_ID.get(enemyId);
    if (!definition) {
      throw new Error(`Inimigo ${enemyId} não definido`);
    }
    const multiplier = DifficultySystem.multiplier(this.runState.elapsedSeconds, this.phase.difficultyCap);
    const scaled = { ...definition, baseStats: DifficultySystem.scaleStats(definition.baseStats, multiplier) };
    const fighter = new Fighter(scaled, 'ENEMY', instanceId ?? `${enemyId}-${this.waveIndex}-${index}`, {
      onHitEffects: definition.onHitEffects,
      xpReward: definition.xpReward,
      lowHpDamageBonus: definition.lowHpDamageBonus,
    });
    fighter.facing = -1;

    const lanes = BALANCE.arena.laneYFractions.map((fraction) => fraction * this.height);
    fighter.x = Math.min(
      this.width * BALANCE.arena.enemySpawnX + index * BALANCE.arena.enemySpawnSpacing,
      this.width - 40,
    );
    fighter.y = lanes[index % lanes.length];

    if (definition.onSpawnStatus) {
      StatusEffectSystem.addEffect(fighter, { ...definition.onSpawnStatus });
    }
    this.fighters.push(fighter);
    return fighter;
  }

  private spawnWave(enemyIds: readonly string[]): void {
    enemyIds.forEach((enemyId, index) => this.spawnEnemyFighter(enemyId, index));
  }

  private spawnBoss(): void {
    const def = this.bossDefinition;
    const multiplier = DifficultySystem.multiplier(this.runState.elapsedSeconds, this.phase.difficultyCap);
    const scaled = { ...def, baseStats: DifficultySystem.scaleStats(def.baseStats, multiplier) };
    const fighter = new Fighter(scaled, 'ENEMY', `boss-${def.id}`, { xpReward: def.xpReward });
    fighter.facing = -1;
    fighter.x = this.width * BALANCE.arena.enemySpawnX;
    fighter.y = this.height * BALANCE.arena.laneYFractions[0];
    this.fighters.push(fighter);

    this.bossFight = {
      fighter,
      system: new BossSystem(def, fighter, {
        onEvent: this.pushEvent,
        spawnProjectile: (x, y, projectile) => {
          this.projectiles.push({ x, y, vx: -projectile.speed, damage: projectile.damage, alive: true });
        },
        summon: (enemyId, nearX, laneY) => {
          const summon = this.spawnEnemyFighter(enemyId, 0, `summon-${this.summonCounter++}`);
          summon.x = nearX + 50;
          summon.y = laneY;
        },
        countAliveSummons: () =>
          this.fighters.filter((f) => f.alive && f.id.startsWith('summon-')).length,
      }),
    };
    this.pushEvent({ x: fighter.x, y: fighter.y - 70, text: `${def.name}!`, color: 'rgba(255, 110, 110, 1)' });
  }

  private updateProjectiles(deltaSeconds: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.x += projectile.vx * deltaSeconds;
      if (projectile.x < -30) {
        projectile.alive = false;
      }
      if (projectile.alive) {
        for (const player of this.fighters) {
          if (player.team !== 'PLAYER' || !player.alive) {
            continue;
          }
          const hitX = Math.abs(player.x - projectile.x) <= 16;
          const hitY = Math.abs(player.y - projectile.y) <= BALANCE.arena.fighterHeight;
          if (hitX && hitY) {
            const damage = Math.max(1, projectile.damage - player.stats.defense);
            player.hp = Math.max(0, player.hp - damage);
            this.pushEvent({ x: player.x, y: player.y - 34, text: `${damage}`, color: 'rgba(200, 120, 255, 1)' });
            projectile.alive = false;
            break;
          }
        }
      }
      if (!projectile.alive) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  /** Concede XP por inimigos derrotados e aplica os níveis ganhos (SPEC-JOGO §9). */
  private grantXpFromDeaths(): void {
    for (const enemy of this.fighters) {
      if (enemy.team !== 'ENEMY' || enemy.alive || this.countedDeaths.has(enemy.id)) {
        continue;
      }
      this.countedDeaths.add(enemy.id);

      // Copão de Refri (§4): portadores recuperam HP ao derrubar um inimigo.
      for (const player of this.fighters) {
        if (player.team === 'PLAYER' && player.alive) {
          this.equipment.onEnemyKilled(player, this.pushEvent);
        }
      }

      const levelsGained = ExperienceSystem.grantXp(this.runState, enemy.xpReward);
      for (let i = 0; i < levelsGained; i++) {
        this.applyLevelUp();
      }
    }
  }

  /**
   * Aplica um nível ganho a TODOS os personagens: cura completa e,
   * se um deles já estiver morto, renasce com a vida cheia.
   */
  private applyLevelUp(): void {
    const newLevel = this.runState.level;
    for (const player of this.fighters) {
      if (player.team !== 'PLAYER') {
        continue;
      }
      const wasAlive = player.alive;
      if (!wasAlive) {
        StatusEffectSystem.clearEffects(player); // renasce sem efeitos pendentes
      }
      LevelSystem.applyLevelUp(player, newLevel);
      this.pushEvent({
        x: player.x,
        y: player.y - 54,
        text: wasAlive ? 'LEVEL UP!' : 'RENASCEU!',
        color: 'rgba(126, 200, 80, 1)',
      });
    }
  }

  private bossDefeated(): boolean {
    return this.bossFight !== null && !this.bossFight.fighter.alive;
  }

  private pushEvent = (event: CombatEvent | StatusTickEvent | PassiveTickEvent | EquipmentTickEvent): void => {
    if ('aoeRadiusPx' in event && event.aoeRadiusPx) {
      this.explosions.push({ x: event.x, y: event.y, radius: event.aoeRadiusPx, ttl: 0.35, total: 0.35 });
      return;
    }
    if (event.text) {
      this.damageNumbers.push({ x: event.x, y: event.y, text: event.text, color: event.color, ttl: 0.9 });
    }
  };

  private updateVisuals(deltaSeconds: number): void {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const dmg = this.damageNumbers[i];
      dmg.ttl -= deltaSeconds;
      dmg.y -= 24 * deltaSeconds;
      if (dmg.ttl <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].ttl -= deltaSeconds;
      if (this.explosions[i].ttl <= 0) {
        this.explosions.splice(i, 1);
      }
    }
  }

  private playersAlive(): number {
    return this.fighters.filter((f) => f.team === 'PLAYER' && f.alive).length;
  }

  private enemiesAlive(): number {
    return this.fighters.filter((f) => f.team === 'ENEMY' && f.alive).length;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { width, height } = this;
    this.backdrop.render(ctx, width, height);
    this.renderGround(ctx, width, height);
    this.renderExplosions(ctx);
    this.renderProjectiles(ctx);
    for (const fighter of this.fighters) {
      if (fighter.alive) {
        this.renderFighter(ctx, fighter);
      }
    }
    this.renderDamageNumbers(ctx);
    this.renderHud(ctx, width, height);
    if (this.bossFight?.fighter.alive) {
      this.renderBossBar(ctx, this.bossFight.fighter, width);
    }
  }

  private renderGround(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    for (const fraction of BALANCE.arena.laneYFractions) {
      const y = fraction * height + BALANCE.arena.fighterHeight / 2 + 6;
      ctx.fillStyle = 'rgba(126, 200, 80, 0.12)';
      ctx.fillRect(0, y, width, 3);
    }
  }

  private renderExplosions(ctx: CanvasRenderingContext2D): void {
    for (const explosion of this.explosions) {
      const progress = 1 - explosion.ttl / explosion.total;
      ctx.globalAlpha = 1 - progress;
      ctx.strokeStyle = '#ff8c3c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#8d5524';
    for (const projectile of this.projectiles) {
      ctx.fillRect(projectile.x - 4, projectile.y - 4, 8, 8);
    }
  }

  private renderFighter(ctx: CanvasRenderingContext2D, fighter: Fighter): void {
    const scale = fighter.spriteScale;
    const hw = BALANCE.arena.fighterHalfWidth * scale;
    const h = BALANCE.arena.fighterHeight * scale;
    const x = fighter.x - hw;
    const y = fighter.y - h / 2;

    // Contorno por efeito de status ativo (atrás do sprite)
    const statusOutline = fighter.hasStatus(StatusEffectType.Confusion)
      ? '#c77dff'
      : fighter.hasStatus(StatusEffectType.Stun)
        ? '#adb5bd'
        : fighter.hasStatus(StatusEffectType.Poison) || fighter.hasStatus(StatusEffectType.Bleed)
          ? '#7ec850'
          : fighter.hasStatus(StatusEffectType.Frenzy)
            ? '#ffd23c'
            : null;
    if (statusOutline) {
      ctx.strokeStyle = statusOutline;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 3, y - 3, hw * 2 + 6, h + 6);
    }

    // Sprite pixel art (SPEC-JOGO §15): personagens pelo id, inimigos pelo spriteId.
    // Balanço simples por offset de seno; ataque estende o braço.
    const isPlayer = fighter.team === 'PLAYER';
    const bobOffset = Math.sin(this.elapsedSeconds * 8 + fighter.x * 0.05) * 1.5;
    const spriteGroundY = y + h;
    const spriteUnit = h / (isPlayer ? 22 : ENEMY_SPRITE_ROWS);
    if (isPlayer) {
      const spriteOptions: SpriteDrawOptions = {
        flip: false, // personagens sempre olham para a direita (inimigos à frente)
        attacking: fighter.attackAnim > 0,
        alpha: fighter.hasStatus(StatusEffectType.Stun) ? 0.7 : 1,
      };
      drawCharacterSprite(ctx, fighter.spriteId, fighter.x, spriteGroundY + bobOffset, spriteUnit, spriteOptions);
    } else {
      drawEnemySprite(ctx, fighter.spriteId, fighter.x, spriteGroundY + bobOffset, spriteUnit);
    }

    // Nome
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8f0e0';
    ctx.fillText(fighter.name, fighter.x, y - 16);

    // Barra de HP
    const barWidth = 40 * scale;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(fighter.x - barWidth / 2, y - 12, barWidth, 5);
    const fraction = fighter.hpFraction;
    ctx.fillStyle = fraction > 0.5 ? '#7ec850' : fraction > 0.25 ? '#e0c040' : '#d9534f';
    ctx.fillRect(fighter.x - barWidth / 2, y - 12, barWidth * fraction, 5);

    // Marcadores de equipamento (SPEC-JOGO §12): um quadrado por slot ocupado.
    fighter.equipped.forEach((item, index) => {
      ctx.fillStyle = item.definition.color;
      ctx.fillRect(fighter.x - 8 + index * 10, spriteGroundY + 2, 7, 7);
    });
  }

  private renderBossBar(ctx: CanvasRenderingContext2D, boss: Fighter, width: number): void {
    const barWidth = Math.min(width * 0.5, 420);
    const barX = (width - barWidth) / 2;
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6e6e';
    ctx.fillText(boss.name, width / 2, 44);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, 50, barWidth, 8);
    ctx.fillStyle = '#d9534f';
    ctx.fillRect(barX, 50, barWidth * boss.hpFraction, 8);
  }

  private renderDamageNumbers(ctx: CanvasRenderingContext2D): void {
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const dmg of this.damageNumbers) {
      ctx.globalAlpha = Math.min(1, dmg.ttl / 0.3);
      ctx.fillStyle = dmg.color;
      ctx.fillText(dmg.text, dmg.x, dmg.y);
    }
    ctx.globalAlpha = 1;
  }

  private renderHud(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#e8f0e0';
    ctx.textAlign = 'left';
    ctx.fillText(this.phase.name, 12, 24);

    const totalSeconds = this.runState.elapsedSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const timer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    ctx.textAlign = 'right';
    ctx.fillText(timer, width - 12, 24);

    // XP e nível (SPEC-JOGO §12)
    const maxLevel = this.runState.level >= BALANCE.progression.maxLevel;
    ctx.textAlign = 'left';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(maxLevel ? 'NÍVEL MAX' : `NÍVEL ${this.runState.level}`, 12, height - 28);

    const barWidth = 140;
    const barX = 12;
    const barY = height - 20;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, 8);
    const progress = maxLevel ? 1 : this.runState.xp / ExperienceSystem.xpForNextLevel(this.runState.level);
    ctx.fillStyle = '#4a90d9';
    ctx.fillRect(barX, barY, barWidth * Math.min(1, progress), 8);
  }
}
