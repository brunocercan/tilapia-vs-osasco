import { BALANCE } from '../data/balance';
import type { RunState } from '../entities/RunState';

/**
 * Experiência da run (SPEC-JOGO §9):
 * XP necessária = 10 + (nível - 1) * 5 — progressão rápida, run de ~5 min.
 */
export class ExperienceSystem {
  static xpForNextLevel(level: number): number {
    const p = BALANCE.progression;
    return p.xpBase + (level - 1) * p.xpPerLevel;
  }

  /**
   * Concede XP ao time e retorna quantos níveis foram ganhos.
   * No nível máximo, XP extra é descartada.
   */
  static grantXp(state: RunState, amount: number): number {
    const p = BALANCE.progression;
    if (state.level >= p.maxLevel) {
      state.xp = 0;
      return 0;
    }

    state.xp += Math.max(0, Math.floor(amount));
    let levelsGained = 0;
    while (state.level < p.maxLevel && state.xp >= ExperienceSystem.xpForNextLevel(state.level)) {
      state.xp -= ExperienceSystem.xpForNextLevel(state.level);
      state.level += 1;
      levelsGained += 1;
    }
    if (state.level >= p.maxLevel) {
      state.xp = 0;
    }
    return levelsGained;
  }
}
