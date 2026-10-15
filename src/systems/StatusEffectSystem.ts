import type { Fighter } from '../entities/Fighter';
import { StatusEffectType, type StatusEffect } from '../entities/StatusEffect';

export interface StatusTickEvent {
  x: number;
  y: number;
  text: string;
  color: string;
}

/**
 * Processa duração e ticks dos efeitos de status (SPEC-TECNICA §16).
 * Ticks periódicos usam intervalo próprio e nunca ultrapassam o tempo de
 * vida do efeito (controle de intervalo — SPEC-JOGO §5).
 */
export class StatusEffectSystem {
  /**
   * Adiciona um efeito. Enquanto o mesmo tipo estiver ativo, a nova
   * aplicação é ignorada (regra do Veneno: reaplicar só após o término).
   */
  static addEffect(target: Fighter, effect: StatusEffect): boolean {
    if (target.hasStatus(effect.type)) {
      return false;
    }
    target.statusEffects.push({
      ...effect,
      totalDuration: effect.duration,
      tickTimer: 0,
      ticksApplied: 0,
    });
    // SLOW/FRENZY: multiplicador aplicado na entrada e revertido na expiração.
    if (effect.statModifier) {
      target.stats[effect.statModifier.stat] *= effect.statModifier.multiplier;
    }
    return true;
  }

  private static removeEffect(fighter: Fighter, index: number): void {
    const effect = fighter.statusEffects[index];
    if (effect.statModifier) {
      fighter.stats[effect.statModifier.stat] /= effect.statModifier.multiplier;
    }
    fighter.statusEffects.splice(index, 1);
  }

  update(fighters: readonly Fighter[], deltaSeconds: number, onTick?: (event: StatusTickEvent) => void): void {
    for (const fighter of fighters) {
      if (!fighter.alive) {
        continue;
      }
      for (let i = fighter.statusEffects.length - 1; i >= 0; i--) {
        const effect = fighter.statusEffects[i];
        effect.tickTimer = (effect.tickTimer ?? 0) + deltaSeconds;
        effect.duration -= deltaSeconds;

        if (effect.tickInterval && effect.tickInterval > 0) {
          // Ticks permitidos consideram apenas o tempo em que o efeito esteve ativo.
          const activeTime = Math.min(effect.tickTimer, effect.totalDuration ?? 0);
          const ticksAllowed = Math.floor(activeTime / effect.tickInterval);
          while ((effect.ticksApplied ?? 0) < ticksAllowed && fighter.alive) {
            effect.ticksApplied = (effect.ticksApplied ?? 0) + 1;
            this.applyTick(fighter, effect, onTick);
          }
        }

        if (effect.duration <= 0) {
          StatusEffectSystem.removeEffect(fighter, i);
        }
      }
    }
  }

  private applyTick(target: Fighter, effect: StatusEffect, onTick?: (event: StatusTickEvent) => void): void {
    if (effect.type !== StatusEffectType.Poison && effect.type !== StatusEffectType.Bleed) {
      return; // efeitos de controle não causam dano por tick
    }
    target.hp = Math.max(0, target.hp - effect.magnitude);
    onTick?.({
      x: target.x,
      y: target.y - 34,
      text: `-${effect.magnitude}`,
      color: 'rgba(140, 220, 90, 1)',
    });
  }
}
