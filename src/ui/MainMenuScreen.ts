import { BaseScreen, createButton, createTitle } from './Screen';

export interface MainMenuActions {
  onPlay: () => void;
  onLeaderboard: () => void;
  onHowToPlay: () => void;
  onChangelog: () => void;
}

/** Tela inicial (SPEC-JOGO §12): logo/título, Jogar, Ranking, Como Jogar. */
export class MainMenuScreen extends BaseScreen {
  constructor(actions: MainMenuActions) {
    super('screen--menu');

    const title = createTitle('TILAPIA');
    const vs = document.createElement('p');
    vs.className = 'screen__subtitle';
    vs.textContent = 'vs OSASCO';

    const buttons = document.createElement('div');
    buttons.className = 'screen__buttons';
    buttons.append(
      createButton('Jogar', actions.onPlay),
      createButton('Ranking', actions.onLeaderboard),
      createButton('Como Jogar', actions.onHowToPlay),
      createButton('Novidades', actions.onChangelog),
    );

    this.element.append(title, vs, buttons);
  }
}
