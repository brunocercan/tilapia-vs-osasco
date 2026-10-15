import { describe, expect, it } from 'vitest';
import { ScoreSystem } from '../src/systems/ScoreSystem';
import { LeaderboardService } from '../src/services/LeaderboardService';
import { BALANCE } from '../src/data/balance';

const BASE_INPUT = {
  kills: 0,
  bossKills: 0,
  level: 1,
  survivors: 0,
  phasesCompleted: 0,
  elapsedSeconds: 300,
  phaseScoreBonusPercent: 0,
};

describe('ScoreSystem (SPEC-JOGO §10)', () => {
  it('soma todos os componentes da pontuação', () => {
    const breakdown = ScoreSystem.calculate({
      kills: 20,        // 200
      bossKills: 2,     // 300
      level: 5,         // 125
      survivors: 2,     // 100
      phasesCompleted: 2, // 200
      elapsedSeconds: 250, // (300-250)*4 = 200
      phaseScoreBonusPercent: 0,
    });
    expect(breakdown.total).toBe(200 + 300 + 125 + 100 + 200 + 200);
  });

  it('run completa dentro do alvo gera bônus de velocidade', () => {
    const breakdown = ScoreSystem.calculate({ ...BASE_INPUT, elapsedSeconds: 270 });
    expect(breakdown.speed).toBe(30 * BALANCE.score.speedBonusPerSecond);
  });

  it('sem avanço, run rápida não gera score alto (apenas bônus de velocidade moderado)', () => {
    const weakFast = ScoreSystem.calculate({ ...BASE_INPUT, elapsedSeconds: 60 });
    const complete = ScoreSystem.calculate({
      kills: 30, bossKills: 3, level: 8, survivors: 2, phasesCompleted: 3,
      elapsedSeconds: 250, phaseScoreBonusPercent: 0,
    });
    expect(complete.total).toBeGreaterThan(weakFast.total);
    expect(weakFast.total).toBeLessThanOrEqual(
      LeaderboardService.MAX_PLAUSIBLE_SCORE,
    );
  });

  it('bônus de velocidade nunca é negativo', () => {
    const breakdown = ScoreSystem.calculate({ ...BASE_INPUT, elapsedSeconds: 600 });
    expect(breakdown.speed).toBe(0);
  });

  it('Vale-Transporte aumenta em 10% a pontuação por fase concluída (§4)', () => {
    const semVale = ScoreSystem.calculate({ ...BASE_INPUT, phasesCompleted: 2, phaseScoreBonusPercent: 0 });
    const comVale = ScoreSystem.calculate({ ...BASE_INPUT, phasesCompleted: 2, phaseScoreBonusPercent: 10 });
    expect(comVale.phases).toBe(Math.round(semVale.phases * 1.1));
    expect(semVale.phases).toBe(2 * BALANCE.score.phaseClear);
  });
});

describe('LeaderboardService — validação e offline (SPEC-TECNICA §7/§20)', () => {
  it('sem cliente configurado o jogo segue: falha controlada no ranking', async () => {
    // forceOffline: o .env local do desenvolvedor é carregado pelo vitest
    const service = new LeaderboardService(true);
    expect(service.enabled).toBe(false);

    const top = await service.getTopEntries();
    expect(top.ok).toBe(false);

    const submit = await service.submitScore({ player_name: 'Bruno', score: 100, run_time_ms: 120_000, victory: true });
    expect(submit.ok).toBe(false);

    expect(await service.getRankPosition(100)).toBeNull();
  });

  it('rejeita scores fora dos limites plausíveis sem chamar o banco', () => {
    expect(
      LeaderboardService['validate']({ player_name: 'X', score: 999_999, run_time_ms: 120_000, victory: true }),
    ).toBe('Score fora do limite plausível');
    expect(
      LeaderboardService['validate']({ player_name: '', score: 100, run_time_ms: 120_000, victory: true }),
    ).toBe('Nome inválido');
    expect(
      LeaderboardService['validate']({ player_name: 'Bruno', score: 100, run_time_ms: 5_000, victory: true }),
    ).toBe('Tempo de run fora do intervalo plausível');
  });
});
