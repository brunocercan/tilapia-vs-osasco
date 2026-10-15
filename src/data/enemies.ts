import { StatusEffectType } from '../entities/StatusEffect';
import { BALANCE } from './balance';
import type { EnemyDefinition } from './types';

/**
 * Inimigos básicos (SPEC-JOGO §6): 2 por fase + Barata Pequena (invocada
 * pelo boss final, §8).
 */

// ---------- Fase 1 — Matão ----------

export const PERNILONGO: EnemyDefinition = {
  id: 'pernilongo',
  name: 'Pernilongo',
  color: '#c0ca33',
  baseStats: {
    maxHp: 30,
    damage: 6,
    attackSpeed: 1.6, // rápido
    range: 30,
    defense: 0,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 130, // alta
  },
  xpReward: 4,
  onHitEffects: [
    {
      kind: 'STATUS',
      chance: 100,
      effect: {
        type: StatusEffectType.Poison,
        duration: BALANCE.effects.pernilongoDot.duration,
        tickInterval: BALANCE.effects.pernilongoDot.tickInterval,
        magnitude: BALANCE.effects.pernilongoDot.magnitude,
      },
    },
  ],
};

export const CAPIVARA_NERVOSA: EnemyDefinition = {
  id: 'capivara-nervosa',
  name: 'Capivara Nervosa',
  color: '#8d6e63',
  baseStats: {
    maxHp: 90,
    damage: 12, // médio
    attackSpeed: 0.5, // lento
    range: 35,
    defense: 4,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 50, // baixa
  },
  xpReward: 8,
  onHitEffects: [
    {
      kind: 'KNOCKBACK',
      chance: BALANCE.effects.capivaraKnockback.chance,
      distancePx: BALANCE.effects.capivaraKnockback.distancePx,
    },
  ],
};

// ---------- Fase 2 — Ruas de Osasco / Remédios ----------

export const MOTOBOY_APRESSADO: EnemyDefinition = {
  id: 'motoboy-apressado',
  name: 'Motoboy Apressado',
  color: '#e07b39',
  baseStats: {
    maxHp: 50, // médio
    damage: 10, // médio
    attackSpeed: 1.4, // rápido
    range: 35,
    defense: 2,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 170, // muito alta
  },
  xpReward: 5,
  // Ao entrar em combate: +20% de velocidade por 3 segundos (§6)
  onSpawnStatus: {
    type: StatusEffectType.Frenzy,
    duration: 3,
    magnitude: 0.2,
    statModifier: { stat: 'moveSpeed', multiplier: 1.2 },
  },
  onHitEffects: [],
};

export const POMBO_DE_PRACA: EnemyDefinition = {
  id: 'pombo-de-praca',
  name: 'Pombo de Praça',
  color: '#8d99ae',
  baseStats: {
    maxHp: 35, // baixo
    damage: 10, // médio
    attackSpeed: 0.8, // médio
    range: 80, // aéreo: ataca de mais longe
    defense: 0,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 90, // média
  },
  xpReward: 4,
  onHitEffects: [
    {
      kind: 'STATUS',
      chance: 10,
      effect: {
        type: StatusEffectType.Bleed,
        duration: 2,
        tickInterval: 0.5,
        magnitude: 1,
      },
    },
  ],
};

// ---------- Fase 3 — Toca ----------

export const MEIA_PERDIDA: EnemyDefinition = {
  id: 'meia-perdida',
  name: 'Meia Perdida',
  color: '#bdb2ff',
  baseStats: {
    maxHp: 60, // médio
    damage: 6, // baixo
    attackSpeed: 1.4, // rápido
    range: 30,
    defense: 1,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 90, // média
  },
  xpReward: 5,
  onHitEffects: [
    {
      kind: 'STATUS',
      chance: 8,
      effect: {
        type: StatusEffectType.Slow,
        duration: 2,
        magnitude: 0.15,
        statModifier: { stat: 'attackSpeed', multiplier: 0.85 },
      },
    },
  ],
};

export const RATO_DA_TOCA: EnemyDefinition = {
  id: 'rato-da-toca',
  name: 'Rato da Toca',
  color: '#6c584c',
  baseStats: {
    maxHp: 60, // médio
    damage: 14, // alto
    attackSpeed: 1.3, // rápido
    range: 30,
    defense: 1,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 120, // alta
  },
  xpReward: 7,
  // +25% de dano quando abaixo de 50% de HP (§6)
  lowHpDamageBonus: { belowPercent: 50, percent: 25 },
  onHitEffects: [],
};

// ---------- Invocado pelo boss final (§8) ----------

export const BARATA_PEQUENA: EnemyDefinition = {
  id: 'barata-pequena',
  name: 'Baratinha',
  color: '#7a5c4a',
  baseStats: {
    maxHp: 20,
    damage: 5,
    attackSpeed: 1.2,
    range: 30,
    defense: 0,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 110,
  },
  xpReward: 2,
  onHitEffects: [],
};

// ---------- Sub-chefe surpresa (v1.4.0) ----------

/**
 * Mini-Kirk: sub-chefe com pequena chance de aparecer no meio de qualquer
 * fase (v1.4.0). Cabeção de terno (design pixel art baseado em
 * /Source-Images/Charlie.png): a cabeçada empurra o alvo e o XP é gordo.
 */
export const MINI_KIRK: EnemyDefinition = {
  id: 'mini-kirk',
  name: 'Mini-Kirk',
  color: '#1e2b45',
  spriteScale: 1.8,
  baseStats: {
    maxHp: 180,
    damage: 11,
    attackSpeed: 0.85,
    range: 42,
    defense: 5,
    critChance: 5,
    dodgeChance: 0,
    moveSpeed: 75,
  },
  xpReward: 15,
  onHitEffects: [
    // cabeçada: 20% de chance de empurrar o alvo
    { kind: 'KNOCKBACK', chance: 20, distancePx: 60 },
  ],
  // abaixo de 40% de HP fica agressivo
  lowHpDamageBonus: { belowPercent: 40, percent: 30 },
};

export const ENEMY_BY_ID: ReadonlyMap<string, EnemyDefinition> = new Map(
  [
    PERNILONGO,
    CAPIVARA_NERVOSA,
    MOTOBOY_APRESSADO,
    POMBO_DE_PRACA,
    MEIA_PERDIDA,
    RATO_DA_TOCA,
    BARATA_PEQUENA,
    MINI_KIRK,
  ].map((enemy) => [enemy.id, enemy]),
);
