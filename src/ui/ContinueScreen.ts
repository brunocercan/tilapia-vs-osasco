import { BaseScreen, createButton, createTitle } from './Screen';

export interface RunSummary {
  kills: number;
  bossKills: number;
  phasesCompleted: number;
  elapsedSeconds: number;
}

export interface ContinueScreenHooks {
  getRunSummary: () => RunSummary;
  onContinue: () => void;
  onFinish: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Tela de decisão do modo infinito (v1.3.0): após concluir a run padrão (e a
 * cada fase infinita seguinte), o jogador escolhe continuar — inimigos mais
 * fortes e pontos acumulando — ou encerrar e enviar a pontuação ao ranking.
 */
export class ContinueScreen extends BaseScreen {
  private readonly titleElement: HTMLHeadingElement;
  private readonly summaryElement: HTMLParagraphElement;
  private readonly warningElement: HTMLParagraphElement;

  constructor(
    private readonly hooks: ContinueScreenHooks,
    onMenu: () => void,
  ) {
    super('screen--continue');

    this.titleElement = createTitle('', 2);

    this.summaryElement = document.createElement('p');
    this.summaryElement.className = 'screen__message';

    this.warningElement = document.createElement('p');
    this.warningElement.className = 'screen__hint';

    const continueButton = createButton('Continuar run infinita ∞', () => this.hooks.onContinue());
    const finishButton = createButton('Encerrar e enviar pontuação', () => this.hooks.onFinish());
    continueButton.classList.add('btn--continue');
    finishButton.classList.add('btn--secondary');

    const buttons = document.createElement('div');
    buttons.className = 'screen__buttons screen__buttons--row';
    buttons.append(continueButton, finishButton);

    this.element.append(
      this.titleElement,
      this.summaryElement,
      this.warningElement,
      buttons,
      createButton('Voltar ao menu (perde a run)', onMenu),
    );
  }

  show(): void {
    const summary = this.hooks.getRunSummary();
    const isStandardRun = summary.phasesCompleted <= 3;
    this.titleElement.textContent = isStandardRun
      ? 'RUN COMPLETA!'
      : `FASE INFINITA ${summary.phasesCompleted} CONCLUÍDA!`;
    this.titleElement.style.color = 'var(--color-accent)';

    this.summaryElement.textContent =
      `Inimigos: ${summary.kills} · Bosses: ${summary.bossKills} · ` +
      `Fases: ${summary.phasesCompleted} · Tempo: ${formatTime(summary.elapsedSeconds)}`;

    this.warningElement.textContent =
      '∞ Continue para acumular mais pontos — mas os inimigos ficam mais fortes a cada ciclo!';

    super.show();
  }
}
