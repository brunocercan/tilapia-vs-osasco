import { BALANCE, SECONDARY_STAT_ROTATION } from '../data/balance';
import type { Fighter } from '../entities/Fighter';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Ganhos de nível (SPEC-JOGO §9): HP máximo e dano sobem levemente,
 * mais um atributo secundário em rotação determinística.
 * Ao subir de nível a vida é curada por completo (out/2026) — e um
 * personagem morto renasce com a vida cheia (revive no level up).
 */
export class LevelSystem {
  static applyLevelUp(fighter: Fighter, newLevel: number): void {
    const gain = BALANCE.progression.levelUp;

    fighter.stats.maxHp = Math.round(fighter.stats.maxHp * (1 + gain.maxHpPercent / 100));

    fighter.stats.damage = Math.max(1, Math.round(fighter.stats.damage * (1 + gain.damagePercent / 100)));

    const boost = SECONDARY_STAT_ROTATION[(newLevel - 2) % SECONDARY_STAT_ROTATION.length];
    if ('percent' in boost) {
      fighter.stats[boost.stat] = round2(fighter.stats[boost.stat] * (1 + boost.percent / 100));
    } else {
      fighter.stats[boost.stat] += boost.flat;
    }

    // Cura completa — e renascimento se estava morto.
    fighter.hp = fighter.stats.maxHp;
  }
}
