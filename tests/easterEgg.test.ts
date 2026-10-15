import { describe, expect, it } from 'vitest';
import { CharlieEasterEgg } from '../src/game/CharlieEasterEgg';
import { RandomService } from '../src/services/RandomService';
import { CHARLIE_FACE_COLS, CHARLIE_FACE_ROWS } from '../src/render/charlieSprite';

const ALWAYS = new RandomService(() => 0.0); // chance() sempre true
const NEVER = new RandomService(() => 0.9999); // chance() sempre false

describe('CharlieEasterEgg — boss secreto (easter egg)', () => {
  it('a grade do rosto é consistente (26 linhas de 20 caracteres)', () => {
    // validação indireta: constantes exportadas refletem a grade
    expect(CHARLIE_FACE_ROWS).toBe(26);
    expect(CHARLIE_FACE_COLS).toBe(20);
  });

  it('não aparece durante o warmup, mesmo com chance máxima', () => {
    const egg = new CharlieEasterEgg(ALWAYS);
    // estritamente antes do fim do warmup (30 updates de 0,9s = 27s)
    for (let t = 0; t < CharlieEasterEgg.WARMUP_SECONDS; t += 1) {
      egg.update(0.9);
    }
    expect(egg.active).toBe(false);
  });

  it('aparece após o warmup quando a chance dispara', () => {
    const egg = new CharlieEasterEgg(ALWAYS);
    egg.update(CharlieEasterEgg.WARMUP_SECONDS + 0.016);
    expect(egg.active).toBe(true);
  });

  it('desaparece após a duração da aparição', () => {
    const egg = new CharlieEasterEgg(ALWAYS);
    egg.update(CharlieEasterEgg.WARMUP_SECONDS + 0.016);
    expect(egg.active).toBe(true);
    egg.update(CharlieEasterEgg.APPEARANCE_SECONDS);
    expect(egg.active).toBe(false);
  });

  it('não aparece de novo antes do cooldown', () => {
    const egg = new CharlieEasterEgg(ALWAYS);
    egg.update(CharlieEasterEgg.WARMUP_SECONDS + 0.016); // aparece
    egg.update(CharlieEasterEgg.APPEARANCE_SECONDS); // some
    for (let t = 0; t < CharlieEasterEgg.COOLDOWN_SECONDS - 2; t += 1) {
      egg.update(1);
    }
    expect(egg.active).toBe(false);
  });

  it('com RNG que nunca dispara, nunca aparece', () => {
    const egg = new CharlieEasterEgg(NEVER);
    for (let t = 0; t < 600; t += 1) {
      egg.update(1);
    }
    expect(egg.active).toBe(false);
  });
});
