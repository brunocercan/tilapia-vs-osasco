import { describe, expect, it } from 'vitest';
import { DifficultySystem } from '../src/systems/DifficultySystem';
import { PHASES } from '../src/data/phases';
import { PERNILONGO } from '../src/data/enemies';

describe('DifficultySystem — escalonamento (SPEC-JOGO §7)', () => {
  it('multiplicador = 1 + (tempo_da_run_em_segundos / 60) * 0,15', () => {
    expect(DifficultySystem.multiplier(0, 10)).toBe(1);
    expect(DifficultySystem.multiplier(60, 10)).toBeCloseTo(1.15, 5);
    expect(DifficultySystem.multiplier(240, 10)).toBeCloseTo(1.6, 5);
  });

  it('respeita o teto da fase', () => {
    const capFase1 = PHASES[0].difficultyCap;
    expect(DifficultySystem.multiplier(600, capFase1)).toBe(capFase1);
  });

  it('escala principalmente HP e dano, e metade da proporção em vel. de ataque', () => {
    const scaled = DifficultySystem.scaleStats(PERNILONGO.baseStats, 1.3);
    expect(scaled.maxHp).toBe(Math.round(30 * 1.3));
    expect(scaled.damage).toBe(Math.round(6 * 1.3));
    expect(scaled.attackSpeed).toBeCloseTo(1.6 * 1.15, 2);
    // atributos não escalados
    expect(scaled.defense).toBe(PERNILONGO.baseStats.defense);
    expect(scaled.moveSpeed).toBe(PERNILONGO.baseStats.moveSpeed);
  });

  it('nunca deixa o dano abaixo de 1', () => {
    const scaled = DifficultySystem.scaleStats({ ...PERNILONGO.baseStats, damage: 1 }, 0.5);
    expect(scaled.damage).toBe(1);
  });
});
