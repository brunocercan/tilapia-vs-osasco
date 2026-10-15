/**
 * Wrapper de RNG (SPEC-TECNICA §17).
 * A fonte aleatória é injetável para permitir RNG seedado em testes futuros.
 */
export type RandomSource = () => number;

export class RandomService {
  constructor(private readonly source: RandomSource = Math.random) {}

  /** Retorna true com a probabilidade informada (0–100). */
  chance(percent: number): boolean {
    if (percent <= 0) {
      return false;
    }
    if (percent >= 100) {
      return true;
    }
    return this.source() * 100 < percent;
  }

  /** Inteiro aleatório entre min e max (inclusive). */
  randomInt(min: number, max: number): number {
    if (max < min) {
      throw new Error('RandomService.randomInt: max deve ser >= min');
    }
    return Math.floor(this.source() * (max - min + 1)) + min;
  }

  /** Número aleatório entre min (inclusive) e max (exclusive). */
  randomFloat(min: number, max: number): number {
    if (max < min) {
      throw new Error('RandomService.randomFloat: max deve ser >= min');
    }
    return this.source() * (max - min) + min;
  }

  /** Escolhe um elemento do array. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('RandomService.pick: lista vazia');
    }
    return items[Math.floor(this.source() * items.length)];
  }
}
