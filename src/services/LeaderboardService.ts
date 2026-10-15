import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './SupabaseService';

export interface ScoreEntry {
  player_name: string;
  score: number;
  run_time_ms: number;
  victory: boolean;
}

export interface LeaderboardEntry extends ScoreEntry {
  created_at: string;
}

export type LeaderboardResult =
  | { ok: true; entries: LeaderboardEntry[] }
  | { ok: false; error: string };

export type SubmitResult = { ok: true } | { ok: false; error: string };

/**
 * Ranking online (SPEC-TECNICA §20). Nunca trava a run: sem banco ou com
 * erro, retorna resultado de falha e o jogo segue normalmente.
 * O cliente Supabase é carregado sob demanda (bundle inicial leve — §24).
 * Consulta principal espelha a SPEC-TECNICA §6 (score DESC, tempo ASC).
 */
export class LeaderboardService {
  /** Limites plausíveis (SPEC-TECNICA §7) — espelhados nas CHECKs do SQL. */
  static readonly MAX_PLAUSIBLE_SCORE = 20000;
  static readonly MIN_RUN_MS = 30_000;
  static readonly MAX_RUN_MS = 1_800_000;
  private static readonly TABLE = 'leaderboard';

  /**
   * `forceOffline` desativa o ranking mesmo com env configurada
   * (usado em testes, que rodam com o .env local carregado).
   */
  constructor(private readonly forceOffline = false) {}

  /** Disponível de forma síncrona para a UI (botões, mensagens). */
  get enabled(): boolean {
    return !this.forceOffline && isSupabaseConfigured();
  }

  private async client(): Promise<SupabaseClient | null> {
    if (this.forceOffline) {
      return null;
    }
    return getSupabaseClient();
  }

  async getTopEntries(limit = 100): Promise<LeaderboardResult> {
    const client = await this.client();
    if (!client) {
      return { ok: false, error: 'Ranking indisponível (offline)' };
    }
    try {
      const { data, error } = await client
        .from(LeaderboardService.TABLE)
        .select('player_name, score, run_time_ms, victory, created_at')
        .order('score', { ascending: false })
        .order('run_time_ms', { ascending: true })
        .limit(limit);
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, entries: (data ?? []) as LeaderboardEntry[] };
    } catch (cause) {
      return { ok: false, error: String(cause) };
    }
  }

  async submitScore(entry: ScoreEntry): Promise<SubmitResult> {
    const client = await this.client();
    if (!client) {
      return { ok: false, error: 'Ranking indisponível (offline)' };
    }
    const validationError = LeaderboardService.validate(entry);
    if (validationError) {
      return { ok: false, error: validationError };
    }
    try {
      const { error } = await client.from(LeaderboardService.TABLE).insert(entry);
      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (cause) {
      return { ok: false, error: String(cause) };
    }
  }

  /** Posição no ranking: 1 + quantidade de scores maiores que o informado. */
  async getRankPosition(score: number): Promise<number | null> {
    const client = await this.client();
    if (!client) {
      return null;
    }
    try {
      const { count, error } = await client
        .from(LeaderboardService.TABLE)
        .select('id', { count: 'exact', head: true })
        .gt('score', score);
      if (error || count === null) {
        return null;
      }
      return count + 1;
    } catch {
      return null;
    }
  }

  private static validate(entry: ScoreEntry): string | null {
    if (entry.player_name.length < 1 || entry.player_name.length > 16) {
      return 'Nome inválido';
    }
    if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > this.MAX_PLAUSIBLE_SCORE) {
      return 'Score fora do limite plausível';
    }
    if (
      !Number.isInteger(entry.run_time_ms) ||
      entry.run_time_ms < this.MIN_RUN_MS ||
      entry.run_time_ms > this.MAX_RUN_MS
    ) {
      return 'Tempo de run fora do intervalo plausível';
    }
    return null;
  }
}
