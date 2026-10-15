import { describe, expect, it } from 'vitest';
import { BattleScene, type BattleResult } from '../src/game/BattleScene';
import { RandomService } from '../src/services/RandomService';
import { RunState } from '../src/entities/RunState';
import { CHARACTERS } from '../src/data/characters';
import { PHASES } from '../src/data/phases';
import { ExperienceSystem } from '../src/systems/ExperienceSystem';
import { LEGENDARY_EQUIPMENTS } from '../src/data/equipment';
import type { Fighter } from '../src/entities/Fighter';

function simulateBattle(random: RandomService): { result: BattleResult | null; runState: RunState } {
  let result: BattleResult | null = null;
  const runState = new RunState();
  const scene = new BattleScene(
    [CHARACTERS[0], CHARACTERS[1]],
    PHASES[0],
    random,
    runState,
    (r) => { result = r; },
  );
  scene.layout(800, 600);

  // Simula no máximo 5 minutos de batalha a 60 FPS (SPEC-JOGO §2)
  for (let frame = 0; frame < 60 * 300 && !result; frame++) {
    scene.update(1 / 60);
  }
  return { result, runState };
}

describe('BattleScene — integração da Fase 1 (waves + boss)', () => {
  it('a batalha sempre termina (sem travar)', () => {
    const { result } = simulateBattle(new RandomService());
    expect(result).not.toBeNull();
    expect(result!.kills).toBeGreaterThan(0);
    expect(result!.elapsedSeconds).toBeGreaterThan(0);
  });

  it('com RNG determinístico, o time derrota a Fase 1 completa', () => {
    const { result, runState } = simulateBattle(new RandomService(() => 0.5));
    expect(result).not.toBeNull();
    expect(result!.victory).toBe(true);
    // 3 waves (9 inimigos) + 1 boss
    expect(result!.kills).toBe(10);
    expect(result!.level).toBe(runState.level);
    expect(runState.level).toBeGreaterThan(1);
  });

  it('o tempo de batalha avança o relógio da run (escalonamento §7)', () => {
    const { result, runState } = simulateBattle(new RandomService(() => 0.5));
    expect(result).not.toBeNull();
    expect(runState.elapsedSeconds).toBeGreaterThan(30);
  });
});

describe('BattleScene — level up cura e renasce o time', () => {
  it('ao subir de nível, os dois personagens ficam com vida cheia e o morto renasce', () => {
    const runState = new RunState();
    const scene = new BattleScene(
      [CHARACTERS[0], CHARACTERS[1]],
      PHASES[0],
      new RandomService(() => 0.5),
      runState,
      () => {},
    );
    scene.layout(800, 600);

    ExperienceSystem.grantXp(runState, ExperienceSystem.xpForNextLevel(1)); // nível 2
    const players: Fighter[] = (scene as unknown as { fighters: Fighter[] }).fighters
      .filter((f) => f.team === 'PLAYER');
    players[0].hp = 30;                 // vivo, mas machucado
    players[1].hp = 0;                 // morto
    expect(players[1].alive).toBe(false);

    (scene as unknown as { applyLevelUp: () => void }).applyLevelUp();

    // Vida curada por completo
    expect(players[0].hp).toBe(players[0].stats.maxHp);
    // Morto renasce com vida cheia
    expect(players[1].alive).toBe(true);
    expect(players[1].hp).toBe(players[1].stats.maxHp);
  });

  it('subir de nível pode render um item lendário, equipado e persistido na run', () => {
    const runState = new RunState();
    const scene = new BattleScene(
      [CHARACTERS[0], CHARACTERS[1]],
      PHASES[0],
      new RandomService(() => 0.01), // chance(15) sempre rola
      runState,
      () => {},
    );
    scene.layout(800, 600);

    ExperienceSystem.grantXp(runState, ExperienceSystem.xpForNextLevel(1)); // nível 2
    (scene as unknown as { applyLevelUp: () => void }).applyLevelUp();

    const legendaryIds = new Set(LEGENDARY_EQUIPMENTS.map((e) => e.id));
    const granted = [...runState.equipmentIds.values()].flat();
    expect(granted.some((id) => legendaryIds.has(id))).toBe(true);

    // Auto-equipado no personagem com menos itens (aqui: o 1º, Kiki)
    const players: Fighter[] = (scene as unknown as { fighters: Fighter[] }).fighters
      .filter((f) => f.team === 'PLAYER');
    expect(players[0].equipped).toHaveLength(1);
    expect(legendaryIds.has(players[0].equipped[0].definition.id)).toBe(true);
  });

  it('com a chance falhando, subir de nível não dá item lendário', () => {
    const runState = new RunState();
    const scene = new BattleScene(
      [CHARACTERS[0], CHARACTERS[1]],
      PHASES[0],
      new RandomService(() => 0.99), // chance(15) nunca rola
      runState,
      () => {},
    );
    scene.layout(800, 600);

    ExperienceSystem.grantXp(runState, ExperienceSystem.xpForNextLevel(1));
    (scene as unknown as { applyLevelUp: () => void }).applyLevelUp();

    expect([...runState.equipmentIds.values()].flat()).toHaveLength(0);
  });
});
