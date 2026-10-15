import type { Stats, UnitDefinition, OnHitEffectDefinition, EquippedItem, LowHpDamageBonus } from '../data/types';
import type { StatusEffect } from './StatusEffect';

/** Extras opcionais na criação de uma unidade. */
export interface FighterExtras {
  onHitEffects?: readonly OnHitEffectDefinition[];
  xpReward?: number;
  lowHpDamageBonus?: LowHpDamageBonus;
}

export type Team = 'PLAYER' | 'ENEMY';

/**
 * Estado da regeneração periódica (Marmita/Tombas, v1.5.0):
 * regen ativo apenas dentro da janela de `durationSeconds`.
 */
export interface PeriodicRegenState {
  hpPerSecond: number;
  cooldownSeconds: number;
  durationSeconds: number;
  /** Tempo até a próxima ativação da janela. */
  timeToActivation: number;
  /** Tempo restante da janela ativa. */
  activeRemaining: number;
}

/**
 * Unidade de combate em tempo de execução (personagem ou inimigo).
 * Uma única classe para os dois lados: o comportamento difere apenas pelos dados.
 */
export class Fighter {
  readonly id: string;
  /** Id da definição (lookup de sprite, ex.: 'kiki', 'pernilongo'). */
  readonly spriteId: string;
  readonly name: string;
  readonly team: Team;
  readonly stats: Stats;
  /** Stats antes de equipamentos (base + passiva) — referência dos tetos §5. */
  baseStats: Stats;
  readonly color: string;
  readonly onHitEffects: OnHitEffectDefinition[];
  /** XP concedida ao derrotar esta unidade (inimigos). */
  readonly xpReward: number;

  hp: number;
  x = 0;
  y = 0;
  /** Direção do olhar: 1 = direita, -1 = esquerda. */
  facing: 1 | -1 = 1;
  attackCooldown = 0;
  attackAnim = 0;
  targetInRange = false;
  targetId: string | null = null;
  readonly statusEffects: StatusEffect[] = [];

  /** Regeneração contínua de HP/s (passiva Marmita, equipamentos). */
  hpRegenPerSecond = 0;
  /** Passiva Marmita (v1.5.0): janela periódica de regeneração. */
  periodicRegen: PeriodicRegenState | null = null;
  /** Bônus de regeneração abaixo de um limiar de HP (Queijo). */
  hpRegenLowHpThresholdPercent = 0;
  hpRegenLowHpBonusPerSecond = 0;
  /** Bônus aditivo no multiplicador de crítico (Mouse Gamer). */
  critMultiplierBonus = 0;
  /** Acumulador da regeneração (cura aplicada em passos inteiros — §5). */
  regenAccumulator = 0;
  /** Equipamentos nos 2 slots do personagem (SPEC-JOGO §4). */
  readonly equipped: EquippedItem[] = [];
  /** Bônus de dano com HP baixo (Rato da Toca, §6). */
  readonly lowHpDamageBonus?: LowHpDamageBonus;
  /** Multiplicador de dano recebido (Cachorro Belga durante a investida). */
  damageTakenMultiplier = 1;
  /** Escala visual (bosses maiores). */
  readonly spriteScale: number;

  constructor(
    definition: UnitDefinition,
    team: Team,
    instanceId: string,
    extras: FighterExtras = {},
  ) {
    this.id = instanceId;
    this.spriteId = definition.id;
    this.name = definition.name;
    this.team = team;
    this.stats = { ...definition.baseStats };
    this.baseStats = { ...definition.baseStats };
    this.color = definition.color;
    this.onHitEffects = [...(extras.onHitEffects ?? [])];
    this.xpReward = extras.xpReward ?? 0;
    this.lowHpDamageBonus = extras.lowHpDamageBonus;
    this.spriteScale = definition.spriteScale ?? 1;
    this.hp = this.stats.maxHp;
  }

  get alive(): boolean {
    return this.hp > 0;
  }

  get hpFraction(): number {
    return Math.max(0, this.hp / this.stats.maxHp);
  }

  hasStatus(type: StatusEffect['type']): boolean {
    return this.statusEffects.some((effect) => effect.type === type);
  }
}
