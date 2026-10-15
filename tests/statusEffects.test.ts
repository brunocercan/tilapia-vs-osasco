import { describe, expect, it } from 'vitest';
import { StatusEffectSystem } from '../src/systems/StatusEffectSystem';
import { StatusEffectType } from '../src/entities/StatusEffect';
import { Fighter } from '../src/entities/Fighter';
import { CHARACTERS } from '../src/data/characters';

function makeFighter(): Fighter {
  return new Fighter(CHARACTERS[0], 'PLAYER', 'test-1');
}

const POISON = {
  type: StatusEffectType.Poison,
  duration: 3,
  tickInterval: 1,
  magnitude: 3,
};

describe('StatusEffectSystem — Veneno (SPEC-JOGO §3/§5)', () => {
  it('causa dano por tick respeitando o intervalo', () => {
    const system = new StatusEffectSystem();
    const fighter = makeFighter();
    StatusEffectSystem.addEffect(fighter, { ...POISON });

    // 1s completo → 1 tick de 3
    system.update([fighter], 1.0);
    expect(fighter.hp).toBe(fighter.stats.maxHp - 3);
  });

  it('expira após a duração e para de causar dano', () => {
    const system = new StatusEffectSystem();
    const fighter = makeFighter();
    StatusEffectSystem.addEffect(fighter, { ...POISON });

    // 5s: apenas 3 ticks (duração 3s) → -9 HP
    system.update([fighter], 5.0);
    expect(fighter.hp).toBe(fighter.stats.maxHp - 9);
    expect(fighter.hasStatus(StatusEffectType.Poison)).toBe(false);
  });

  it('não acumula enquanto o mesmo tipo está ativo', () => {
    const fighter = makeFighter();
    expect(StatusEffectSystem.addEffect(fighter, { ...POISON })).toBe(true);
    expect(StatusEffectSystem.addEffect(fighter, { ...POISON })).toBe(false);
    expect(fighter.statusEffects).toHaveLength(1);
  });

  it('permite reaplicar após o término do efeito', () => {
    const system = new StatusEffectSystem();
    const fighter = makeFighter();
    StatusEffectSystem.addEffect(fighter, { ...POISON });
    system.update([fighter], 5.0); // expira
    expect(StatusEffectSystem.addEffect(fighter, { ...POISON })).toBe(true);
  });

  it('veneno pode matar, reduzindo HP a zero', () => {
    const system = new StatusEffectSystem();
    const fighter = makeFighter();
    fighter.hp = 2;
    StatusEffectSystem.addEffect(fighter, { ...POISON });
    system.update([fighter], 1.0);
    expect(fighter.hp).toBe(0);
    expect(fighter.alive).toBe(false);
  });
});
