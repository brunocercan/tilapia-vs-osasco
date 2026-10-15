import type { PhaseDefinition } from './types';

/**
 * As 3 fases da run (SPEC-JOGO §2). Cada fase: waves de inimigos básicos
 * seguidas do boss. A vitória contra o boss libera a próxima fase.
 *
 * Composição das waves e tetos de dificuldade são balanceamento inicial
 * (a spec define perfis, não quantidades exatas por wave).
 */
export const PHASES: readonly PhaseDefinition[] = [
  {
    id: 'matao',
    name: 'FASE 1 — MATÃO',
    waves: [
      ['pernilongo', 'pernilongo', 'pernilongo'],
      ['pernilongo', 'pernilongo', 'capivara-nervosa'],
      ['pernilongo', 'capivara-nervosa', 'capivara-nervosa'],
    ],
    bossId: 'inseto-gigante',
    difficultyCap: 1.35,
  },
  {
    id: 'osasco',
    name: 'FASE 2 — REMÉDIOS',
    waves: [
      ['motoboy-apressado', 'pombo-de-praca', 'pombo-de-praca'],
      ['motoboy-apressado', 'motoboy-apressado', 'pombo-de-praca'],
      ['motoboy-apressado', 'pombo-de-praca', 'pombo-de-praca', 'motoboy-apressado'],
    ],
    bossId: 'cachorro-bravo',
    difficultyCap: 1.7,
  },
  {
    id: 'toca',
    name: 'FASE 3 — TOCA',
    waves: [
      ['meia-perdida', 'meia-perdida', 'rato-da-toca'],
      ['rato-da-toca', 'meia-perdida', 'meia-perdida'],
      ['rato-da-toca', 'rato-da-toca', 'meia-perdida', 'meia-perdida'],
    ],
    bossId: 'barata-voadora',
    difficultyCap: 2.0,
  },
];
