import type { BossDefinition, BossAbilityDefinition } from '../data/types';
import type { Fighter } from '../entities/Fighter';
import { StatusEffectType } from '../entities/StatusEffect';
import { BALANCE } from '../data/balance';
import { StatusEffectSystem } from './StatusEffectSystem';

export interface BossEvent {
  x: number;
  y: number;
  text: string;
  color: string;
}

/** Ações do boss que dependem do mundo externo (cena de batalha). */
export interface BossSystemHooks {
  onEvent: (event: BossEvent) => void;
  spawnProjectile: (x: number, y: number, projectile: { speed: number; damage: number }) => void;
  summon: (enemyId: string, nearX: number, laneY: number) => void;
  countAliveSummons: () => number;
}

interface ActiveCharge {
  remaining: number;
  damageMultiplier: number;
  damageReductionPercent: number;
  speedDivisor: number;
  hitTargets: Set<string>;
}

/**
 * Comportamento de boss (SPEC-JOGO §8): habilidades em cooldown e gatilhos
 * por percentual de HP, tudo dirigido pelos dados da BossDefinition.
 */
export class BossSystem {
  private readonly cooldowns: number[];
  private readonly triggeredThresholds = new Set<number>();
  private phaseTwo = false;
  private charge: ActiveCharge | null = null;

  constructor(
    private readonly definition: BossDefinition,
    private readonly boss: Fighter,
    private readonly hooks: BossSystemHooks,
  ) {
    this.cooldowns = definition.abilities.map((ability) => ability.cooldownSeconds);
  }

  update(fighters: readonly Fighter[], deltaSeconds: number): void {
    if (!this.boss.alive) {
      return;
    }

    this.checkThresholds();
    this.updateCharge(fighters, deltaSeconds);

    // Cooldown de ataque não roda durante a investida (o boss está se movendo).
    for (let i = 0; i < this.definition.abilities.length; i++) {
      const ability = this.definition.abilities[i];
      if (ability.phaseTwoOnly && !this.phaseTwo) {
        continue;
      }
      this.cooldowns[i] = Math.max(0, this.cooldowns[i] - deltaSeconds);
      if (this.cooldowns[i] > 0) {
        continue;
      }
      // Só executa se o cooldown zerou E a habilidade conseguiu disparar.
      this.cooldowns[i] = this.tryExecute(ability, fighters)
        ? ability.cooldownSeconds
        : Math.min(0.5, ability.cooldownSeconds);
    }
  }

  private checkThresholds(): void {
    const hpPercent = (this.boss.hp / this.boss.stats.maxHp) * 100;
    this.definition.thresholds.forEach((trigger, index) => {
      if (this.triggeredThresholds.has(index) || hpPercent > trigger.atHpPercent) {
        return;
      }
      this.triggeredThresholds.add(index);

      if (trigger.speedBonusPercent) {
        const multiplier = 1 + trigger.speedBonusPercent / 100;
        this.boss.stats.moveSpeed *= multiplier;
        this.boss.stats.attackSpeed *= multiplier;
      }
      if (trigger.attackSpeedBonusPercent) {
        this.boss.stats.attackSpeed *= 1 + trigger.attackSpeedBonusPercent / 100;
      }
      if (trigger.unlockPhaseTwo) {
        this.phaseTwo = true;
      }
      if (trigger.announce) {
        this.hooks.onEvent({ x: this.boss.x, y: this.boss.y - 60, text: trigger.announce, color: 'rgba(255, 80, 80, 1)' });
      }
      if (trigger.chargeNow) {
        const chargeAbility = this.definition.abilities.find((a) => a.type === 'CHARGE');
        if (chargeAbility) {
          this.startCharge(chargeAbility);
        }
      }
    });
  }

