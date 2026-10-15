import { GameState, GameStateManager } from '../game/GameState';
import type { Screen } from './Screen';
import { MainMenuScreen } from './MainMenuScreen';
import { HowToPlayScreen } from './HowToPlayScreen';
import { ChangelogScreen } from './ChangelogScreen';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { ResultScreen, type ScoreSubmitOutcome } from './ResultScreen';
import { EquipmentRewardScreen } from './EquipmentRewardScreen';
import { ContinueScreen, type RunSummary } from './ContinueScreen';
import { LeaderboardScreen, type LeaderboardFetch } from './LeaderboardScreen';
import type { CharacterDefinition, EquipmentDefinition } from '../data/types';
import type { BattleResult } from '../game/BattleScene';
import type { ScoreBreakdown } from '../systems/ScoreSystem';

export interface ScreenManagerHooks {
  onTeamConfirmed: (team: CharacterDefinition[]) => void;
  getLastResult: () => BattleResult | null;
  getScoreBreakdown: () => ScoreBreakdown | null;
  setPlayerName: (name: string) => void;
  /** Linhas "Equipamento (personagem)" da run para a tela final. */
  getEquipmentSummary: () => string[];
  getRewardOptions: () => EquipmentDefinition[];
  getTeam: () => readonly CharacterDefinition[];
  getEquipmentNames: (characterId: string) => string[];
  /** Itens equipados de um personagem (v1.3.0: passo de substituição). */
  getEquippedItems: (characterId: string) => EquipmentDefinition[];
  onEquipmentAssigned: (characterId: string, equipmentId: string, replacedId?: string) => void;
  /** v1.6.0: pular a seleção de recompensa (ex.: slots cheios). */
  onSkipReward: () => void;
  isRankingEnabled: () => boolean;
  fetchLeaderboard: () => Promise<LeaderboardFetch>;
  submitScore: () => Promise<ScoreSubmitOutcome>;
  /** Resumo da run para a tela "continuar infinito" (v1.3.0). */
  getRunSummary: () => RunSummary;
  onContinue: () => void;
  onFinish: () => void;
}

/**
 * Troca a tela HTML visível conforme o estado do jogo.
 * Telas sem associação (BATTLE etc.) não mostram HTML sobre o canvas.
 */
export class ScreenManager {
  private readonly screens = new Map<GameState, Screen>();
  private currentScreen: Screen | null = null;

  constructor(
    root: HTMLElement,
    stateManager: GameStateManager,
    hooks: ScreenManagerHooks,
  ) {
    const backToMenu = (): void => stateManager.setState(GameState.MainMenu);

    this.register(root, GameState.MainMenu, new MainMenuScreen({
      onPlay: () => stateManager.setState(GameState.CharacterSelect),
      onLeaderboard: () => stateManager.setState(GameState.Leaderboard),
      onHowToPlay: () => stateManager.setState(GameState.HowToPlay),
      onChangelog: () => stateManager.setState(GameState.Changelog),
    }));
    this.register(root, GameState.HowToPlay, new HowToPlayScreen(backToMenu));
    this.register(root, GameState.Changelog, new ChangelogScreen(backToMenu));
    this.register(root, GameState.Leaderboard, new LeaderboardScreen(hooks.fetchLeaderboard, backToMenu));
    this.register(root, GameState.CharacterSelect, new CharacterSelectScreen(
      hooks.onTeamConfirmed,
      backToMenu,
    ));
    this.register(root, GameState.ContinueRun, new ContinueScreen(
      {
        getRunSummary: hooks.getRunSummary,
        onContinue: hooks.onContinue,
        onFinish: hooks.onFinish,
      },
      backToMenu,
    ));

    const resultScreen = new ResultScreen({
      getResult: hooks.getLastResult,
      getBreakdown: hooks.getScoreBreakdown,
      setPlayerName: hooks.setPlayerName,
      getEquipmentSummary: hooks.getEquipmentSummary,
      isRankingEnabled: hooks.isRankingEnabled,
      submitScore: hooks.submitScore,
    }, backToMenu);
    this.register(root, GameState.Victory, resultScreen);
    this.register(root, GameState.Defeat, resultScreen);
    this.register(root, GameState.EquipmentReward, new EquipmentRewardScreen({
      getOptions: hooks.getRewardOptions,
      getTeam: hooks.getTeam,
      getEquipmentNames: hooks.getEquipmentNames,
      getEquippedItems: hooks.getEquippedItems,
      onAssigned: hooks.onEquipmentAssigned,
      onSkip: hooks.onSkipReward,
    }));

    stateManager.onChange((state) => this.sync(state));
    this.sync(stateManager.getState());
  }

  private register(root: HTMLElement, state: GameState, screen: Screen): void {
    this.screens.set(state, screen);
    root.append(screen.element);
  }

  private sync(state: GameState): void {
    this.currentScreen?.hide();
    const next = this.screens.get(state) ?? null;
    this.currentScreen = next;
    next?.show();
  }
}
