import { BaseScreen, createButton, createTitle } from './Screen';
import type { BattleResult } from '../game/BattleScene';
import type { ScoreBreakdown } from '../systems/ScoreSystem';
import { sanitizePlayerName, PLAYER_NAME_MAX_LENGTH } from '../utils/sanitize';

export type ScoreSubmitOutcome =
  | { ok: true; position: number | null }
  | { ok: false; error: string };

export interface ResultScreenHooks {
  getResult: () => BattleResult | null;
  getBreakdown: () => ScoreBreakdown | null;
  setPlayerName: (name: string) => void;
  getEquipmentSummary: () => string[];
  isRankingEnabled: () => boolean;
  submitScore: () => Promise<ScoreSubmitOutcome>;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Tela final (SPEC-JOGO §12): vitória/derrota, pontuação com breakdown,
 * tempo, nível, sobreviventes, equipamentos e envio ao ranking com o nome
 * do jogador.
 */
export class ResultScreen extends BaseScreen {
  private readonly titleElement: HTMLHeadingElement;
  private readonly scoreElement: HTMLParagraphElement;
  private readonly breakdownElement: HTMLUListElement;
  private readonly detailsElement: HTMLParagraphElement;
  private readonly nameInput: HTMLInputElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly submitStatus: HTMLParagraphElement;

  constructor(
    private readonly hooks: ResultScreenHooks,
    onMenu: () => void,
  ) {
    super('screen--result');

    this.titleElement = createTitle('', 2);
    this.scoreElement = document.createElement('p');
    this.scoreElement.className = 'result__score';

    this.breakdownElement = document.createElement('ul');
    this.breakdownElement.className = 'screen__list result__breakdown';

    this.detailsElement = document.createElement('p');
    this.detailsElement.className = 'screen__message';

    // Nome do jogador na tela final (§11: nome só aqui)
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = PLAYER_NAME_MAX_LENGTH;
    this.nameInput.placeholder = 'Seu nome para o ranking';
    this.nameInput.autocomplete = 'off';
    this.nameInput.className = 'name-input';
    this.nameInput.disabled = true;

    this.submitButton = createButton('Enviar para o ranking', () => void this.submit());
    this.submitStatus = document.createElement('p');
    this.submitStatus.className = 'screen__hint';
    this.submitButton.disabled = true;
    this.nameInput.addEventListener('input', () => this.updateSubmitButton());

    const buttons = document.createElement('div');
    buttons.className = 'screen__buttons screen__buttons--row';
    buttons.append(this.submitButton, createButton('Menu', onMenu));

    this.element.append(
      this.titleElement,
      this.scoreElement,
      this.breakdownElement,
      this.detailsElement,
      this.nameInput,
      this.submitButton,
      this.submitStatus,
      buttons,
    );
  }

  show(): void {
    const result = this.hooks.getResult();
    const breakdown = this.hooks.getBreakdown();
    const victory = result?.victory ?? false;

    this.titleElement.textContent = victory ? 'VITÓRIA!' : 'DERROTA';
    this.titleElement.style.color = victory ? 'var(--color-accent)' : '#d9534f';

    this.scoreElement.textContent = breakdown ? `Pontuação: ${breakdown.total}` : '';

    const items: Array<[string, number]> = breakdown
      ? [
          ['Inimigos derrotados', breakdown.enemies],
          ['Bosses', breakdown.bosses],
          ['Fases concluídas', breakdown.phases],
          ['Bônus de nível', breakdown.level],
          ['Sobreviventes', breakdown.survivors],
          ['Bônus de velocidade', breakdown.speed],
        ]
      : [];
    this.breakdownElement.replaceChildren(
      ...items.map(([label, value]) => {
        const li = document.createElement('li');
        li.textContent = `${label}: ${value}`;
        return li;
      }),
    );

    if (result) {
      const equipment = this.hooks.getEquipmentSummary();
      this.detailsElement.textContent =
        `Tempo: ${formatTime(result.elapsedSeconds)} · Nível: ${result.level} · ` +
        `Sobreviventes: ${result.survivors}/2 · Inimigos: ${result.kills}` +
        (equipment.length > 0 ? ` · Equipamentos: ${equipment.join(', ')}` : '');
    }

    this.nameInput.disabled = !this.hooks.isRankingEnabled();
    if (!this.hooks.isRankingEnabled()) {
      this.submitStatus.textContent = 'Ranking indisponível no momento (offline).';
    } else {
      this.submitStatus.textContent = 'Informe um nome e envie para o ranking!';
      this.submitButton.textContent = 'Enviar para o ranking';
    }
    this.updateSubmitButton();

    super.show();
  }

  private updateSubmitButton(): void {
    const nameValid = sanitizePlayerName(this.nameInput.value).length > 0;
    this.submitButton.disabled = !nameValid;
  }

  private async submit(): Promise<void> {
    this.submitButton.disabled = true;
    this.submitButton.textContent = 'Enviando...';
    const outcome = await this.hooks.submitScore();
    if (outcome.ok) {
      this.submitButton.textContent = 'Enviado ✓';
      this.submitStatus.textContent = outcome.position
        ? `Posição no ranking: #${outcome.position}`
        : 'Score registrado!';
    } else {
      this.submitStatus.textContent = 'Não foi possível atualizar o ranking.';
      this.submitButton.textContent = 'Tentar novamente';
      this.submitButton.disabled = false;
    }
  }
}
