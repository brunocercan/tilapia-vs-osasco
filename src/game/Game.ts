import { GAME_CONFIG } from '../config/gameConfig';
import { GameLoop } from './GameLoop';
import { GameState, GameStateManager } from './GameState';
import { Background } from './Background';
import { BattleScene, type BattleResult } from './BattleScene';
import { RandomService } from '../services/RandomService';
import { ScreenManager } from '../ui/ScreenManager';
import type { CharacterDefinition, EquipmentDefinition } from '../data/types';
import { PHASES, endlessPhaseFor, isRankVictory } from '../data/phases';
import { EQUIPMENT_BY_ID } from '../data/equipment';
import { EquipmentSystem } from '../systems/EquipmentSystem';
import { ScoreSystem, type ScoreBreakdown } from '../systems/ScoreSystem';
import { RunState } from '../entities/RunState';
import { LeaderboardService } from '../services/LeaderboardService';
import type { ScoreSubmitOutcome } from '../ui/ResultScreen';
import { sanitizePlayerName } from '../utils/sanitize';

/** Intervalo mínimo entre envios de score (anti-spam local — SPEC-TECNICA §7). */
const SUBMIT_THROTTLE_MS = 10_000;
const LAST_SUBMIT_KEY = 'tilapia:last-score-submit';

/**
 * Orquestrador do jogo: canvas, game loop, máquina de estados,
 * telas HTML (menus), cena de batalha ativa e ranking.
 */
