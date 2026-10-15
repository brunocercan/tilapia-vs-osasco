/**
 * Estado da run (SPEC-TECNICA §10). Persiste entre as fases da run.
 * XP e nível são do time inteiro (barra única no HUD — SPEC-JOGO §12).
 */
export class RunState {
  level = 1;
  xp = 0;
  kills = 0;
  /** Bosses derrotados (score, §10). */
  bossKills = 0;
  /** Fases concluídas com vitória (score, §10). */
  phasesCompleted = 0;
  elapsedSeconds = 0;
  /** Equipamentos por personagem (characterId → ids de equipamento, §4). */
  readonly equipmentIds = new Map<string, string[]>();
}
