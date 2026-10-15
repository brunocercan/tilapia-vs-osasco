import type { CharacterDefinition } from '../data/types';
import type { Stats } from '../data/types';
import { Fighter } from './Fighter';

/**
 * Cria o Fighter de um personagem aplicando a parte mecânica da passiva
 * (SPEC-JOGO §3): bônus de atributo, regeneração e efeitos on-hit.
 */
export function createPlayerFighter(definition: CharacterDefinition): Fighter {
  const fighter = new Fighter(definition, 'PLAYER', `player-${definition.id}`, {
    onHitEffects: definition.passive.onHitEffects ?? [],
  });

  if (definition.passive.statModifiers) {
    for (const key of Object.keys(definition.passive.statModifiers) as (keyof Stats)[]) {
      fighter.stats[key] += definition.passive.statModifiers[key] ?? 0;
    }
  }
  fighter.hpRegenPerSecond = definition.passive.hpRegenPerSecond ?? 0;
  // Marmita (v1.5.0): regen em janelas periódicas — primeira ativação após
  // o cooldown completo.
  if (definition.passive.periodicRegen) {
    const config = definition.passive.periodicRegen;
    fighter.periodicRegen = {
      ...config,
      timeToActivation: config.cooldownSeconds,
      activeRemaining: 0,
    };
  }
  fighter.hp = fighter.stats.maxHp; // maxHp pode ter mudado com os modificadores
  fighter.baseStats = { ...fighter.stats }; // teto de +100% vel. ataque usa a base com passiva
  return fighter;
}
