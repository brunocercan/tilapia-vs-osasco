import { BALANCE } from '../data/balance';
import { EQUIPMENT_BY_ID } from '../data/equipment';

export interface ScoreInput {
  kills: number;
  bossKills: number;
  /** Tempo total vivo na run ativa (s) — alimenta o multiplicador. */
  elapsedSeconds: number;
  /** Soma dos bônus % de equipamentos tipo Vale-Transporte (§4). */
  killScoreBonusPercent: number;
}

export interface ScoreBreakdown {
  /** Pontos por inimigos comuns derrotados. */
  enemies: number;
  /** Pontos por bosses derrotados. */
  bosses: number;
  /** Multiplicador de sobrevivência (1 + 0,1 por minuto vivo). */
  multiplier: number;
  total: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Pontuação da run (SPEC-JOGO §10), rebalanceada em out/2026:
 * SOMENTE inimigos derrotados (comuns + bosses) × multiplicador que
 * aumenta com o tempo vivo na run ativa.
 * Não há mais pontos por tempo, fases, nível ou sobreviventes — o
 * tempo entra apenas como multiplicador de sobrevivência.
 */
export class ScoreSystem {
  /**
   * Soma dos bônus % de pontuação de todos os equipamentos da run
   * (Vale-Transporte +10%, Colar do Grupo Tilápia +25% — §4).
   */
  static killScoreBonusPercent(equipmentIds: ReadonlyMap<string, readonly string[]>): number {
    let sum = 0;
    for (const ids of equipmentIds.values()) {
      for (const id of ids) {
        sum += EQUIPMENT_BY_ID.get(id)?.scoreKillBonusPercent ?? 0;
      }
    }
    return sum;
  }

  /**
   * Multiplicador de sobrevivência: 1 + `survivalMultiplierPerMinute`
   * por minuto vivo na run. 5 min de run → ×1,5; 10 min → ×2,0.
   */
  static survivalMultiplier(elapsedSeconds: number): number {
    const perMinute = BALANCE.score.survivalMultiplierPerMinute;
    return round2(1 + (Math.max(0, elapsedSeconds) / 60) * perMinute);
  }

  static calculate(input: ScoreInput): ScoreBreakdown {
    const s = BALANCE.score;

    // Vale-Transporte: +10% na pontuação de inimigos derrotados (§4)
    const bonus = 1 + input.killScoreBonusPercent / 100;
    const enemies = Math.round(input.kills * s.enemyKill * bonus);
    const bosses = Math.round(input.bossKills * s.bossKill * bonus);
    const multiplier = ScoreSystem.survivalMultiplier(input.elapsedSeconds);

    return {
      enemies,
      bosses,
      multiplier,
      total: Math.round((enemies + bosses) * multiplier),
    };
  }
}
