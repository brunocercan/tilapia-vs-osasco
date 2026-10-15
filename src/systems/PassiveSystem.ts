import type { Fighter } from '../entities/Fighter';

export interface PassiveTickEvent {
  x: number;
  y: number;
  text: string;
  color: string;
}

/**
 * Efeitos contínuos de passivas (SPEC-JOGO §3, ex.: regeneração da Marmita).
 * A cura acumula frações e é aplicada em passos inteiros, evitando
 * múltiplas aplicações no mesmo frame (SPEC-JOGO §5).
 */
export class PassiveSystem {
  update(fighters: readonly Fighter[], deltaSeconds: number, onTick?: (event: PassiveTickEvent) => void): void {
    for (const fighter of fighters) {
      if (!fighter.alive) {
        continue;
      }

      // Regeneração: base + bônus condicional abaixo do limiar (Queijo, §4)
      let regenPerSecond = fighter.hpRegenPerSecond;
      if (
        fighter.hpRegenLowHpBonusPerSecond > 0 &&
        fighter.hp <= fighter.stats.maxHp * (fighter.hpRegenLowHpThresholdPercent / 100)
      ) {
        regenPerSecond += fighter.hpRegenLowHpBonusPerSecond;
      }
      if (regenPerSecond <= 0) {
        continue;
      }

      fighter.regenAccumulator += regenPerSecond * deltaSeconds;
      if (fighter.regenAccumulator < 1) {
        continue;
      }

      const healAmount = Math.floor(fighter.regenAccumulator);
      fighter.regenAccumulator -= healAmount;

      const healed = Math.min(fighter.stats.maxHp, fighter.hp + healAmount) - fighter.hp;
      fighter.hp += healed;

      if (healed > 0) {
        onTick?.({
          x: fighter.x,
          y: fighter.y - 44,
          text: `+${healed}`,
          color: 'rgba(120, 255, 160, 1)',
        });
      }
    }
  }
}
