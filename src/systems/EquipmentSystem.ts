import { BALANCE } from '../data/balance';
import { EQUIPMENTS, EQUIPMENT_BY_ID } from '../data/equipment';
import type { EquipmentDefinition, EquippedItem, Stats } from '../data/types';
import type { Fighter } from '../entities/Fighter';
import { StatusEffectType } from '../entities/StatusEffect';
import type { RandomService } from '../services/RandomService';
import { StatusEffectSystem } from './StatusEffectSystem';

export interface EquipmentTickEvent {
  x: number;
  y: number;
  text: string;
  color: string;
}

/** Quantidade de sugestões de equipamento após derrotar um boss (SPEC-JOGO §4). */
export const REWARD_OPTION_COUNT = 2;

/**
 * Aplica efeitos de equipamento e processa gatilhos (SPEC-JOGO §4/§5).
 * Tetos globais: esquiva 50%, crítico 60%, vel. de ataque +100% sobre a base.
 */
export class EquipmentSystem {
  /** Sorteia opções distintas de equipamento para a recompensa de boss. */
  static rollOptions(random: RandomService, count: number = REWARD_OPTION_COUNT): EquipmentDefinition[] {
    const pool = [...EQUIPMENTS];
    const options: EquipmentDefinition[] = [];
    while (pool.length > 0 && options.length < count) {
      const index = random.randomInt(0, pool.length - 1);
      options.push(pool.splice(index, 1)[0]);
    }
    return options;
  }

  static applyByIds(fighter: Fighter, equipmentIds: readonly string[]): EquippedItem[] {
    for (const id of equipmentIds) {
      const definition = EQUIPMENT_BY_ID.get(id);
      if (definition) {
        EquipmentSystem.apply(fighter, definition);
      }
    }
    return fighter.equipped;
  }

  static apply(fighter: Fighter, definition: EquipmentDefinition): EquippedItem | null {
    if (!definition.stackable && fighter.equipped.some((item) => item.definition.id === definition.id)) {
      return null; // ex.: Marmita Premium não acumula (§5)
    }
    if (fighter.equipped.length >= BALANCE.equipment.maxSlots) {
      return null;
    }

    if (definition.statPercents) {
      for (const key of Object.keys(definition.statPercents) as (keyof Stats)[]) {
        const percent = definition.statPercents[key];
        if (percent !== undefined) {
          fighter.stats[key] *= 1 + percent / 100;
        }
      }
    }
    if (definition.chancePoints) {
      // Chances são aditivas em pontos percentuais (ex.: +8% esquiva)
      fighter.stats.dodgeChance += definition.chancePoints.dodgeChance ?? 0;
      fighter.stats.critChance += definition.chancePoints.critChance ?? 0;
    }
    EquipmentSystem.clampGlobalCaps(fighter);
    fighter.hp = Math.min(fighter.hp, fighter.stats.maxHp);

    if (definition.critMultiplierBonus) {
      fighter.critMultiplierBonus += definition.critMultiplierBonus;
    }
    if (definition.hpRegenPerSecond) {
      fighter.hpRegenPerSecond += definition.hpRegenPerSecond;
    }
    if (definition.hpRegenLowHp) {
      fighter.hpRegenLowHpThresholdPercent = Math.max(
        fighter.hpRegenLowHpThresholdPercent,
        definition.hpRegenLowHp.thresholdPercent,
      );
      fighter.hpRegenLowHpBonusPerSecond += definition.hpRegenLowHp.bonusPerSecond;
    }
    if (definition.onHitEffects) {
      fighter.onHitEffects.push(...definition.onHitEffects);
    }

    const item: EquippedItem = {
      definition,
      cooldownSeconds: 0,
      attackCounter: 0,
      attackBonusQueued: false,
      usedOnce: false,
    };
    fighter.equipped.push(item);
    return item;
  }

  /** Tetos globais contra builds quebradas (SPEC-JOGO §5). */
  static clampGlobalCaps(fighter: Fighter): void {
    fighter.stats.dodgeChance = Math.min(50, fighter.stats.dodgeChance);
    fighter.stats.critChance = Math.min(60, fighter.stats.critChance);
    fighter.stats.attackSpeed = Math.min(fighter.baseStats.attackSpeed * 2, fighter.stats.attackSpeed);
  }

