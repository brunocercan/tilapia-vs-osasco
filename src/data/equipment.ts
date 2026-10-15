import { StatusEffectType } from '../entities/StatusEffect';
import type { EquipmentDefinition } from './types';

/**
 * Os equipamentos (SPEC-JOGO §4): 18 comuns + 6 lendários (v1.2.0).
 * Tudo como dados; gatilhos interpretados pelo EquipmentSystem.
 * Regras §5: Marmita Premium não acumula; tetos globais aplicados no equip.
 * Lendários são mais fortes e só surgem por chance: level up (auto-equip)
 * ou como opção na recompensa pós-boss.
 */
export const EQUIPMENTS: readonly EquipmentDefinition[] = [
  {
    id: 'tadalinha',
    name: 'Tadalinha',
    description: '+5% velocidade de ataque.',
    color: '#f2e14c',
    stackable: true,
    statPercents: { attackSpeed: 5 },
  },
  {
    id: 'corotinho',
    name: 'Corotinho',
    description: '+8% HP máximo. Abaixo de 30% HP: +5% vel. de ataque por 5s (cooldown 15s).',
    color: '#d4a017',
    stackable: true,
    statPercents: { maxHp: 8 },
    lowHpAttackSpeedBuff: { thresholdPercent: 30, percent: 5, durationSeconds: 5, cooldownSeconds: 15 },
  },
  {
    id: 'retardpocket',
    name: 'RetardPocket',
    description: '8% de chance de reduzir a vel. de ataque do inimigo em 20% por 2s.',
    color: '#7d8c99',
    stackable: true,
    onHitEffects: [
      {
        kind: 'STATUS',
        chance: 8,
        effect: {
          type: StatusEffectType.Slow,
          duration: 2,
          magnitude: 0.2,
          statModifier: { stat: 'attackSpeed', multiplier: 0.8 },
        },
      },
    ],
  },
  {
    id: 'borracha-solta',
    name: 'Borracha-Solta',
    description: '+5% esquiva. Ao esquivar: +10% vel. de ataque por 2s.',
    color: '#e26d5c',
    stackable: true,
    chancePoints: { dodgeChance: 5 },
    onDodgeAttackSpeedBuff: { percent: 10, durationSeconds: 2 },
  },
  {
    id: 'queijo',
    name: 'Queijo',
    description: '+2 HP/s. Abaixo de 40% HP: regeneração aumenta para +4 HP/s.',
    color: '#f7d354',
    stackable: true,
    hpRegenPerSecond: 2,
    hpRegenLowHp: { thresholdPercent: 40, bonusPerSecond: 2 },
  },
  {
    id: 'olympus-burguer',
    name: 'OlympusBurguer',
    description: '+10% dano, -5% vel. de ataque. Para quem bate pesado.',
    color: '#b5651d',
    stackable: true,
    statPercents: { damage: 10, attackSpeed: -5 },
  },
  {
    id: 'chinelo-voador',
    name: 'Chinelo Voador',
    description: '+8% alcance. 5% de chance de interromper o ataque inimigo por 0,5s.',
    color: '#3fa7d6',
    stackable: true,
    statPercents: { range: 8 },
    onHitEffects: [
      {
        kind: 'STATUS',
        chance: 5,
        effect: { type: StatusEffectType.Stun, duration: 0.5, magnitude: 0 },
      },
    ],
  },
  {
    id: 'bone-aba-reta',
    name: 'Boné de Aba Reta',
    description: '+5% HP máximo, +5% defesa.',
    color: '#284b63',
    stackable: true,
    statPercents: { maxHp: 5, defense: 5 },
  },
  {
    id: 'fone-estourado',
    name: 'Fone Estourado',
    description: '+10% vel. de ataque, -5% defesa.',
    color: '#ef476f',
    stackable: true,
    statPercents: { attackSpeed: 10, defense: -5 },
  },
  {
    id: 'copao-refri',
    name: 'Copão de Refri',
    description: 'Ao derrotar um inimigo, recupera 3 HP (efeito instantâneo, não acumula).',
    color: '#e5383b',
    stackable: true,
    healOnKill: 3,
  },
  {
    id: 'marmita-premium',
    name: 'Marmita Premium',
    description: '+3 HP/s, +5% HP máximo. Não acumula com outra Marmita Premium.',
    color: '#8ac926',
    stackable: false,
    statPercents: { maxHp: 5 },
    hpRegenPerSecond: 3,
  },
  {
    id: 'mouse-gamer',
    name: 'Mouse Gamer',
    description: '+8% chance de crítico. Críticos causam +50% de dano.',
    color: '#7209b7',
    stackable: true,
    chancePoints: { critChance: 8 },
    // "+50% de dano" nos críticos: multiplicador 1,5 + 0,5 = 2,0 (aditivo)
    critMultiplierBonus: 0.5,
  },
  {
    id: 'teclado-mecanico',
    name: 'Teclado Mecânico',
    description: '+5% dano. A cada 10 ataques, o próximo causa +50% de dano.',
    color: '#4361ee',
    stackable: true,
    statPercents: { damage: 5 },
    everyNAttacksBonus: { attacks: 10, bonusPercent: 50 },
  },
  {
    id: 'oculos-escuros',
    name: 'Óculos Escuros',
    description: '+8% esquiva, -5% alcance.',
    color: '#212529',
    stackable: true,
    chancePoints: { dodgeChance: 8 },
    statPercents: { range: -5 },
  },
  {
    id: 'chave-portao',
    name: 'Chave do Portão',
    description: '+10% vel. de movimentação, +5% vel. de ataque.',
    color: '#adb5bd',
    stackable: true,
    statPercents: { moveSpeed: 10, attackSpeed: 5 },
  },
  {
    id: 'vale-transporte',
    name: 'Vale-Transporte',
    description: '+5% vel. de movimentação, +10% pontuação por inimigo derrotado.',
    color: '#ff9f1c',
    stackable: true,
    statPercents: { moveSpeed: 5 },
    scoreKillBonusPercent: 10,
  },
  {
    id: 'marmita-ontem',
    name: 'Marmita de Ontem',
    description: 'Ao cair abaixo de 50% da vida máxima, recupera 15% da vida. 1× por fase.',
    color: '#606c38',
    stackable: true,
    oncePerBattleHeal: { belowPercent: 50, healPercent: 15 },
  },
  {
    id: 'carteira-vazia',
    name: 'Carteira Vazia',
    description: '-5% HP máximo, +15% dano. Risco/recompensa.',
    color: '#6c757d',
    stackable: true,
    statPercents: { maxHp: -5, damage: 15 },
  },

  // ---------- Lendários (v1.2.0): chance no level up e ao derrotar o boss ----------

  {
    id: 'marmita-avo',
    name: 'Marmita da Avó',
    description: '+20% HP máximo, +6 HP/s de regeneração. Não acumula consigo mesma.',
    color: '#ffd700',
    stackable: false,
    rarity: 'lendario',
    statPercents: { maxHp: 20 },
    hpRegenPerSecond: 6,
  },
  {
    id: 'pc-tianrao',
    name: 'PC do Tianrão',
    description: '+25% dano, +10% vel. de ataque. A máquina definitiva.',
    color: '#ff6ec7',
    stackable: true,
    rarity: 'lendario',
    statPercents: { damage: 25, attackSpeed: 10 },
  },
  {
    id: 'chinelo-bumerangue',
    name: 'Chinelo Bumerangue',
    description: '+10% alcance, 12% de chance de atordoar por 1s ao acertar.',
    color: '#00e5ff',
    stackable: true,
    rarity: 'lendario',
    statPercents: { range: 10 },
    onHitEffects: [
      {
        kind: 'STATUS',
        chance: 12,
        effect: { type: StatusEffectType.Stun, duration: 1, magnitude: 0 },
      },
    ],
  },
  {
    id: 'corote-fim-de-ano',
    name: 'Corote de Fim de Ano',
    description: '+15% de chance de crítico; críticos causam +75% de dano.',
    color: '#ff4757',
    stackable: true,
    rarity: 'lendario',
    chancePoints: { critChance: 15 },
    critMultiplierBonus: 0.75,
  },
  {
    id: 'tennis-furacao',
    name: 'Tênis do Furacão',
    description: '+15% esquiva, +15% vel. de movimento. Ao esquivar: +20% vel. de ataque por 3s.',
    color: '#7cff6b',
    stackable: true,
    rarity: 'lendario',
    statPercents: { moveSpeed: 15 },
    chancePoints: { dodgeChance: 15 },
    onDodgeAttackSpeedBuff: { percent: 20, durationSeconds: 3 },
  },
  {
    id: 'colar-tilapia',
    name: 'Colar do Grupo Tilápia',
    description: '+25% de pontuação por inimigo derrotado, +5% vel. de movimento.',
    color: '#ffd700',
    stackable: true,
    rarity: 'lendario',
    statPercents: { moveSpeed: 5 },
    scoreKillBonusPercent: 25,
  },
];

export const EQUIPMENT_BY_ID: ReadonlyMap<string, EquipmentDefinition> = new Map(
  EQUIPMENTS.map((equipment) => [equipment.id, equipment]),
);

/** Itens comuns: pool das recompensas normais pós-boss. */
export const COMMON_EQUIPMENTS: readonly EquipmentDefinition[] = EQUIPMENTS.filter(
  (equipment) => equipment.rarity !== 'lendario',
);

/** Itens lendários: mais fortes, surgem por chance (level up / boss). */
export const LEGENDARY_EQUIPMENTS: readonly EquipmentDefinition[] = EQUIPMENTS.filter(
  (equipment) => equipment.rarity === 'lendario',
);
