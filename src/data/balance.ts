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
     * v1.5.0: Marmita (Tombas) nerfada — regen constante virou janela
     * periódica de 3s; HP do Tombas caiu para 110 e os outros 4 ganharam +15%.
     * v1.5.2: chances de combate aumentadas (Moscowitta 17%, Beckzito 16%,
     * Cigarro +15%, Bomba Química 16%).
     */
    moscowitta: { chance: 17, duration: 3, tickInterval: 1, magnitude: 3 },
    marmita: { hpPerSecond: 6, cooldownSeconds: 8, durationSeconds: 3 },
    cigarro: { bonusDodgeChance: 15 },
    beckzito: { chance: 16, duration: 2 },
    bombaQuimica: { chance: 16, damage: 4, radiusPx: 70 },
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

  /**
   * Modo infinito (v1.3.0): continuar a run após as 3 fases. Inimigos
   * ficam mais fortes a cada ciclo — e o multiplicador de sobrevivência
   * segue crescendo, acumulando pontos de ranking.
   * v1.6.0: HP/dano dos inimigos sobem BASTANTE por fase infinita.
   */
  endless: {
    /** Crescimento do cap de dificuldade por ciclo completo (3 fases). */
    difficultyCapPerCycle: 0.5,
    /** Multiplicador de HP/dano extra por fase infinita (1ª infinita = ×1,5). */
    statPerEndlessPhase: 0.5,
  },

  /**
   * Mini-Kirk (v1.4.0): sub-chefe surpresa com pequena chance de surgir
   * no meio de qualquer fase. Derrotá-lo rende XP gorda.
   * v1.6.0: no modo infinito a chance cresce bastante por fase passada
   * e podem aparecer vários na mesma batalha.
   */
  miniKirk: {
    /** Chance (%) por wave, a partir da 2ª — máx. 1 por batalha na run padrão. */
    chancePerWave: 8,
    /** Chance extra (%) por wave para cada fase infinita passada. */
    endlessChancePerPhase: 15,
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
