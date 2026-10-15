/**
 * Números globais de balanceamento (SPEC-TECNICA §18).
 * Todos os ajustes de balanceamento ficam em arquivos de dados.
 */
export const BALANCE = {
  combat: {
    critMultiplier: 1.5,
    minDamage: 1,
    /** Duração do "flash" de ataque no placeholder visual (s). */
    attackAnimDuration: 0.2,
  },

  arena: {
    /** Posição inicial dos personagens, em fração da largura. */
    playerSpawnX: 0.15,
    /** Primeira posição de spawn dos inimigos, em fração da largura. */
    enemySpawnX: 0.8,
    enemySpawnSpacing: 70,
    /** Trilhas verticais da arena, em fração da altura. */
    laneYFractions: [0.58, 0.74],
    fighterHalfWidth: 16,
    fighterHeight: 40,
    /** Pausa após o fim do combate antes de sair da tela de batalha (s). */
    endDelaySeconds: 1.4,
  },

  effects: {
    /** DoT do Pernilongo: pequeno dano contínuo por 2 segundos (SPEC-JOGO §6). */
    pernilongoDot: { duration: 2, tickInterval: 0.5, magnitude: 1 },
    /** Empurrão da Capivara Nervosa: 10% de chance (SPEC-JOGO §6). */
    capivaraKnockback: { chance: 10, distancePx: 80 },

    /**
     * Passivas dos personagens (SPEC-JOGO §3), rebalanceado em out/2026:
     * buffs de compensação de dificuldade — o jogo estava difícil.
     * HP dos personagens acompanham os stats em characters.ts.
     */
    moscowitta: { chance: 6, duration: 3, tickInterval: 1, magnitude: 3 },
    marmita: { regenPerSecond: 5 },
    cigarro: { bonusDodgeChance: 10 },
    beckzito: { chance: 8, duration: 2 },
    bombaQuimica: { chance: 5, damage: 4, radiusPx: 70 },
  },

  equipment: {
    /** Slots por personagem (SPEC-JOGO §4). */
    maxSlots: 2,
  },

  /** Pontuação (SPEC-JOGO §10). Números iniciais de balanceamento. */
  score: {
    enemyKill: 10,
    bossKill: 150,
    phaseClear: 100,
    levelBonus: 25,
    survivorBonus: 50,
    /**
     * Run alvo ~5 min: bônus por segundo abaixo do alvo. Propositalmente
     * modesto (§10): uma run fraca não pontua alto só por terminar rápido.
     */
    targetRunSeconds: 300,
    speedBonusPerSecond: 4,
  },

  /** Progressão de experiência (SPEC-JOGO §9). */
  progression: {
    maxLevel: 10,
    /** XP necessária = xpBase + (nível - 1) * xpPerLevel. */
    xpBase: 10,
    xpPerLevel: 5,
    /** Ganhos por nível (leves): % sobre o valor atual. */
    levelUp: { maxHpPercent: 6, damagePercent: 6 },
  },
} as const;

/** Atributo secundário aumentado por nível (rotação determinística). */
export type SecondaryStatBoost =
  | { stat: 'attackSpeed'; percent: number }
  | { stat: 'defense' | 'critChance' | 'dodgeChance'; flat: number };

export const SECONDARY_STAT_ROTATION: readonly SecondaryStatBoost[] = [
  { stat: 'attackSpeed', percent: 4 },
  { stat: 'defense', flat: 1 },
  { stat: 'critChance', flat: 2 },
  { stat: 'dodgeChance', flat: 2 },
];