  /** Gatilhos contínuos: Corotinho (<30% HP) e Marmita de Ontem (1×/batalha). */
  update(fighters: readonly Fighter[], deltaSeconds: number, onTick?: (event: EquipmentTickEvent) => void): void {
    for (const fighter of fighters) {
      if (!fighter.alive || fighter.equipped.length === 0) {
        continue;
      }
      const hpPercent = (fighter.hp / fighter.stats.maxHp) * 100;

      for (const item of fighter.equipped) {
        const def = item.definition;
        item.cooldownSeconds = Math.max(0, item.cooldownSeconds - deltaSeconds);

        const buff = def.lowHpAttackSpeedBuff;
        if (buff && item.cooldownSeconds <= 0 && hpPercent < buff.thresholdPercent) {
          StatusEffectSystem.addEffect(fighter, {
            type: StatusEffectType.Frenzy,
            duration: buff.durationSeconds,
            magnitude: buff.percent / 100,
            statModifier: { stat: 'attackSpeed', multiplier: 1 + buff.percent / 100 },
          });
          item.cooldownSeconds = buff.cooldownSeconds;
          onTick?.({ x: fighter.x, y: fighter.y - 54, text: 'COROTINHO!', color: 'rgba(255, 214, 64, 1)' });
        }

        const heal = def.oncePerBattleHeal;
        if (heal && !item.usedOnce && hpPercent <= heal.belowPercent) {
          item.usedOnce = true;
          const amount = Math.round(fighter.stats.maxHp * (heal.healPercent / 100));
          const healed = Math.min(fighter.stats.maxHp, fighter.hp + amount) - fighter.hp;
          fighter.hp += healed;
          if (healed > 0) {
            onTick?.({ x: fighter.x, y: fighter.y - 54, text: `+${healed} MARMITA`, color: 'rgba(120, 255, 160, 1)' });
          }
        }
      }
    }
  }

  /**
   * Teclado Mecânico: conta ataques e informa o bônus percentual deste ataque
   * (a cada 10 ataques, o próximo causa +50% — SPEC-JOGO §4).
   */
  rollAttackBonusPercent(fighter: Fighter): number {
    let bonus = 0;
    for (const item of fighter.equipped) {
      const trigger = item.definition.everyNAttacksBonus;
      if (!trigger) {
        continue;
      }
      if (item.attackBonusQueued) {
        bonus += trigger.bonusPercent;
        item.attackBonusQueued = false;
      }
      item.attackCounter += 1;
      if (item.attackCounter % trigger.attacks === 0) {
        item.attackBonusQueued = true;
      }
    }
    return bonus;
  }

  /** Borracha-Solta: ao esquivar, +10% vel. de ataque por 2s. */
  onDodge(fighter: Fighter): void {
    for (const item of fighter.equipped) {
      const buff = item.definition.onDodgeAttackSpeedBuff;
      if (!buff) {
        continue;
      }
      StatusEffectSystem.addEffect(fighter, {
        type: StatusEffectType.Frenzy,
        duration: buff.durationSeconds,
        magnitude: buff.percent / 100,
        statModifier: { stat: 'attackSpeed', multiplier: 1 + buff.percent / 100 },
      });
    }
  }

  /** Copão de Refri: a equipe derrotou um inimigo → portador recupera HP. */
  onEnemyKilled(fighter: Fighter, onTick?: (event: EquipmentTickEvent) => void): void {
    for (const item of fighter.equipped) {
      const heal = item.definition.healOnKill;
      if (!heal || !fighter.alive) {
        continue;
      }
      const healed = Math.min(fighter.stats.maxHp, fighter.hp + heal) - fighter.hp;
      fighter.hp += healed;
      if (healed > 0) {
        onTick?.({ x: fighter.x, y: fighter.y - 44, text: `+${healed}`, color: 'rgba(232, 93, 93, 1)' });
      }
    }
  }
}
