/**
 * Configurações globais do jogo.
 * Números de balanceamento de gameplay ficam em src/data/ (próximas fases).
 */
export const GAME_CONFIG = {
  title: 'Tilapia vs Osasco',

  /** Evita saltos gigantes de lógica quando a aba perde foco (deltaTime em ms). */
  maxDeltaMs: 100,

  background: {
    particleCount: 24,
    minSpeed: 8,
    maxSpeed: 20,
    minSize: 6,
    maxSize: 18,
  },
} as const;
