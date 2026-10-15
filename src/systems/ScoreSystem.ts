import { BALANCE } from '../data/balance';

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
