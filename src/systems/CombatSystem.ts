import type { Fighter } from '../entities/Fighter';
import { StatusEffectType } from '../entities/StatusEffect';
import type { RandomService } from '../services/RandomService';
import { StatusEffectSystem } from './StatusEffectSystem';
import type { EquipmentSystem } from './EquipmentSystem';
import { BALANCE } from '../data/balance';

export interface DamageResult {
  damage: number;
  crit: boolean;
  dodged: boolean;
}

export interface CombatEvent {
  x: number;
  y: number;
  text: string;
  color: string;
  /** Presente em explosões em área (Bomba Química) para feedback visual. */
  aoeRadiusPx?: number;
}

/**
 * Cálculo de dano de um ataque (SPEC-TECNICA §15):
 * esquiva → crítico → redução por defesa → dano mínimo.
 * Função pura para permitir testes determinísticos.
 */
export function rollAttack(
  attackerStats: Fighter['stats'],
  defenderStats: Fighter['stats'],
  random: RandomService,
  attackBonusPercent = 0,
  critMultiplierBonus = 0,
): DamageResult {
  if (random.chance(defenderStats.dodgeChance)) {
    return { damage: 0, crit: false, dodged: true };
  }
  const crit = random.chance(attackerStats.critChance);
  const critMultiplier = crit ? BALANCE.combat.critMultiplier + critMultiplierBonus : 1;
  const raw = Math.round(attackerStats.damage * critMultiplier * (1 + attackBonusPercent / 100));
  const damage = Math.max(BALANCE.combat.minDamage, raw - defenderStats.defense);
  return { damage, crit, dodged: false };
}

/**
 * Executa ataques automáticos: alvo em alcance + cooldown zerado → ataca.
 * Efeitos on-hit dos inimigos são aplicados a partir dos dados da definição.
 */
export class CombatSystem {
  constructor(
    private readonly random: RandomService,
    private readonly equipment?: EquipmentSystem,
  ) {}

  update(fighters: readonly Fighter[], deltaSeconds: number, onEvent?: (event: CombatEvent) => void): void {
    for (const fighter of fighters) {
      fighter.attackAnim = Math.max(0, fighter.attackAnim - deltaSeconds);
      if (!fighter.alive) {
        continue;
      }
      fighter.attackCooldown = Math.max(0, fighter.attackCooldown - deltaSeconds);
      // STUN (Chinelo Voador, §4): interrompe o ataque da unidade.
      if (fighter.hasStatus(StatusEffectType.Stun)) {
        continue;
      }
      if (!fighter.targetInRange || !fighter.targetId || fighter.attackCooldown > 0) {
        continue;
      }

      const target = fighters.find((other) => other.id === fighter.targetId);
      if (!target || !target.alive) {
        continue;
      }

      fighter.attackCooldown = 1 / fighter.stats.attackSpeed;
      fighter.attackAnim = BALANCE.combat.attackAnimDuration;

      // Teclado Mecânico (§4) + bônus de HP baixo (Rato da Toca, §6).
      let attackBonusPercent = this.equipment?.rollAttackBonusPercent(fighter) ?? 0;
      const lowHpBonus = fighter.lowHpDamageBonus;
      if (lowHpBonus && fighter.hp <= fighter.stats.maxHp * (lowHpBonus.belowPercent / 100)) {
        attackBonusPercent += lowHpBonus.percent;
      }
      const result = rollAttack(
        fighter.stats,
        target.stats,
        this.random,
        attackBonusPercent,
        fighter.critMultiplierBonus,
      );
      if (result.dodged) {
        onEvent?.({ x: target.x, y: target.y - 34, text: 'ESQUIVA', color: 'rgba(160, 200, 255, 1)' });
        // Borracha-Solta (§4): buff ao esquivar.
        this.equipment?.onDodge(target);
        continue;
      }

      // Cachorro Belga: durante a investida recebe 30% menos dano (§8).
      const finalDamage = Math.max(
        BALANCE.combat.minDamage,
        Math.round(result.damage * target.damageTakenMultiplier),
      );
      target.hp = Math.max(0, target.hp - finalDamage);
      onEvent?.({
        x: target.x,
        y: target.y - 34,
        text: `${finalDamage}`,
        color: result.crit ? 'rgba(255, 214, 64, 1)' : 'rgba(255, 255, 255, 1)',
      });

      this.applyOnHitEffects(fighter, target, fighters, onEvent);
    }
  }

  private applyOnHitEffects(
    attacker: Fighter,
    target: Fighter,
    fighters: readonly Fighter[],
    onEvent?: (event: CombatEvent) => void,
  ): void {
    for (const onHit of attacker.onHitEffects) {
      if (!this.random.chance(onHit.chance)) {
        continue;
      }
      if (onHit.kind === 'STATUS') {
        if (target.alive) {
          StatusEffectSystem.addEffect(target, { ...onHit.effect, sourceId: attacker.id });
        }
      } else if (onHit.kind === 'KNOCKBACK') {
        if (target.alive) {
          const direction = target.x >= attacker.x ? 1 : -1;
          target.x += direction * onHit.distancePx;
          onEvent?.({ x: target.x, y: target.y - 44, text: 'EMPURRÃO', color: 'rgba(255, 160, 90, 1)' });
        }
      } else {
        // AOE (Bomba Química — §3 / Pizzacrek — Gabsmanolo, v1.7.0): dano em
        // todos os adversários do atacante dentro do raio, ao redor do alvo.
        const aoeColor = onHit.eventColor ?? 'rgba(255, 140, 60, 1)';
        for (const other of fighters) {
          if (other.team === attacker.team || !other.alive) {
            continue;
          }
          if (Math.abs(other.x - target.x) <= onHit.radiusPx) {
            other.hp = Math.max(0, other.hp - onHit.damage);
            onEvent?.({ x: other.x, y: other.y - 34, text: `${onHit.damage}`, color: aoeColor });
          }
        }
        onEvent?.({ x: target.x, y: target.y, text: '', color: aoeColor, aoeRadiusPx: onHit.radiusPx });
      }
    }
  }
}
