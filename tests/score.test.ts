import { describe, expect, it } from 'vitest';
import { ScoreSystem } from '../src/systems/ScoreSystem';
import { LeaderboardService } from '../src/services/LeaderboardService';
import { BALANCE } from '../src/data/balance';

const BASE_INPUT = {
  kills: 0,
  bossKills: 0,
  elapsedSeconds: 300,
  killScoreBonusPercent: 0,
};

describe('ScoreSystem (SPEC-JOGO §10 — inimigos × sobrevivência)', () => {
  it('pontação vem só de inimigos derrotados × multiplicador', () => {
    const breakdown = ScoreSystem.calculate({
      kills: 20,        // 200
      bossKills: 2,     // 300
      elapsedSeconds: 300, // ×1,5 (5 min vivos)
      killScoreBonusPercent: 0,
    });
    expect(breakdown.enemies).toBe(200);
    expect(breakdown.bosses).toBe(300);
    expect(breakdown.multiplier).toBe(1.5);
    expect(breakdown.total).toBe(Math.round((200 + 300) * 1.5));
  });

  it('não há pontos por tempo, fases, nível ou sobreviventes', () => {
    const breakdown = ScoreSystem.calculate({ ...BASE_INPUT, kills: 0, bossKills: 0 });
    expect(breakdown.total).toBe(0); // tempo vivo sozinho não pontua
  });

  it('multiplicador de sobrevivência cresce +0,1 por minuto vivo', () => {
    expect(ScoreSystem.survivalMultiplier(0)).toBe(1);
    expect(ScoreSystem.survivalMultiplier(60)).toBeCloseTo(1 + BALANCE.score.survivalMultiplierPerMinute, 2);
    expect(ScoreSystem.survivalMultiplier(300)).toBe(1.5); // 5 min
    expect(ScoreSystem.survivalMultiplier(600)).toBe(2.0); // 10 min
  });

  it('run com mais inimigos derrotados pontua mais que run rápida e fraca', () => {
    const weakFast = ScoreSystem.calculate({ ...BASE_INPUT, kills: 5, bossKills: 0, elapsedSeconds: 60 });
    const complete = ScoreSystem.calculate({
      kills: 30, bossKills: 3, elapsedSeconds: 400, killScoreBonusPercent: 0,
    });
    expect(complete.total).toBeGreaterThan(weakFast.total);
    expect(complete.total).toBeLessThanOrEqual(LeaderboardService.MAX_PLAUSIBLE_SCORE);
  });

  it('sobreviver mais tempo multiplica a mesma pontuação', () => {
    const curta = ScoreSystem.calculate({ ...BASE_INPUT, kills: 10, elapsedSeconds: 120 });
    const longa = ScoreSystem.calculate({ ...BASE_INPUT, kills: 10, elapsedSeconds: 480 });
    expect(longa.multiplier).toBeGreaterThan(curta.multiplier);
    expect(longa.total).toBeGreaterThan(curta.total);
  });

  it('Vale-Transporte aumenta em 10% a pontuação de inimigos derrotados (§4)', () => {
    const semVale = ScoreSystem.calculate({ ...BASE_INPUT, kills: 20, killScoreBonusPercent: 0 });
    const comVale = ScoreSystem.calculate({ ...BASE_INPUT, kills: 20, killScoreBonusPercent: 10 });
    expect(comVale.enemies).toBe(Math.round(semVale.enemies * 1.1));
    expect(semVale.enemies).toBe(20 * BALANCE.score.enemyKill);
  });

  it('killScoreBonusPercent soma os bônus de todos os equipamentos da run (v1.3.1)', () => {
    const equipmentIds = new Map<string, readonly string[]>([
      ['kiki', ['vale-transporte', 'colar-tilapia']], // +10% e +25%
      ['tombas', ['tadalinha']],                      // sem bônus de score
    ]);
    expect(ScoreSystem.killScoreBonusPercent(equipmentIds)).toBe(35);
    expect(ScoreSystem.killScoreBonusPercent(new Map())).toBe(0);
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
