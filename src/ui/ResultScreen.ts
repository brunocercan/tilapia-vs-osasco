import { BaseScreen, createButton, createTitle } from './Screen';
import type { BattleResult } from '../game/BattleScene';
import type { ScoreBreakdown } from '../systems/ScoreSystem';

export type ScoreSubmitOutcome =
  | { ok: true; position: number | null }
  | { ok: false; error: string };

export interface ResultScreenHooks {
  getResult: () => BattleResult | null;
  getBreakdown: () => ScoreBreakdown | null;
  getPlayerName: () => string;
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
 * tempo, nível, sobreviventes, equipamentos e envio ao ranking.
 */
export class ResultScreen extends BaseScreen {
  private readonly titleElement: HTMLHeadingElement;
  private readonly scoreElement: HTMLParagraphElement;
  private readonly breakdownElement: HTMLUListElement;
  private readonly detailsElement: HTMLParagraphElement;
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

    this.submitButton = createButton('Enviar para o ranking', () => void this.submit());
    this.submitStatus = document.createElement('p');
    this.submitStatus.className = 'screen__hint';

    const buttons = document.createElement('div');
    buttons.className = 'screen__buttons screen__buttons--row';
    buttons.append(createButton('Menu', onMenu));

    this.element.append(
      this.titleElement,
      this.scoreElement,
      this.breakdownElement,
      this.detailsElement,
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

    // Um envio por run (anti-spam — SPEC-TECNICA §7)
    this.submitStatus.textContent = this.hooks.isRankingEnabled()
      ? `${this.hooks.getPlayerName()}, envie sua pontuação!`
      : 'Ranking indisponível no momento (offline).';
    this.submitButton.disabled = !this.hooks.isRankingEnabled();
    this.submitButton.textContent = 'Enviar para o ranking';

    super.show();
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
