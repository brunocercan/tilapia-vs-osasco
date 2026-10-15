/**
 * Máquina de estados do jogo (SPEC-TECNICA §13).
 *
 * Os estados de batalha serão detalhados por fase nas próximas etapas:
 * BATTLE cobre BATTLE_PHASE_1..3 e bosses; EQUIPMENT_REWARD as recompensas.
 */
export enum GameState {
  MainMenu = 'MAIN_MENU',
  CharacterSelect = 'CHARACTER_SELECT',
  Battle = 'BATTLE',
  EquipmentReward = 'EQUIPMENT_REWARD',
  Victory = 'VICTORY',
  Defeat = 'DEFEAT',
  Leaderboard = 'LEADERBOARD',
  HowToPlay = 'HOW_TO_PLAY',
}

export type StateChangeListener = (current: GameState, previous: GameState) => void;

export class GameStateManager {
  private current: GameState = GameState.MainMenu;
  private readonly listeners: StateChangeListener[] = [];

  getState(): GameState {
    return this.current;
  }

  setState(next: GameState): void {
    if (next === this.current) {
      return;
    }
    const previous = this.current;
    this.current = next;
    for (const listener of this.listeners) {
      listener(this.current, previous);
    }
  }

  onChange(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }
}
