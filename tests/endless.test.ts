import { describe, expect, it } from 'vitest';
import { PHASES, endlessPhaseFor, isRankVictory } from '../src/data/phases';
import { BALANCE } from '../src/data/balance';
import { DifficultySystem } from '../src/systems/DifficultySystem';
import { ScoreSystem } from '../src/systems/ScoreSystem';
import { LeaderboardService } from '../src/services/LeaderboardService';

describe('Modo infinito — geração de fases (v1.3.0)', () => {
  it('fases padrão seguem idênticas para os 3 primeiros índices', () => {
    expect(endlessPhaseFor(0)).toBe(PHASES[0]);
    expect(endlessPhaseFor(1)).toBe(PHASES[1]);
    expect(endlessPhaseFor(2)).toBe(PHASES[2]);
  });

  it('a partir da 4ª fase, cicla as fases com cap de dificuldade maior', () => {
    const phase4 = endlessPhaseFor(3); // 1ª infinita: repete a Fase 1
    expect(phase4.bossId).toBe(PHASES[0].bossId);
    expect(phase4.difficultyCap).toBe(PHASES[0].difficultyCap + BALANCE.endless.difficultyCapPerCycle);
    expect(phase4.name).toContain('FASE 4');
    expect(phase4.name).toContain('∞');

    const phase5 = endlessPhaseFor(4); // repete a Fase 2
    expect(phase5.difficultyCap).toBe(PHASES[1].difficultyCap + BALANCE.endless.difficultyCapPerCycle);

    const phase7 = endlessPhaseFor(6); // ciclo 2 da Fase 1
    expect(phase7.difficultyCap).toBe(PHASES[0].difficultyCap + 2 * BALANCE.endless.difficultyCapPerCycle);
    expect(phase7.name).toContain('ciclo 2');
  });

  it('ids das fases infinitas são únicos por índice', () => {
    const ids = new Set(Array.from({ length: 9 }, (_, index) => endlessPhaseFor(index).id));
    expect(ids.size).toBe(9);
  });

  it('inimigos das fases infinitas ficam de fato mais fortes por ciclo', () => {
    const capCiclo1 = endlessPhaseFor(3).difficultyCap;
    const capCiclo2 = endlessPhaseFor(6).difficultyCap;
    // Mesma run de 10 minutos: multiplicador maior no ciclo 2
    expect(DifficultySystem.multiplier(600, capCiclo2)).toBeGreaterThan(
      DifficultySystem.multiplier(600, capCiclo1),
    );
    // Run longa atingindo o novo cap
    expect(DifficultySystem.multiplier(1200, capCiclo2)).toBe(capCiclo2);
  });

  it('runs infinitas acumulam pontos dentro do novo limite do ranking', () => {
    const meiaHora = ScoreSystem.survivalMultiplier(1800);
    const umaHora = ScoreSystem.survivalMultiplier(3600);
    expect(meiaHora).toBeCloseTo(4.0, 2);
    expect(umaHora).toBeCloseTo(7.0, 2);

    // 3 ciclos completos: ~100 inimigos + 9 bosses, 1h de run
    const longo = ScoreSystem.calculate({
      kills: 100,
      bossKills: 9,
      elapsedSeconds: 3600,
      killScoreBonusPercent: 0,
    });
    expect(longo.total).toBeGreaterThan(10000);
    expect(longo.total).toBeLessThanOrEqual(LeaderboardService.MAX_PLAUSIBLE_SCORE);
    expect(LeaderboardService.MAX_PLAUSIBLE_SCORE).toBe(100_000);
  });

  it('run que entrou no modo infinito conta como vitória no ranking (v1.5.1)', () => {
    // Encerrou no prompt após o 3º boss: vitória comum
    expect(isRankVictory(true, PHASES.length)).toBe(true);
    // Morreu numa fase infinita: completou a run padrão → vitória no rank
    expect(isRankVictory(false, PHASES.length + 1)).toBe(true);
    expect(isRankVictory(false, PHASES.length * 3)).toBe(true);
    // Morreu na run padrão (antes do infinito): derrota
    expect(isRankVictory(false, 0)).toBe(false);
    expect(isRankVictory(false, PHASES.length - 1)).toBe(false);
  });

  it('v1.6.0: fases infinitas multiplicam bastante o HP/dano dos inimigos', () => {
    const fase4 = endlessPhaseFor(3); // 1ª infinita
    expect(fase4.endlessNumber).toBe(1);
    expect(fase4.enemyStatMultiplier).toBe(1 + 1 * BALANCE.endless.statPerEndlessPhase); // ×1,5
    const fase7 = endlessPhaseFor(6); // 4ª infinita (ciclo 2)
    expect(fase7.endlessNumber).toBe(4);
    expect(fase7.enemyStatMultiplier).toBe(1 + 4 * BALANCE.endless.statPerEndlessPhase); // ×3,0
    // Run padrão: sem multiplicador extra
    expect(PHASES[0].endlessNumber).toBeUndefined();
    expect(PHASES[0].enemyStatMultiplier).toBeUndefined();
  });
});
