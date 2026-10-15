import { describe, expect, it } from 'vitest';
import { BattleScene } from '../src/game/BattleScene';
import { RandomService } from '../src/services/RandomService';
import { RunState } from '../src/entities/RunState';
import { CHARACTERS } from '../src/data/characters';
import { PHASES, endlessPhaseFor } from '../src/data/phases';
import { ENEMY_BY_ID, MINI_KIRK } from '../src/data/enemies';
import { enemySpriteRows, MINI_KIRK_SPRITE_ROWS } from '../src/render/enemySprites';
import { BALANCE } from '../src/data/balance';
import type { PhaseDefinition } from '../src/data/types';
import type { Fighter } from '../src/entities/Fighter';

interface SceneInternals {
  waveIndex: number;
  fighters: Fighter[];
  spawnWave: (enemyIds: readonly string[]) => void;
}

function sceneWith(source: () => number, phase: PhaseDefinition = PHASES[0]): SceneInternals {
  const scene = new BattleScene(
    [CHARACTERS[0], CHARACTERS[1]],
    phase,
    new RandomService(source),
    new RunState(),
    () => {},
  );
  scene.layout(800, 600);
  return scene as unknown as SceneInternals;
}

describe('Mini-Kirk — sub-chefe surpresa (v1.4.0)', () => {
  it('está registrado, é maior que inimigos normais e dá XP gorda', () => {
    expect(ENEMY_BY_ID.get('mini-kirk')).toBe(MINI_KIRK);
    expect(MINI_KIRK.spriteScale).toBeGreaterThan(1);
    expect(MINI_KIRK.baseStats.maxHp).toBeGreaterThan(90); // mais que a Capivara
    expect(MINI_KIRK.baseStats.maxHp).toBeLessThan(300);   // menos que um boss
    expect(MINI_KIRK.xpReward).toBeGreaterThanOrEqual(15);
  });

  it('tem sprite próprio maior (rosto + corpo)', () => {
    expect(enemySpriteRows('mini-kirk')).toBe(MINI_KIRK_SPRITE_ROWS);
    expect(MINI_KIRK_SPRITE_ROWS).toBeGreaterThan(enemySpriteRows('pernilongo'));
  });

  it('nunca aparece na primeira wave, mesmo com sorte máxima', () => {
    const scene = sceneWith(() => 0);
    scene.waveIndex = 0; // 1ª wave
    scene.spawnWave(['pernilongo']);
    expect(scene.fighters.some((f) => f.id.startsWith('mini-kirk'))).toBe(false);
  });

  it('aparece a partir da 2ª wave quando a chance rola', () => {
    const scene = sceneWith(() => 0.01); // chance(8) sempre rola
    scene.waveIndex = 1; // 2ª wave
    scene.spawnWave(['pernilongo', 'pernilongo']);
    const kirks = scene.fighters.filter((f) => f.id.startsWith('mini-kirk'));
    expect(kirks).toHaveLength(1);
    expect(kirks[0].team).toBe('ENEMY');
    expect(kirks[0].stats.maxHp).toBeGreaterThan(100);
  });

  it('aparece no máximo uma vez por batalha', () => {
    const scene = sceneWith(() => 0.01);
    scene.waveIndex = 1;
    scene.spawnWave(['pernilongo']);
    scene.waveIndex = 2;
    scene.spawnWave(['pernilongo']);
    expect(scene.fighters.filter((f) => f.id.startsWith('mini-kirk'))).toHaveLength(1);
  });

  it('não aparece quando a chance falha (RNG azarado)', () => {
    const scene = sceneWith(() => 0.99); // chance(8) nunca rola
    scene.waveIndex = 1;
    scene.spawnWave(['pernilongo']);
    scene.waveIndex = 2;
    scene.spawnWave(['pernilongo']);
    expect(scene.fighters.some((f) => f.id.startsWith('mini-kirk'))).toBe(false);
  });

  it('v1.6.0: no modo infinito a chance cresce bastante a cada fase passada', () => {
    const source = () => 0.2; // RNG 20: passa só com chance > 20
    const padrao = sceneWith(source, PHASES[0]); // 8%
    padrao.waveIndex = 1;
    padrao.spawnWave(['pernilongo']);
    expect(padrao.fighters.some((f) => f.id.startsWith('mini-kirk'))).toBe(false);

    const primeiraInfinita = sceneWith(source, endlessPhaseFor(3)); // 8 + 15 = 23%
    primeiraInfinita.waveIndex = 1;
    primeiraInfinita.spawnWave(['pernilongo']);
    expect(primeiraInfinita.fighters.some((f) => f.id.startsWith('mini-kirk'))).toBe(true);

    const terceiraInfinita = sceneWith(source, endlessPhaseFor(5)); // 8 + 45 = 53%
    terceiraInfinita.waveIndex = 1;
    terceiraInfinita.spawnWave(['pernilongo']);
    expect(terceiraInfinita.fighters.some((f) => f.id.startsWith('mini-kirk'))).toBe(true);
  });

  it('v1.6.0: no modo infinito podem aparecer vários Mini-Kirks na mesma batalha', () => {
    const scene = sceneWith(() => 0.01, endlessPhaseFor(3)); // chance sempre rola
    scene.waveIndex = 1;
    scene.spawnWave(['pernilongo']);
    scene.waveIndex = 2;
    scene.spawnWave(['pernilongo']);
    const kirks = scene.fighters.filter((f) => f.id.startsWith('mini-kirk'));
    expect(kirks.length).toBe(2);

    // Cada um com id próprio (não sobrepõem na arena)
    expect(new Set(kirks.map((k) => k.id)).size).toBe(2);
  });

  it('v1.6.0: inimigos das fases infinitas ganham HP/dano bem maiores', () => {
    const scene = sceneWith(() => 0.99, endlessPhaseFor(3)); // ×1,5 (1ª infinita)
    scene.waveIndex = 0;
    scene.spawnWave(['pernilongo']);
    const pernilongo = scene.fighters.find((f) => f.id.startsWith('pernilongo'));
    expect(pernilongo).toBeDefined();
    expect(pernilongo!.stats.maxHp).toBe(Math.round(ENEMY_BY_ID.get('pernilongo')!.baseStats.maxHp * 1.5));
    expect(pernilongo!.stats.damage).toBe(Math.round(ENEMY_BY_ID.get('pernilongo')!.baseStats.damage * 1.5));

    const kirk = sceneWith(() => 0.01, endlessPhaseFor(5)); // ×2,5 (3ª infinita)
    kirk.waveIndex = 1;
    kirk.spawnWave(['pernilongo']);
    const mini = kirk.fighters.find((f) => f.id.startsWith('mini-kirk'));
    expect(mini!.stats.maxHp).toBe(Math.round(MINI_KIRK.baseStats.maxHp * (1 + 3 * BALANCE.endless.statPerEndlessPhase)));
  });
});
