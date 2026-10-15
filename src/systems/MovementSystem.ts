import type { Fighter } from '../entities/Fighter';
import { StatusEffectType } from '../entities/StatusEffect';

export interface ArenaBounds {
  minX: number;
  maxX: number;
}

/**
 * Tolerância vertical para considerar duas unidades na MESMA trilha
 * (lane) — bem menor que a distância entre trilhas do balanceamento.
 */
export const LANE_TOLERANCE_PX = 20;

/** Unidade confusa (passiva Beckzito — SPEC-JOGO §3) mira nos aliados. */
function isPotentialTarget(fighter: Fighter, other: Fighter): boolean {
  const confused = fighter.hasStatus(StatusEffectType.Confusion);
  return confused ? other.team === fighter.team : other.team !== fighter.team;
}

function xDistance(a: Fighter, b: Fighter): number {
  return Math.abs(a.x - b.x);
}

function sameLane(a: Fighter, b: Fighter): boolean {
  return Math.abs(a.y - b.y) <= LANE_TOLERANCE_PX;
}

/**
 * Alvo do combate (SPEC-TECNICA §15), com trilhas separadas (v1.4.2):
 * 1. oponente vivo mais próximo **na própria trilha**;
 * 2. sem ninguém na trilha? o mais próximo de qualquer trilha — a unidade
 *    então caminha (inclusive verticalmente) até a trilha dele.
 */
export function findNearestOpponent(fighter: Fighter, fighters: readonly Fighter[]): Fighter | null {
  let nearestSameLane: Fighter | null = null;
  let nearestSameLaneDistance = Infinity;
  let nearestAnyLane: Fighter | null = null;
  let nearestAnyLaneDistance = Infinity;
  for (const other of fighters) {
    if (other === fighter || !other.alive || !isPotentialTarget(fighter, other)) {
      continue;
    }
    const distance = xDistance(fighter, other);
    if (distance < nearestAnyLaneDistance) {
      nearestAnyLaneDistance = distance;
      nearestAnyLane = other;
    }
    if (sameLane(fighter, other) && distance < nearestSameLaneDistance) {
      nearestSameLaneDistance = distance;
      nearestSameLane = other;
    }
  }
  return nearestSameLane ?? nearestAnyLane;
}

/**
 * Movimentação 100% automática (SPEC-TECNICA §13): a unidade anda em direção
 * ao oponente mais próximo até entrar no alcance de ataque — cada trilha
 * luta com a própria; quando a trilha esvazia, a unidade migra (v1.4.2).
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
      const aligned = sameLane(fighter, target);
      const distance = xDistance(fighter, target);

      // Alvo em outra trilha: caminha verticalmente até a trilha dele,
      // sem ultrapassar a posição do alvo.
      if (!aligned) {
        const dy = target.y - fighter.y;
        const step = fighter.stats.moveSpeed * deltaSeconds;
        fighter.y += Math.abs(dy) <= step ? dy : Math.sign(dy) * step;
        if (distance <= fighter.stats.range) {
          continue; // já alinhado em X: falta só chegar na trilha
        }
      }

      if (aligned && distance <= fighter.stats.range) {
        fighter.targetInRange = true;
        continue;
      }

      fighter.x += fighter.facing * fighter.stats.moveSpeed * deltaSeconds;
      fighter.x = Math.min(bounds.maxX, Math.max(bounds.minX, fighter.x));
    }
  }
}
