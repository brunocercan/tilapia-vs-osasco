import { describe, expect, it } from 'vitest';
import { BossSystem, type BossEvent } from '../src/systems/BossSystem';
import { Fighter } from '../src/entities/Fighter';
import { createPlayerFighter } from '../src/entities/fighterFactory';
import { StatusEffectType } from '../src/entities/StatusEffect';
import { BARATA_VOADORA, CACHORRO_BRAVO, INSETO_GIGANTE } from '../src/data/bosses';
import { CHARACTERS } from '../src/data/characters';
import type { BossDefinition } from '../src/data/types';

interface Harness {
  boss: Fighter;
  system: BossSystem;
  events: BossEvent[];
  projectiles: Array<{ x: number; y: number; speed: number; damage: number }>;
  summons: string[];
  player: Fighter;
}

function makeBoss(def: BossDefinition): Harness {
  const boss = new Fighter(def, 'ENEMY', `boss-${def.id}`, { xpReward: def.xpReward });
  boss.x = 600;
  const player = createPlayerFighter(CHARACTERS[0]);
  player.x = 100;

  const harness: Harness = {
    boss,
    player,
    events: [],
    projectiles: [],
    summons: [],
    system: null as unknown as BossSystem,
  };
  harness.system = new BossSystem(def, boss, {
    onEvent: (event) => harness.events.push(event),
    spawnProjectile: (x, y, p) => harness.projectiles.push({ x, y, ...p }),
    summon: (enemyId) => harness.summons.push(enemyId),
    countAliveSummons: () => harness.summons.length,
  });
  return harness;
}

describe('BossSystem — mecânicas dos bosses (SPEC-JOGO §8)', () => {
  it('Inseto Gigante: fica 5% mais rápido a cada 20% de HP perdido', () => {
    const { boss, system, player } = makeBoss(INSETO_GIGANTE);
    const baseMove = boss.stats.moveSpeed;
    const baseAtk = boss.stats.attackSpeed;

    boss.hp = boss.stats.maxHp * 0.8;
    system.update([boss, player], 0.001);
    expect(boss.stats.moveSpeed).toBeCloseTo(baseMove * 1.05, 5);
    expect(boss.stats.attackSpeed).toBeCloseTo(baseAtk * 1.05, 5);

    // +5% acumulado em cada faixa (80/60/40/20 = 4 gatilhos)
    boss.hp = boss.stats.maxHp * 0.2;
    system.update([boss, player], 0.001);
    expect(boss.stats.moveSpeed).toBeCloseTo(baseMove * 1.05 ** 4, 5);
  });

  it('Inseto Gigante: aos 20% de HP entra em Frenesi (+20% vel. de ataque)', () => {
    const { boss, system, player, events } = makeBoss(INSETO_GIGANTE);
    const baseAtk = boss.stats.attackSpeed;

    boss.hp = boss.stats.maxHp * 0.2;
    system.update([boss, player], 0.001); // dispara 80/60/40/20 de uma vez

    expect(boss.stats.attackSpeed).toBeCloseTo(baseAtk * 1.05 ** 4 * 1.2, 5);
    expect(events.some((e) => e.text === 'FRENESI!')).toBe(true);
  });

  it('Cachorro Belga: a cada 25% de HP faz investida e recebe 30% menos dano durante', () => {
    const { boss, system, player } = makeBoss(CACHORRO_BRAVO);

    boss.hp = boss.stats.maxHp * 0.75;
    system.update([boss, player], 0.001);
    expect(system.isCharging).toBe(true);
    expect(boss.damageTakenMultiplier).toBeCloseTo(0.7, 5);

    // fim da investida: dano volta ao normal
    for (let t = 0; t < 0.5; t += 0.1) {
      system.update([boss, player], 0.1);
    }
    expect(system.isCharging).toBe(false);
    expect(boss.damageTakenMultiplier).toBe(1);
  });

  it('Cachorro Belga: latido reduz a vel. de ataque de personagens próximos', () => {
    const { boss, system, player, events } = makeBoss(CACHORRO_BRAVO);
    player.x = boss.x - 100; // dentro do raio do latido

    const before = player.stats.attackSpeed;
    // latido tem cooldown inicial de 7s; a investida de 6s vem antes
    for (let t = 0; t < 7.2; t += 0.1) {
      system.update([boss, player], 0.1);
    }
    expect(events.some((e) => e.text === 'LATIDO!')).toBe(true);
    expect(player.stats.attackSpeed).toBeCloseTo(before * 0.8, 5);
    expect(player.hasStatus(StatusEffectType.Slow)).toBe(true);
  });

  it('Barata Voadora: invocação bloqueada antes de 50% de HP', () => {
    const { boss, system, player, summons } = makeBoss(BARATA_VOADORA);
    for (let t = 0; t < 13; t += 0.1) {
      system.update([boss, player], 0.1);
    }
    expect(summons).toHaveLength(0);
  });

  it('Barata Voadora: na fase 2 invoca até 2 Baratas Pequenas e fica 20% mais rápida', () => {
    const { boss, system, player, summons, events } = makeBoss(BARATA_VOADORA);
    const baseMove = boss.stats.moveSpeed;

    boss.hp = boss.stats.maxHp * 0.5; // gatilho exato: hpPercent pequeno o suficiente
    system.update([boss, player], 0.001);

    expect(events.some((e) => e.text === 'FASE 2!')).toBe(true);
    expect(boss.stats.moveSpeed).toBeCloseTo(baseMove * 1.2, 5);

    // invoca até o limite de 2 simultâneas
    for (let t = 0; t < 7; t += 0.1) system.update([boss, player], 0.1);
    const firstCount = summons.length;
    expect(firstCount).toBeGreaterThanOrEqual(1);

    for (let t = 0; t < 40; t += 0.1) system.update([boss, player], 0.1);
    expect(summons.length).toBeLessThanOrEqual(2);
    expect(summons.every((id) => id === 'barata-pequena')).toBe(true);
  });

  it('Barata Voadora: dispara projéteis desde a fase 1', () => {
    const { boss, system, player, projectiles } = makeBoss(BARATA_VOADORA);
    for (let t = 0; t < 3.2; t += 0.1) {
      system.update([boss, player], 0.1);
    }
    expect(projectiles.length).toBeGreaterThanOrEqual(1);
    expect(projectiles[0].speed).toBe(260);
    expect(projectiles[0].damage).toBe(8);
  });

  it('investida do Inseto causa dano de contato no personagem', () => {
    const { boss, system, player } = makeBoss(INSETO_GIGANTE);
    player.x = boss.x + 10; // bem ao lado

    // a investida tem cooldown inicial de 5s
    for (let t = 0; t < 5.3 && player.hp === player.stats.maxHp; t += 0.05) {
      system.update([boss, player], 0.05);
    }
    expect(player.hp).toBeLessThan(player.stats.maxHp);
  });
});
