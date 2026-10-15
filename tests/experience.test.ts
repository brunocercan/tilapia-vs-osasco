import { describe, expect, it } from 'vitest';
import { ExperienceSystem } from '../src/systems/ExperienceSystem';
import { LevelSystem } from '../src/systems/LevelSystem';
import { RunState } from '../src/entities/RunState';
import { createPlayerFighter } from '../src/entities/fighterFactory';
import { CHARACTERS } from '../src/data/characters';
import { BALANCE } from '../src/data/balance';

describe('ExperienceSystem — SPEC-JOGO §9', () => {
  it('XP necessária = 10 + (nível - 1) * 5', () => {
    expect(ExperienceSystem.xpForNextLevel(1)).toBe(10);
    expect(ExperienceSystem.xpForNextLevel(2)).toBe(15);
    expect(ExperienceSystem.xpForNextLevel(3)).toBe(20);
  });

  it('sobe de nível ao atingir a XP necessária', () => {
    const state = new RunState();
    expect(ExperienceSystem.grantXp(state, 10)).toBe(1);
    expect(state.level).toBe(2);
    expect(state.xp).toBe(0);
  });

  it('acumula XP excedente para o próximo nível', () => {
    const state = new RunState();
    ExperienceSystem.grantXp(state, 12); // 10 para o nível 2, sobram 2
    expect(state.level).toBe(2);
    expect(state.xp).toBe(2);
  });

  it('pode conceder vários níveis de uma vez', () => {
    const state = new RunState();
    expect(ExperienceSystem.grantXp(state, 45)).toBe(3); // 10 + 15 + 20
    expect(state.level).toBe(4);
  });

  it('respeita o nível máximo', () => {
    const state = new RunState();
    ExperienceSystem.grantXp(state, 9999);
    expect(state.level).toBe(BALANCE.progression.maxLevel);
    expect(state.xp).toBe(0);
    expect(ExperienceSystem.grantXp(state, 100)).toBe(0);
  });
});

describe('LevelSystem — ganho de nível (SPEC-JOGO §9)', () => {
  it('aumenta HP máximo e cura a vida completamente', () => {
    const fighter = createPlayerFighter(CHARACTERS[0]); // Kiki base maxHp dinâmico
    fighter.hp = 50;
    const baseHp = fighter.stats.maxHp;     // lê a partir do personagem
    LevelSystem.applyLevelUp(fighter, 2);
    const expectedMaxHp = Math.round(baseHp * 1.06);
    expect(fighter.stats.maxHp).toBe(expectedMaxHp);
    expect(fighter.hp).toBe(expectedMaxHp); // cura total no level up
  });

  it('renasce um personagem morto no level up (vida cheia)', () => {
    const fighter = createPlayerFighter(CHARACTERS[0]);
    fighter.hp = 0;
    expect(fighter.alive).toBe(false);
    LevelSystem.applyLevelUp(fighter, 2);
    expect(fighter.alive).toBe(true);
    expect(fighter.hp).toBe(fighter.stats.maxHp);
  });

  it('aumenta o dano levemente', () => {
    const fighter = createPlayerFighter(CHARACTERS[0]); // 10 dano
    LevelSystem.applyLevelUp(fighter, 2);
    expect(fighter.stats.damage).toBeGreaterThan(10);
  });

  it('gira o atributo secundário deterministicamente', () => {
    const fighter = createPlayerFighter(CHARACTERS[0]);
    const base = { ...fighter.stats };

    LevelSystem.applyLevelUp(fighter, 2); // velocidade de ataque +4%
    expect(fighter.stats.attackSpeed).toBeCloseTo(base.attackSpeed * 1.04, 2);

    LevelSystem.applyLevelUp(fighter, 3); // defesa +1
    expect(fighter.stats.defense).toBe(base.defense + 1);

    LevelSystem.applyLevelUp(fighter, 4); // crítico +2
    expect(fighter.stats.critChance).toBe(base.critChance + 2);

    LevelSystem.applyLevelUp(fighter, 5); // esquiva +2
    expect(fighter.stats.dodgeChance).toBe(base.dodgeChance + 2);
  });
});
