import { BALANCE, SECONDARY_STAT_ROTATION } from '../data/balance';
import type { Fighter } from '../entities/Fighter';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Ganhos de nível (SPEC-JOGO §9): HP máximo e dano sobem levemente,
 * mais um atributo secundário em rotação determinística.
 * O incremento de HP máximo também cura o personagem no mesmo valor.
 */
export class LevelSystem {
  static applyLevelUp(fighter: Fighter, newLevel: number): void {
    const gain = BALANCE.progression.levelUp;

    const maxHpBefore = fighter.stats.maxHp;
    fighter.stats.maxHp = Math.round(maxHpBefore * (1 + gain.maxHpPercent / 100));
    fighter.hp += fighter.stats.maxHp - maxHpBefore;

    fighter.stats.damage = Math.max(1, Math.round(fighter.stats.damage * (1 + gain.damagePercent / 100)));

    const boost = SECONDARY_STAT_ROTATION[(newLevel - 2) % SECONDARY_STAT_ROTATION.length];
    if ('percent' in boost) {
      fighter.stats[boost.stat] = round2(fighter.stats[boost.stat] * (1 + boost.percent / 100));
    } else {
      fighter.stats[boost.stat] += boost.flat;
    }
  }
}
