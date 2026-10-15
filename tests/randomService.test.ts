import { describe, expect, it } from 'vitest';
import { RandomService } from '../src/services/RandomService';

describe('RandomService', () => {
  describe('chance', () => {
    it('retorna false para 0%', () => {
      const rng = new RandomService(() => 0.0);
      expect(rng.chance(0)).toBe(false);
    });

    it('retorna true para 100%', () => {
      const rng = new RandomService(() => 0.9999);
      expect(rng.chance(100)).toBe(true);
    });

    it('respeita a probabilidade informada', () => {
      const low = new RandomService(() => 0.29);
      const high = new RandomService(() => 0.31);
      expect(low.chance(30)).toBe(true);
      expect(high.chance(30)).toBe(false);
    });
  });

  describe('randomInt', () => {
    it('gera valores dentro do intervalo (inclusive)', () => {
      const rng = new RandomService();
      for (let i = 0; i < 200; i++) {
        const value = rng.randomInt(2, 5);
        expect(value).toBeGreaterThanOrEqual(2);
        expect(value).toBeLessThanOrEqual(5);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    it('inclui os limites min e max', () => {
      const minRng = new RandomService(() => 0.0);
      const maxRng = new RandomService(() => 0.9999);
      expect(minRng.randomInt(3, 7)).toBe(3);
      expect(maxRng.randomInt(3, 7)).toBe(7);
    });

    it('lança erro se max < min', () => {
      const rng = new RandomService();
      expect(() => rng.randomInt(5, 2)).toThrow();
    });
  });

  describe('pick', () => {
    it('escolhe um elemento do array', () => {
      const rng = new RandomService(() => 0.0);
      expect(rng.pick(['kiki', 'tombas', 'veronezio'])).toBe('kiki');
    });

    it('com fonte máxima escolhe o último elemento', () => {
      const rng = new RandomService(() => 0.9999);
      expect(rng.pick(['kiki', 'tombas', 'veronezio'])).toBe('veronezio');
    });

    it('lança erro para lista vazia', () => {
      const rng = new RandomService();
      expect(() => rng.pick([])).toThrow();
    });
  });
});
