import { describe, expect, it } from 'vitest';
import { MovementSystem, findNearestOpponent, LANE_TOLERANCE_PX } from '../src/systems/MovementSystem';
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

describe('Trilhas separadas (v1.4.2)', () => {
  const LANE_TOP = 300;
  const LANE_BOTTOM = 460;

  it('cada unidade ataca o inimigo da própria trilha, mesmo com um mais perto na outra', () => {
    const player = makePlayer();
    player.x = 100;
    player.y = LANE_TOP;
    const inimigoPertoOutraTrilha = new Fighter(PERNILONGO, 'ENEMY', 'e-perto');
    inimigoPertoOutraTrilha.x = 150; // mais perto em X...
    inimigoPertoOutraTrilha.y = LANE_BOTTOM; // ...mas na outra trilha
    const inimigoMesmaTrilha = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-trilha');
    inimigoMesmaTrilha.x = 400;
    inimigoMesmaTrilha.y = LANE_TOP;

    expect(findNearestOpponent(player, [player, inimigoPertoOutraTrilha, inimigoMesmaTrilha])?.id)
      .toBe('e-trilha');
  });

  it('inimigos também priorizam personagens da própria trilha', () => {
    const enemy = new Fighter(PERNILONGO, 'ENEMY', 'e-1');
    enemy.x = 900;
    enemy.y = LANE_BOTTOM;
    const playerPertoOutraTrilha = makePlayer();
    playerPertoOutraTrilha.x = 100;
    playerPertoOutraTrilha.y = LANE_TOP;
    const playerMesmaTrilha = new Fighter(CHARACTERS[1], 'PLAYER', 'p-2');
    playerMesmaTrilha.x = 300;
    playerMesmaTrilha.y = LANE_BOTTOM;

    expect(findNearestOpponent(enemy, [enemy, playerPertoOutraTrilha, playerMesmaTrilha])?.id)
      .toBe('p-2');
  });

  it('trilha esvaziou: migra verticalmente até o alvo e volta a atacar', () => {
    const system = new MovementSystem();
    const player = makePlayer();
    player.x = 100;
    player.y = LANE_TOP;
    const enemy = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-1');
    enemy.x = 140; // dentro do alcance em X...
    enemy.y = LANE_BOTTOM; // ...mas na trilha de baixo

    system.update([player, enemy], 0.1, BOUNDS);
    expect(player.targetId).toBe('e-1');
    expect(player.targetInRange).toBe(false); // ainda descendo
    expect(player.y).toBeGreaterThan(LANE_TOP); // caminhou para a trilha do alvo
    expect(player.x).toBe(100); // X já alinhado: só desce

    for (let i = 0; i < 60 && !player.targetInRange; i++) {
      system.update([player, enemy], 0.1, BOUNDS);
    }
    expect(player.targetInRange).toBe(true); // chegou na trilha e voltou a atacar
    expect(Math.abs(player.y - enemy.y)).toBeLessThanOrEqual(LANE_TOLERANCE_PX);
  });

  it('migração vertical nunca ultrapassa a trilha do alvo', () => {
    const system = new MovementSystem();
    const player = makePlayer();
    player.x = 100;
    player.y = LANE_TOP;
    const enemy = new Fighter(CAPIVARA_NERVOSA, 'ENEMY', 'e-1');
    enemy.x = 140;
    enemy.y = LANE_BOTTOM;

    system.update([player, enemy], 10, BOUNDS); // passo gigante: trava na trilha
    expect(player.y).toBe(LANE_BOTTOM);
  });
});
