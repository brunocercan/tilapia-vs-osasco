import type { StatusEffectSpec } from '../entities/StatusEffect';

/**
 * Definições de dados do jogo (SPEC-TECNICA §14).
 * Personagens, inimigos e equipamentos são principalmente dados.
 */

export interface Stats {
  maxHp: number;
  damage: number;
  /** Ataques por segundo. */
  attackSpeed: number;
  /** Alcance do ataque em px. */
  range: number;
  defense: number;
  /** Chance de crítico em % (teto global: 60% — SPEC-JOGO §5). */
  critChance: number;
  /** Chance de esquiva em % (teto global: 50% — SPEC-JOGO §5). */
  dodgeChance: number;
  /** Velocidade de movimento em px/s. */
  moveSpeed: number;
}

/** Efeito aplicado ao acertar um ataque (inimigos e passivas). */
export type OnHitEffectDefinition =
  | { kind: 'STATUS'; chance: number; effect: StatusEffectSpec }
  | { kind: 'KNOCKBACK'; chance: number; distancePx: number }
  | { kind: 'AOE'; chance: number; damage: number; radiusPx: number };

export interface UnitDefinition {
  id: string;
  name: string;
  baseStats: Stats;
  /** Cor do sprite placeholder (arte pixelada vem em fase futura). */
  color: string;
  /** Escala do placeholder visual (bosses são maiores). */
  spriteScale?: number;
}

/** Bônus de dano quando o próprio HP está baixo (Rato da Toca, §6). */
export interface LowHpDamageBonus {
  belowPercent: number;
  percent: number;
}

/** Passiva com parte descritiva (UI) e parte mecânica (sistemas). */
export interface PassiveDefinition {
  id: string;
  name: string;
  description: string;
  /** Bônus de atributo aplicados na criação do personagem (ex.: Cigarro). */
  statModifiers?: Partial<Stats>;
  /** Regeneração contínua de HP por segundo (ex.: equipamentos). */
  hpRegenPerSecond?: number;
  /**
   * Regeneração em janelas periódicas (Marmita/Tombas, v1.5.0): ativa por
   * `durationSeconds` a cada `cooldownSeconds` — em vez de constante.
   */
  periodicRegen?: { hpPerSecond: number; cooldownSeconds: number; durationSeconds: number };
  /** Efeitos ao acertar ataques (ex.: Moscowitta, Beckzito, Bomba Química). */
  onHitEffects?: OnHitEffectDefinition[];
}

export interface CharacterDefinition extends UnitDefinition {
  passive: PassiveDefinition;
}

export interface EnemyDefinition extends UnitDefinition {
  onHitEffects: OnHitEffectDefinition[];
  /** XP concedida ao ser derrotado (SPEC-JOGO §9). */
  xpReward: number;
  /** Efeito ao entrar em combate (Motoboy Apresado: +20% vel. por 3s). */
  onSpawnStatus?: StatusEffectSpec;
  /** +25% de dano abaixo de 50% HP (Rato da Toca). */
  lowHpDamageBonus?: LowHpDamageBonus;
}

/** Tipos de habilidade de boss (SPEC-JOGO §8). */
export type BossAbilityType = 'CHARGE' | 'AOE' | 'SLOW_AURA' | 'PROJECTILE' | 'SUMMON';

export interface BossAbilityDefinition {
  type: BossAbilityType;
  cooldownSeconds: number;
  /** Só liberada após o gatilho de segunda fase (Barata Voadora). */
  phaseTwoOnly?: boolean;
  /** CHARGE: multiplicador de velocidade e dano durante a investida. */
  speedMultiplier?: number;
  durationSeconds?: number;
  damageMultiplier?: number;
  /** CHARGE: redução de dano recebido durante a investida (Cachorro Belga). */
  damageReductionPercent?: number;
  /** AOE / SLOW_AURA: raio e força. */
  radiusPx?: number;
  slowPercent?: number;
  slowDurationSeconds?: number;
  /** PROJECTILE: velocidade e dano do projétil. */
  projectileSpeed?: number;
  projectileDamage?: number;
  /** SUMMON: inimigo invocado e limite simultâneo. */
  summonEnemyId?: string;
  maxSummons?: number;
}

