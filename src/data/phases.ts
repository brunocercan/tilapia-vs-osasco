import type { PhaseDefinition } from './types';
import { BALANCE } from './balance';

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

/**
 * Vitória no ranking (v1.5.1): venceu a última batalha **ou** entrou no
 * modo infinito — morrer nas fases infinitas não é derrota, a run padrão
 * já foi completada.
 */
export function isRankVictory(lastBattleVictory: boolean, phasesCompleted: number): boolean {
  return lastBattleVictory || phasesCompleted >= PHASES.length;
}

/**
 * Modo infinito (v1.3.0): após a 3ª fase, o jogo segue gerando fases para
 * sempre — o ciclo das 3 fases se repete com o cap de dificuldade subindo
 * `BALANCE.endless.difficultyCapPerCycle` por ciclo completo. Quanto mais
 * tempo vivo, mais o multiplicador de pontuação cresce (§10) — a run
 * infinita é a forma de acumular pontos de ranking.
 */
export function endlessPhaseFor(battleIndex: number): PhaseDefinition {
  if (battleIndex < PHASES.length) {
    return PHASES[battleIndex];
  }
  const base = PHASES[battleIndex % PHASES.length];
  const cycle = Math.floor(battleIndex / PHASES.length); // 1 = 2º ciclo
  const suffix = base.name.split('—')[1]?.trim() ?? base.name;
  const endlessNumber = battleIndex - PHASES.length + 1; // 1 = FASE 4
  return {
    ...base,
    id: `${base.id}-inf-${battleIndex}`,
    name: `FASE ${battleIndex + 1} — ${suffix} ∞${cycle > 1 ? ` (ciclo ${cycle})` : ''}`,
    difficultyCap: base.difficultyCap + cycle * BALANCE.endless.difficultyCapPerCycle,
    // v1.6.0: HP/dano dos inimigos sobem bastante a cada fase infinita
    // (1ª infinita ×1,5 · 2ª ×2,0 · 3ª ×2,5 ...) — além do cap por tempo.
    endlessNumber,
    enemyStatMultiplier: 1 + endlessNumber * BALANCE.endless.statPerEndlessPhase,
  };
}
