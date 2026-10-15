import { BALANCE } from '../data/balance';

export interface ScoreInput {
  kills: number;
  bossKills: number;
  level: number;
  survivors: number;
  phasesCompleted: number;
  elapsedSeconds: number;
  /** Soma dos bônus % de equipamentos tipo Vale-Transporte (§4). */
  phaseScoreBonusPercent: number;
}

export interface ScoreBreakdown {
  enemies: number;
  bosses: number;
  phases: number;
  level: number;
  survivors: number;
  speed: number;
  total: number;
}

/**
 * Pontuação da run (SPEC-JOGO §10):
 * inimigos + bosses + bônus de nível + sobreviventes + fases + velocidade.
 * O tempo pesa bastante, mas não permite score alto numa run fraca:
 * sem bosses/fases, o bônus de velocidade sozinho não basta.
 */
export class ScoreSystem {
  static calculate(input: ScoreInput): ScoreBreakdown {
    const s = BALANCE.score;

    const enemies = input.kills * s.enemyKill;
    const bosses = input.bossKills * s.bossKill;
    // Vale-Transporte: +10% na pontuação de cada fase concluída (§4)
    const phases = Math.round(
      input.phasesCompleted * s.phaseClear * (1 + input.phaseScoreBonusPercent / 100),
    );
    const level = input.level * s.levelBonus;
    const survivors = input.survivors * s.survivorBonus;
    const speed = Math.max(0, Math.floor(s.targetRunSeconds - input.elapsedSeconds)) * s.speedBonusPerSecond;

    return {
      enemies,
      bosses,
      phases,
      level,
      survivors,
      speed,
      total: enemies + bosses + phases + level + survivors + speed,
    };
  }
}
