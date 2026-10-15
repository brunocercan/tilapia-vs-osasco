import { StatusEffectType } from '../entities/StatusEffect';
import { BALANCE } from './balance';
import type { CharacterDefinition } from './types';

/**
 * Os 5 amigos do grupo Tilápia (SPEC-JOGO §3).
 * Passivas são dados com parte descritiva (UI) e mecânica (sistemas):
 * - Moscowitta (Kiki): 3% de chance de Veneno (3 dano/s por 3s)
 * - Marmita (Tombas): +3 HP/s de regeneração
 * - Cigarro (Veronezio): +5% de esquiva
 * - Beckzito (Marcola): +5% de chance de Confusão (2s)
 * - Bomba Química (Mattioni): 3% de chance de dano em área
 */
export const CHARACTERS: readonly CharacterDefinition[] = [
  {
    id: 'kiki',
    name: 'Kiki',
    color: '#d9534f',
    baseStats: {
      maxHp: 105,
      damage: 10,
      attackSpeed: 1.0,
      range: 50,
      defense: 3,
      critChance: 8,
      dodgeChance: 5,
      moveSpeed: 90,
    },
    passive: {
      id: 'moscowitta',
      name: 'Moscowitta',
      description: '5% de chance de aplicar Veneno (3 de dano/s por 3s) ao atacar.',
      onHitEffects: [
        {
          kind: 'STATUS',
          chance: BALANCE.effects.moscowitta.chance,
          effect: {
            type: StatusEffectType.Poison,
            duration: BALANCE.effects.moscowitta.duration,
            tickInterval: BALANCE.effects.moscowitta.tickInterval,
            magnitude: BALANCE.effects.moscowitta.magnitude,
          },
        },
      ],
    },
  },
  {
    id: 'tombas',
    name: 'Tombas',
    color: '#e0a32e',
    baseStats: {
      maxHp: 140,
      damage: 9,
      attackSpeed: 0.9,
      range: 45,
      defense: 5,
      critChance: 5,
      dodgeChance: 5,
      moveSpeed: 85,
    },
    passive: {
      id: 'marmita',
      name: 'Marmita',
      description: 'Regenera +5 HP por segundo, mesmo durante o combate.',
      hpRegenPerSecond: BALANCE.effects.marmita.regenPerSecond,
    },
  },
  {
    id: 'veronezio',
    name: 'Veronezio',
    color: '#4a90d9',
    baseStats: {
      maxHp: 100,
      damage: 10,
      attackSpeed: 1.1,
      range: 50,
      defense: 3,
      critChance: 10,
      dodgeChance: 5,
      moveSpeed: 95,
    },
    passive: {
      id: 'cigarro',
      name: 'Cigarro',
      description: '+10% de chance de esquiva.',
      statModifiers: { dodgeChance: BALANCE.effects.cigarro.bonusDodgeChance },
    },
  },
  {
    id: 'marcola',
    name: 'Marcola',
    color: '#9b59b6',
    baseStats: {
      maxHp: 115,
      damage: 11,
      attackSpeed: 0.95,
      range: 45,
      defense: 4,
      critChance: 8,
      dodgeChance: 5,
      moveSpeed: 90,
    },
    passive: {
      id: 'beckzito',
      name: 'Beckzito',
      description: '+8% de chance de aplicar Confusão (2s) ao atacar.',
      onHitEffects: [
        {
          kind: 'STATUS',
          chance: BALANCE.effects.beckzito.chance,
          effect: {
            type: StatusEffectType.Confusion,
            duration: BALANCE.effects.beckzito.duration,
            magnitude: 0,
          },
        },
      ],
    },
  },
  {
    id: 'mattioni',
    name: 'Mattioni',
    color: '#16a085',
    baseStats: {
      maxHp: 110,
      damage: 9,
      attackSpeed: 1.0,
      range: 45,
      defense: 4,
      critChance: 5,
      dodgeChance: 5,
      moveSpeed: 90,
    },
    passive: {
      id: 'bomba-quimica',
      name: 'Bomba Química',
      description: '5% de chance de lançar uma Bomba Química (3 de dano em área) ao atacar.',
      onHitEffects: [
        {
          kind: 'AOE',
          chance: BALANCE.effects.bombaQuimica.chance,
          damage: BALANCE.effects.bombaQuimica.damage,
          radiusPx: BALANCE.effects.bombaQuimica.radiusPx,
        },
      ],
    },
  },
];
