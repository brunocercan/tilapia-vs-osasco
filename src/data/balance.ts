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
     * Passivas dos personagens (SPEC-JOGO §3), 2ª rodada de buffs (v1.2.0,
     * out/2026): +~15% nos números principais — o jogo continuava difícil.
     * HP dos personagens acompanham os stats em characters.ts.
     */
    moscowitta: { chance: 7, duration: 3, tickInterval: 1, magnitude: 3 },
    marmita: { regenPerSecond: 6 },
    cigarro: { bonusDodgeChance: 12 },
    beckzito: { chance: 9, duration: 2 },
    bombaQuimica: { chance: 6, damage: 4, radiusPx: 70 },
  },

  equipment: {
    /** Slots por personagem (SPEC-JOGO §4). */
    maxSlots: 2,
    /** Chance (%) de uma opção lendária aparecer na recompensa pós-boss. */
    legendaryChanceOnBoss: 35,
    /** Chance (%) de ganhar um item lendário direto ao subir de nível. */
    legendaryChanceOnLevelUp: 15,
  },

  /**
   * Pontuação (SPEC-JOGO §10), rebalanceada em out/2026:
   * score = pontos por inimigos derrotados × multiplicador de sobrevivência.
   * O multiplicador cresce com o tempo vivo na run ativa — sobreviver
   * mais tempo vale mais; tempo sozinho não gera ponto nenhum.
   */
  score: {
    enemyKill: 10,
    bossKill: 150,
    /** Multiplicador por tempo vivo: +0,1 a cada minuto de run. */
    survivalMultiplierPerMinute: 0.1,
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
