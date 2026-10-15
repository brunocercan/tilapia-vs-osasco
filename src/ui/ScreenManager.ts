import { GameState, GameStateManager } from '../game/GameState';
import type { Screen } from './Screen';
import { MainMenuScreen } from './MainMenuScreen';
import { HowToPlayScreen } from './HowToPlayScreen';
import { CharacterSelectScreen } from './CharacterSelectScreen';
import { ResultScreen, type ScoreSubmitOutcome } from './ResultScreen';
import { EquipmentRewardScreen } from './EquipmentRewardScreen';
import { LeaderboardScreen, type LeaderboardFetch } from './LeaderboardScreen';
import type { CharacterDefinition, EquipmentDefinition } from '../data/types';
import type { BattleResult } from '../game/BattleScene';
import type { ScoreBreakdown } from '../systems/ScoreSystem';

export interface ScreenManagerHooks {
  onTeamConfirmed: (team: CharacterDefinition[], playerName: string) => void;
  getLastResult: () => BattleResult | null;
  getScoreBreakdown: () => ScoreBreakdown | null;
  getPlayerName: () => string;
  /** Linhas "Equipamento (personagem)" da run para a tela final. */
  getEquipmentSummary: () => string[];
  getRewardOptions: () => EquipmentDefinition[];
  getTeam: () => readonly CharacterDefinition[];
  getEquipmentNames: (characterId: string) => string[];
  onEquipmentAssigned: (characterId: string, equipmentId: string) => void;
  isRankingEnabled: () => boolean;
  fetchLeaderboard: () => Promise<LeaderboardFetch>;
  submitScore: () => Promise<ScoreSubmitOutcome>;
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
    }));
    this.register(root, GameState.HowToPlay, new HowToPlayScreen(backToMenu));
    this.register(root, GameState.Leaderboard, new LeaderboardScreen(hooks.fetchLeaderboard, backToMenu));
    this.register(root, GameState.CharacterSelect, new CharacterSelectScreen(
      hooks.onTeamConfirmed,
      backToMenu,
    ));

    const resultScreen = new ResultScreen({
      getResult: hooks.getLastResult,
      getBreakdown: hooks.getScoreBreakdown,
      getPlayerName: hooks.getPlayerName,
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
      onAssigned: hooks.onEquipmentAssigned,
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
