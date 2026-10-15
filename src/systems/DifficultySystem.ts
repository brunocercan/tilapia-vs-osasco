import type { Stats } from '../data/types';

/**
 * Escalonamento por tempo de run (SPEC-JOGO §7):
 * multiplicador = 1 + (tempo_da_run_em_segundos / 60) * 0,15
 * com teto definido por fase. Aplica-se principalmente a HP e dano;
 * a velocidade de ataque cresce pela metade da proporção.
 */
export class DifficultySystem {
  static multiplier(runElapsedSeconds: number, phaseCap: number): number {
    const raw = 1 + (runElapsedSeconds / 60) * 0.15;
    return Math.min(phaseCap, raw);
  }

  /** Escala os stats de um inimigo/boss no momento do spawn. */
  static scaleStats(base: Stats, multiplier: number): Stats {
    const hpMultiplier = Math.round(multiplier * 100) / 100;
    return {
      ...base,
      maxHp: Math.round(base.maxHp * multiplier),
      damage: Math.max(1, Math.round(base.damage * multiplier)),
      attackSpeed: Math.round(base.attackSpeed * (1 + (hpMultiplier - 1) * 0.5) * 100) / 100,
    };
  }
}