/** Gatilho ao cruzar um percentual de HP para baixo (SPEC-JOGO §8). */
export interface BossThresholdTrigger {
  atHpPercent: number;
  /** Bônus permanente de velocidade (movimento e ataque). */
  speedBonusPercent?: number;
  /** Frenesi: bônus permanente adicional de vel. de ataque. */
  attackSpeedBonusPercent?: number;
  /** Executa uma investida imediata (Cachorro Belga a cada 25%). */
  chargeNow?: boolean;
  /** Libera habilidades marcadas como phaseTwoOnly (Barata Voadora). */
  unlockPhaseTwo?: boolean;
  announce?: string;
}

export interface BossDefinition extends UnitDefinition {
  isBoss: true;
  abilities: BossAbilityDefinition[];
  thresholds: BossThresholdTrigger[];
  xpReward: number;
}

/** Fase da run (SPEC-JOGO §2): waves de inimigos básicos + boss. */
export interface PhaseDefinition {
  id: string;
  /** Nome exibido no HUD. */
  name: string;
  /** Ondas de inimigos antes do boss. */
  waves: readonly (readonly string[])[];
  bossId: string;
  /** Teto do multiplicador de dificuldade nesta fase (§7). */
  difficultyCap: number;
  /** Fase infinita (v1.6.0): número da fase infinita (1 = FASE 4). */
  endlessNumber?: number;
  /**
   * Multiplicador extra de HP/dano de TODOS os inimigos da fase
   * (v1.6.0) — aplica-se junto ao escalonamento por tempo.
   */
  enemyStatMultiplier?: number;
}

/**
 * Equipamento como dado (SPEC-JOGO §4 / SPEC-TECNICA §14).
 * Adicionar equipamento = adicionar uma nova definição aqui.
 */
export interface EquipmentDefinition {
  id: string;
  name: string;
  description: string;
  /** Cor do marcador no HUD de batalha. */
  color: string;
  /** false = não acumula consigo mesmo (ex.: Marmita Premium). */
  stackable: boolean;
  /**
   * Raridade (v1.2.0): itens lendários são mais fortes e só aparecem por
   * chance — na recompensa pós-boss ou ao subir de nível.
   */
  rarity?: 'comum' | 'lendario';

  /** Modificadores percentuais multiplicativos aplicados ao equipar. */
  statPercents?: Partial<Record<keyof Stats, number>>;
  /** Bônus aditivos em pontos percentuais para chances (ex.: +8% esquiva). */
  chancePoints?: { dodgeChance?: number; critChance?: number };
  /** Bônus aditivo no multiplicador de crítico (Mouse Gamer: +0,5). */
  critMultiplierBonus?: number;
  /** Regeneração contínua (Queijo, Marmita Premium). */
  hpRegenPerSecond?: number;
  /** Regeneração extra abaixo de um limiar de HP (Queijo). */
  hpRegenLowHp?: { thresholdPercent: number; bonusPerSecond: number };
  /** Efeitos ao acertar ataques (RetardPocket, Chinelo Voador). */
  onHitEffects?: OnHitEffectDefinition[];
  /** Buff ao esquivar (Borracha-Solta). */
  onDodgeAttackSpeedBuff?: { percent: number; durationSeconds: number };
  /** Buff quando o HP cai abaixo de um limiar, com cooldown (Corotinho). */
  lowHpAttackSpeedBuff?: {
    thresholdPercent: number;
    percent: number;
    durationSeconds: number;
    cooldownSeconds: number;
  };
  /** Cura o portador quando a equipe derrota um inimigo (Copão de Refri). */
  healOnKill?: number;
  /** A cada N ataques, o próximo causa dano extra (Teclado Mecânico). */
  everyNAttacksBonus?: { attacks: number; bonusPercent: number };
  /** Cura instantânea única por batalha ao cair abaixo do limiar (Marmita de Ontem). */
  oncePerBattleHeal?: { belowPercent: number; healPercent: number };
  /** Bônus % na pontuação de inimigos derrotados — aplicado no ScoreSystem. */
  scoreKillBonusPercent?: number;
}

/** Estado de um equipamento colocado em um personagem durante a batalha. */
export interface EquippedItem {
  definition: EquipmentDefinition;
  cooldownSeconds: number;
  attackCounter: number;
  attackBonusQueued: boolean;
  usedOnce: boolean;
}
