import { describe, expect, it } from 'vitest';
import { MovementSystem, findNearestOpponent } from '../src/systems/MovementSystem';
import { Fighter } from '../src/entities/Fighter';
import { CHARACTERS } from '../src/data/characters';
import { PERNILONGO, CAPIVARA_NERVOSA } from '../src/data/enemies';

const BOUNDS = { minX: 16, maxX: 1000 };

function makePlayer(): Fighter {
  return new Fighter(CHARACTERS[0], 'PLAYER', 'player-1');
}

describe('findNearestOpponent', () => {
  it('escolhe o oponente vivo mais próximo', () => {
    const player = makePlayer();
    player.x = 100;
    const near = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    near.x = 200;
    const far = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-2');
    far.x = 600;

    expect(findNearestOpponent(player, [player, near, far])?.id).toBe('e-1');
  });

  it('ignora oponentes mortos e aliados', () => {
    const player = makePlayer();
    player.x = 100;
    const deadEnemy = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    deadEnemy.x = 120;
    deadEnemy.hp = 0;
    const ally = new Fighter(CHARACTERS[1], 'PLAYER', 'p-2');
    ally.x = 110;

    expect(findNearestOpponent(player, [player, deadEnemy, ally])).toBeNull();
  });
});

describe('MovementSystem — movimentação automática', () => {
  it('anda em direção ao alvo até entrar no alcance', () => {
    const system = new MovementSystem();
    const player = makePlayer();
    player.x = 100;
    const enemy = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-1');
    enemy.x = 500;

    const fighters = [player, enemy];
    system.update(fighters, 1.0, BOUNDS); // 1s: move moveSpeed px

    // saiu do lugar e ainda não está no alcance
    expect(player.x).toBeGreaterThan(100);
    expect(player.targetInRange).toBe(false);

    // avança até ficar exatamente no limite do alcance
    for (let i = 0; i < 60 && !player.targetInRange; i++) {
      system.update(fighters, 0.1, BOUNDS);
    }
    expect(player.targetInRange).toBe(true);
    expect(Math.abs(enemy.x - player.x)).toBeLessThanOrEqual(player.stats.range);
  });

  it('para de andar quando está no alcance e define o alvo', () => {
    const system = new MovementSystem();
    const player = makePlayer();
    player.x = 100;
    const enemy = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    enemy.x = 100 + player.stats.range; // exatamente no alcance

    system.update([player, enemy], 0.1, BOUNDS);

    expect(player.x).toBe(100); // não se moveu
    expect(player.targetInRange).toBe(true);
    expect(player.targetId).toBe('e-1');
  });

  it('respeita os limites da arena', () => {
    const system = new MovementSystem();
    const player = makePlayer();
    player.x = 950;
    const enemy = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    enemy.x = 5000; // além da borda

    system.update([player, enemy], 10, BOUNDS);
    expect(player.x).toBeLessThanOrEqual(BOUNDS.maxX);
  });
});