export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly stateManager = new GameStateManager();
  private readonly random = new RandomService();
  private readonly background: Background;
  private readonly loop: GameLoop;
  private readonly leaderboard: LeaderboardService;

  private battle: BattleScene | null = null;
  private selectedTeam: CharacterDefinition[] = [];
  private playerName = '';
  private lastResult: BattleResult | null = null;
  private lastBreakdown: ScoreBreakdown | null = null;
  private runState = new RunState();
  private battlesCompleted = 0;
  private rewardOptions: EquipmentDefinition[] = [];
  private scoreSubmittedForRun = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    uiRoot: HTMLElement,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D não suportado neste navegador');
    }
    this.ctx = ctx;

    this.background = new Background(this.random);
    this.leaderboard = new LeaderboardService();

    new ScreenManager(uiRoot, this.stateManager, {
      onTeamConfirmed: (team) => {
        this.selectedTeam = team;
        this.runState = new RunState(); // nova run: XP, nível e equipamentos zerados
        this.battlesCompleted = 0;
        this.lastBreakdown = null;
        this.scoreSubmittedForRun = false;
        this.stateManager.setState(GameState.Battle);
      },
      getLastResult: () => this.lastResult,
      getScoreBreakdown: () => this.lastBreakdown,
      setPlayerName: (name) => { this.playerName = name; },
      getEquipmentSummary: () => this.equipmentSummary(),
      getRewardOptions: () => this.rewardOptions,
      getTeam: () => this.selectedTeam,
      getEquipmentNames: (characterId) =>
        (this.runState.equipmentIds.get(characterId) ?? [])
          .map((id) => EQUIPMENT_BY_ID.get(id)?.name ?? id),
      getEquippedItems: (characterId) =>
        (this.runState.equipmentIds.get(characterId) ?? [])
          .map((id) => EQUIPMENT_BY_ID.get(id))
          .filter((equipment): equipment is EquipmentDefinition => Boolean(equipment)),
      onEquipmentAssigned: (characterId, equipmentId, replacedId) => {
        const current = this.runState.equipmentIds.get(characterId) ?? [];
        const kept = replacedId ? current.filter((id) => id !== replacedId) : current;
        this.runState.equipmentIds.set(characterId, [...kept, equipmentId]);
        this.stateManager.setState(GameState.Battle);
      },
      // v1.6.0: pular a recompensa — segue direto para a próxima batalha.
      onSkipReward: () => this.stateManager.setState(GameState.Battle),
      isRankingEnabled: () => this.leaderboard.enabled,
      fetchLeaderboard: () => this.leaderboard.getTopEntries(),
      submitScore: () => this.submitScore(),
      // Modo infinito (v1.3.0): continuar acumulando ou encerrar a run.
      getRunSummary: () => ({
        kills: this.runState.kills,
        bossKills: this.runState.bossKills,
        phasesCompleted: this.runState.phasesCompleted,
        elapsedSeconds: this.runState.elapsedSeconds,
      }),
      onContinue: () => {
        this.rewardOptions = EquipmentSystem.rollOptions(this.random);
        this.stateManager.setState(GameState.EquipmentReward); // recompensa → batalha
      },
      onFinish: () => {
        this.lastBreakdown = this.computeBreakdown();
        this.stateManager.setState(GameState.Victory);
      },
    });

    this.stateManager.onChange((state, previous) => this.onStateChange(state, previous));

    this.loop = new GameLoop(
      (deltaSeconds) => this.update(deltaSeconds),
      () => this.render(),
      GAME_CONFIG.maxDeltaMs,
    );

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  start(): void {
    this.loop.start();
  }

  private onStateChange(state: GameState, previous: GameState): void {
    if (state === GameState.Battle) {
      this.startBattle();
    } else if (previous === GameState.Battle && state !== GameState.EquipmentReward) {
      this.battle = null;
    }
  }

  private startBattle(): void {
    if (this.selectedTeam.length === 0) {
      this.stateManager.setState(GameState.CharacterSelect);
      return;
    }
    // Fases 1-3 da run padrão; a partir da 4ª, o modo infinito gera
    // fases cada vez mais difíceis (v1.3.0) — a run não termina mais
    // por falta de fase, só por escolha ou derrota.
    const phase = endlessPhaseFor(this.battlesCompleted);
    this.battle = new BattleScene(this.selectedTeam, phase, this.random, this.runState, (result) => {
      this.lastResult = result;
      this.runState.kills += result.kills;
      this.runState.bossKills += result.bossKills;
      // runState.elapsedSeconds já é acumulado pela própria batalha

      if (!result.victory) {
        this.lastBreakdown = this.computeBreakdown();
        this.stateManager.setState(GameState.Defeat);
        return;
      }

      // Boss derrotado → recompensa de equipamento (SPEC-JOGO §12).
      this.battlesCompleted += 1;
      this.runState.phasesCompleted += 1;
      if (this.battlesCompleted < PHASES.length) {
        this.rewardOptions = EquipmentSystem.rollOptions(this.random);
        this.stateManager.setState(GameState.EquipmentReward);
      } else {
        // Fim da run padrão e de cada fase infinita: continuar ou encerrar.
        this.stateManager.setState(GameState.ContinueRun);
      }
    });
    this.battle.layout(this.width, this.height);
  }

  /** Pontuação da run (SPEC-JOGO §10), calculada uma vez ao terminar. */
  private computeBreakdown(): ScoreBreakdown {
    return ScoreSystem.calculate({
      kills: this.runState.kills,
      bossKills: this.runState.bossKills,
      elapsedSeconds: this.runState.elapsedSeconds,
      killScoreBonusPercent: ScoreSystem.killScoreBonusPercent(this.runState.equipmentIds),
    });
  }

  private equipmentSummary(): string[] {
    return [...this.runState.equipmentIds.entries()].flatMap(([characterId, ids]) =>
      ids.map((id) => `${EQUIPMENT_BY_ID.get(id)?.name ?? id} (${characterId})`),
    );
  }

  /** Envia o score da run atual uma única vez (SPEC-TECNICA §7/§20). */
  private async submitScore(): Promise<ScoreSubmitOutcome> {
    if (!this.leaderboard.enabled || !this.lastBreakdown || !this.lastResult) {
      return { ok: false, error: 'Ranking indisponível' };
    }
    // Nome sanitizado (sem < > etc.): o CHECK do banco rejeita HTML no nome.
    const playerName = sanitizePlayerName(this.playerName);
    if (!playerName) {
      return { ok: false, error: 'Informe um nome para enviar ao ranking' };
    }
    if (this.scoreSubmittedForRun) {
      return { ok: false, error: 'Score desta run já foi enviado' };
    }

    // Anti-spam local: intervalo mínimo entre envios.
    const lastSubmitAt = Number(localStorage.getItem(LAST_SUBMIT_KEY) ?? 0);
    if (Date.now() - lastSubmitAt < SUBMIT_THROTTLE_MS) {
      return { ok: false, error: 'Aguarde antes de enviar novamente' };
    }

    const submit = await this.leaderboard.submitScore({
      player_name: playerName,
      score: this.lastBreakdown.total,
      run_time_ms: Math.round(this.runState.elapsedSeconds * 1000),
      // v1.5.1: run que entrou no modo infinito também conta como vitória.
      victory: isRankVictory(this.lastResult.victory, this.runState.phasesCompleted),
    });
    if (!submit.ok) {
      return { ok: false, error: submit.error };
    }

    this.scoreSubmittedForRun = true;
    localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()));
    const position = await this.leaderboard.getRankPosition(this.lastBreakdown.total);
    return { ok: true, position };
  }

  private resize(): void {
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(this.canvas.clientWidth * this.dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * this.dpr);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.battle?.layout(this.width, this.height);
  }

  private dpr = 1;
  /** Tamanho lógico (CSS pixels) da área de jogo. */
  private width = 0;
  private height = 0;

  private update(deltaSeconds: number): void {
    this.background.update(deltaSeconds, this.width, this.height);
    if (this.stateManager.getState() === GameState.Battle) {
      this.battle?.update(deltaSeconds);
    }
  }

  private render(): void {
    // Escala para devicePixelRatio; toda a lógica usa CSS pixels.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;

    this.background.render(this.ctx, this.width, this.height);
    if (this.stateManager.getState() === GameState.Battle) {
      this.battle?.render(this.ctx);
    }
  }
}
