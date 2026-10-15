import type { BossDefinition } from './types';

/**
 * Os 3 bosses (SPEC-JOGO §8). Habilidades e gatilhos de HP como dados,
 * interpretados pelo BossSystem.
 */
export const INSETO_GIGANTE: BossDefinition = {
  id: 'inseto-gigante',
  name: 'Inseto Gigante',
  color: '#4a6741',
  spriteScale: 1.9,
  isBoss: true,
  xpReward: 40,
  baseStats: {
    maxHp: 320,
    damage: 10,
    attackSpeed: 0.55,
    range: 50,
    defense: 4,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 55,
  },
  abilities: [
    // investida
    { type: 'CHARGE', cooldownSeconds: 5, speedMultiplier: 5, durationSeconds: 0.5, damageMultiplier: 1.2 },
    // pequeno ataque em área
    { type: 'AOE', cooldownSeconds: 5, radiusPx: 80, damageMultiplier: 0.75 },
  ],
  thresholds: [
    // a cada 20% de HP perdido: 5% mais rápido
    { atHpPercent: 80, speedBonusPercent: 5 },
    { atHpPercent: 60, speedBonusPercent: 5 },
    { atHpPercent: 40, speedBonusPercent: 5 },
    // aos 20%: rápido + Frenesi (+20% vel. de ataque)
    { atHpPercent: 20, speedBonusPercent: 5, attackSpeedBonusPercent: 20, announce: 'FRENESI!' },
  ],
};

export const CACHORRO_BRAVO: BossDefinition = {
  id: 'cachorro-bravo',
  name: 'Cachorro Belga',
  color: '#a4673f',
  spriteScale: 1.8,
  isBoss: true,
  xpReward: 50,
  baseStats: {
    maxHp: 340,
    damage: 13,
    attackSpeed: 0.8,
    range: 40,
    defense: 4,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 110,
  },
  abilities: [
    // investida: durante ela recebe 30% menos dano
    {
      type: 'CHARGE',
      cooldownSeconds: 6,
      speedMultiplier: 4.5,
      durationSeconds: 0.4,
      damageMultiplier: 1.2,
      damageReductionPercent: 30,
    },
    // latido: reduz a vel. de ataque dos personagens próximos
    { type: 'SLOW_AURA', cooldownSeconds: 7, radiusPx: 170, slowPercent: 20, slowDurationSeconds: 2 },
  ],
  thresholds: [
    // a cada 25% de HP perdido: investida automática
    { atHpPercent: 75, chargeNow: true },
    { atHpPercent: 50, chargeNow: true },
    { atHpPercent: 25, chargeNow: true },
  ],
};

export const BARATA_VOADORA: BossDefinition = {
  id: 'barata-voadora',
  name: 'Barata Voadora',
  color: '#5b3d2e',
  spriteScale: 1.9,
  isBoss: true,
  xpReward: 60,
  baseStats: {
    maxHp: 420,
    damage: 11,
    attackSpeed: 0.75,
    range: 55,
    defense: 5,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 90,
  },
  abilities: [
    // voo curto: tratado como investida
    { type: 'CHARGE', cooldownSeconds: 6, speedMultiplier: 5, durationSeconds: 0.45, damageMultiplier: 1.2 },
    // projéteis
    { type: 'PROJECTILE', cooldownSeconds: 3, projectileSpeed: 260, projectileDamage: 8 },
    // invocação de Baratas Pequenas (máx. 2 simultâneas) — só na 2ª fase
    { type: 'SUMMON', cooldownSeconds: 6, summonEnemyId: 'barata-pequena', maxSummons: 2, phaseTwoOnly: true },
  ],
  thresholds: [
    // segunda fase aos 50% de HP: 20% mais rápida, libera invocação
    { atHpPercent: 50, speedBonusPercent: 20, unlockPhaseTwo: true, announce: 'FASE 2!' },
  ],
};

export const BOSS_BY_ID: ReadonlyMap<string, BossDefinition> = new Map(
  [INSETO_GIGANTE, CACHORRO_BRAVO, BARATA_VOADORA].map((boss) => [boss.id, boss]),
);
