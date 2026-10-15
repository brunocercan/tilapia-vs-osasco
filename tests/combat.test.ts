import { describe, expect, it } from 'vitest';
import { rollAttack } from '../src/systems/CombatSystem';
import { RandomService } from '../src/services/RandomService';
import { BALANCE } from '../src/data/balance';
import type { Stats } from '../src/data/types';

function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    maxHp: 100,
    damage: 10,
    attackSpeed: 1,
    range: 40,
    defense: 0,
    critChance: 0,
    dodgeChance: 0,
    moveSpeed: 60,
    ...overrides,
  };
}

describe('rollAttack — cálculo de dano (SPEC-TECNICA §15)', () => {
  it('aplica dano base menos defesa', () => {
    const rng = new RandomService(() => 0.99); // sem esquiva, sem crítico
    const result = rollAttack(makeStats({ damage: 10 }), makeStats({ defense: 3 }), rng);
    expect(result).toEqual({ damage: 7, crit: false, dodged: false });
  });

  it('nunca causa dano abaixo do mínimo', () => {
    const rng = new RandomService(() => 0.99);
    const result = rollAttack(makeStats({ damage: 5 }), makeStats({ defense: 99 }), rng);
    expect(result.damage).toBe(BALANCE.combat.minDamage);
  });

  it('crítico multiplica o dano antes da defesa', () => {
    // chance(x): x>0 → true quando fonte*100 < x. Fonte 0 retorna true para qualquer x>0.
    const rng = new RandomService(() => 0.0);
    const result = rollAttack(
      makeStats({ damage: 10, critChance: 5 }),
      makeStats({ defense: 2 }),
      rng,
    );
    expect(result.crit).toBe(true);
    expect(result.damage).toBe(Math.round(10 * BALANCE.combat.critMultiplier) - 2);
  });

  it('esquiva do defensor zera o dano', () => {
    const rng = new RandomService(() => 0.0);
    const result = rollAttack(
      makeStats({ damage: 10 }),
      makeStats({ dodgeChance: 50 }),
      rng,
    );
    expect(result).toEqual({ damage: 0, crit: false, dodged: true });
  });
});
