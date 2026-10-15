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
 *
 * v1.5.0: a Marmita (Tombas) virou janela periódica — ativa por
 * `durationSeconds` a cada `cooldownSeconds` (anúncio "MARMITA!"),
 * em vez de regeneração constante.
 */
export class PassiveSystem {
  update(fighters: readonly Fighter[], deltaSeconds: number, onTick?: (event: PassiveTickEvent) => void): void {
    for (const fighter of fighters) {
      if (!fighter.alive) {
        continue; // morto não regenera (e a janela fica congelada)
      }

      // Regeneração contínua: base (equipamentos) + bônus condicional
      // abaixo do limiar (Queijo, §4)
      let regenPerSecond = fighter.hpRegenPerSecond;
      if (
        fighter.hpRegenLowHpBonusPerSecond > 0 &&
        fighter.hp <= fighter.stats.maxHp * (fighter.hpRegenLowHpThresholdPercent / 100)
      ) {
        regenPerSecond += fighter.hpRegenLowHpBonusPerSecond;
      }
      fighter.regenAccumulator += regenPerSecond * deltaSeconds;

      // Marmita (v1.5.0): regen apenas pelos segundos em que a janela
      // esteve ativa dentro do frame — o excedente da ativação conta.
      const periodic = fighter.periodicRegen;
      if (periodic) {
        let activeTime = 0;
        if (periodic.activeRemaining > 0) {
          activeTime = Math.min(periodic.activeRemaining, deltaSeconds);
          periodic.activeRemaining -= deltaSeconds;
        } else {
          periodic.timeToActivation -= deltaSeconds;
          if (periodic.timeToActivation <= 0) {
            const overflow = -periodic.timeToActivation; // sobra do frame
            activeTime = Math.min(overflow, periodic.durationSeconds);
            periodic.activeRemaining = periodic.durationSeconds - activeTime;
            periodic.timeToActivation = periodic.cooldownSeconds;
            onTick?.({
              x: fighter.x,
              y: fighter.y - 54,
              text: 'MARMITA!',
              color: 'rgba(120, 255, 160, 1)',
            });
          }
        }
        fighter.regenAccumulator += periodic.hpPerSecond * activeTime;
      }

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