  private tryExecute(ability: BossAbilityDefinition, fighters: readonly Fighter[]): boolean {
    // v1.4.2: habilidades respeitam as trilhas — como os ataques normais.
    const players = fighters.filter(
      (f) => f.team === 'PLAYER' && f.alive && this.sameLane(f),
    );
    switch (ability.type) {
      case 'CHARGE': {
        if (players.length === 0) return false;
        this.startCharge(ability);
        return true;
      }
      case 'AOE': {
        const radius = ability.radiusPx ?? 60;
        const inRange = players.filter((p) => Math.abs(p.x - this.boss.x) <= radius);
        if (inRange.length === 0) return false;
        for (const player of inRange) {
          const raw = Math.round(this.boss.stats.damage * (ability.damageMultiplier ?? 1));
          const damage = Math.max(1, Math.round(raw * player.damageTakenMultiplier) - player.stats.defense);
          player.hp = Math.max(0, player.hp - damage);
          this.hooks.onEvent({ x: player.x, y: player.y - 34, text: `${damage}`, color: 'rgba(255, 190, 80, 1)' });
        }
        return true;
      }
      case 'SLOW_AURA': {
        const radius = ability.radiusPx ?? 150;
        const inRange = players.filter((p) => Math.abs(p.x - this.boss.x) <= radius);
        if (inRange.length === 0) return false;
        for (const player of inRange) {
          StatusEffectSystem.addEffect(player, {
            type: StatusEffectType.Slow,
            duration: ability.slowDurationSeconds ?? 2,
            magnitude: (ability.slowPercent ?? 20) / 100,
            statModifier: { stat: 'attackSpeed', multiplier: 1 - (ability.slowPercent ?? 20) / 100 },
            sourceId: this.boss.id,
          });
        }
        this.hooks.onEvent({ x: this.boss.x, y: this.boss.y - 60, text: 'LATIDO!', color: 'rgba(255, 230, 120, 1)' });
        return true;
      }
      case 'PROJECTILE': {
        this.hooks.spawnProjectile(this.boss.x, this.boss.y, {
          speed: ability.projectileSpeed ?? 240,
          damage: ability.projectileDamage ?? 6,
        });
        return true;
      }
      case 'SUMMON': {
        if (!ability.summonEnemyId || this.hooks.countAliveSummons() >= (ability.maxSummons ?? 1)) {
          return false;
        }
        this.hooks.summon(ability.summonEnemyId, this.boss.x, this.boss.y);
        this.hooks.onEvent({ x: this.boss.x, y: this.boss.y - 60, text: 'INVOCAÇÃO!', color: 'rgba(200, 120, 255, 1)' });
        return true;
      }
    }
  }

  private startCharge(ability: BossAbilityDefinition): void {
    if (this.charge) {
      return; // já está investindo
    }
    const speedMultiplier = ability.speedMultiplier ?? 4;
    this.charge = {
      remaining: ability.durationSeconds ?? 0.5,
      damageMultiplier: ability.damageMultiplier ?? 1,
      damageReductionPercent: ability.damageReductionPercent ?? 0,
      speedDivisor: speedMultiplier,
      hitTargets: new Set(),
    };
    this.boss.stats.moveSpeed *= speedMultiplier;
    this.boss.damageTakenMultiplier = 1 - (ability.damageReductionPercent ?? 0) / 100;
    this.hooks.onEvent({ x: this.boss.x, y: this.boss.y - 60, text: 'INVESTIDA!', color: 'rgba(255, 120, 120, 1)' });
  }

  private updateCharge(fighters: readonly Fighter[], deltaSeconds: number): void {
    if (!this.charge) {
      return;
    }
    this.charge.remaining -= deltaSeconds;

    // Dano de contato durante a investida (uma vez por alvo por investida)
    const contact = BALANCE.arena.fighterHalfWidth * this.boss.spriteScale + 8;
    for (const player of fighters) {
      if (player.team !== 'PLAYER' || !player.alive || this.charge.hitTargets.has(player.id)) {
        continue;
      }
      // v1.4.2: a investida só atinge quem está na trilha do boss.
      if (!this.sameLane(player)) {
        continue;
      }
      if (Math.abs(player.x - this.boss.x) <= contact) {
        this.charge.hitTargets.add(player.id);
        const raw = Math.round(this.boss.stats.damage * this.charge.damageMultiplier);
        const damage = Math.max(1, raw - player.stats.defense);
        player.hp = Math.max(0, player.hp - damage);
        this.hooks.onEvent({ x: player.x, y: player.y - 34, text: `${damage}`, color: 'rgba(255, 120, 120, 1)' });
      }
    }

    if (this.charge.remaining <= 0) {
      this.boss.stats.moveSpeed /= this.charge.speedDivisor;
      this.boss.damageTakenMultiplier = 1;
      this.charge = null;
    }
  }

  get isCharging(): boolean {
    return this.charge !== null;
  }

  /** Tolerância vertical de trilha para as habilidades (v1.4.2). */
  private sameLane(player: Fighter): boolean {
    return Math.abs(player.y - this.boss.y) <= BALANCE.arena.fighterHeight;
  }
}
