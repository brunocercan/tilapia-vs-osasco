import type { Fighter } from '../entities/Fighter';
import { StatusEffectType } from '../entities/StatusEffect';

export interface ArenaBounds {
  minX: number;
  maxX: number;
}

/**
 * Encontra o oponente vivo mais próximo (alvo do combate — SPEC-TECNICA §15).
 * Unidade confusa (passiva Beckzito — SPEC-JOGO §3) passa a mirar nos
 * próprios aliados próximos.
 */
export function findNearestOpponent(fighter: Fighter, fighters: readonly Fighter[]): Fighter | null {
  const confused = fighter.hasStatus(StatusEffectType.Confusion);
  let nearest: Fighter | null = null;
  let nearestDistance = Infinity;
  for (const other of fighters) {
    if (other === fighter || !other.alive) {
      continue;
    }
    const isTarget = confused ? other.team === fighter.team : other.team !== fighter.team;
    if (!isTarget) {
      continue;
    }
    const distance = Math.abs(other.x - fighter.x);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = other;
    }
  }
  return nearest;
}

/**
 * Movimentação 100% automática (SPEC-JOGO §13): a unidade anda em direção
 * ao oponente mais próximo até entrar no alcance de ataque.
 */
export class MovementSystem {
  update(fighters: readonly Fighter[], deltaSeconds: number, bounds: ArenaBounds): void {
    for (const fighter of fighters) {
      if (!fighter.alive || fighter.hasStatus(StatusEffectType.Stun)) {
        continue; // STUN: unidade interrompida não se move nem redefine alvo
      }

      const target = findNearestOpponent(fighter, fighters);
      fighter.targetId = target?.id ?? null;
      fighter.targetInRange = false;
      if (!target) {
        continue;
      }

      fighter.facing = target.x >= fighter.x ? 1 : -1;
      const distance = Math.abs(target.x - fighter.x);
      if (distance <= fighter.stats.range) {
        fighter.targetInRange = true;
        continue;
      }

      fighter.x += fighter.facing * fighter.stats.moveSpeed * deltaSeconds;
      fighter.x = Math.min(bounds.maxX, Math.max(bounds.minX, fighter.x));
    }
  }
}
