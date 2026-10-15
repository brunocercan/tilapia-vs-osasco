/**
 * Sistema genérico de efeitos de status (SPEC-TECNICA §16).
 * Evita implementar Veneno, Sangramento e Lentidão de formas diferentes.
 */
export enum StatusEffectType {
  Poison = 'POISON',
  Bleed = 'BLEED',
  Confusion = 'CONFUSION',
  Slow = 'SLOW',
  Stun = 'STUN',
  Frenzy = 'FRENZY',
}

export interface StatusEffect {
  type: StatusEffectType;
  /** Duração restante em segundos. */
  duration: number;
  /** Intervalo entre ticks (controle de intervalo — SPEC-JOGO §5). */
  tickInterval?: number;
  /** Acumulador interno de tempo ativo do efeito. */
  tickTimer?: number;
  /** Duração original (controle interno para limitar ticks ao tempo de vida). */
  totalDuration?: number;
  /** Quantidade de ticks já aplicados (controle interno). */
  ticksApplied?: number;
  magnitude: number;
  sourceId?: string;
  /**
   * Modificador temporário de atributo (SLOW/FRENZY em vel. de ataque ou
   * movimento). Multiplicado ao aplicar e revertido (divisão) ao expirar.
   */
  statModifier?: { stat: 'attackSpeed' | 'moveSpeed'; multiplier: number };
}

/** Efeito de status definido como dado (sem campos internos de runtime). */
export type StatusEffectSpec = Omit<
  StatusEffect,
  'sourceId' | 'tickTimer' | 'totalDuration' | 'ticksApplied'
>;
