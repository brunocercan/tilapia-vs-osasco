import { BaseScreen, createButton, createTitle } from './Screen';
import type { LeaderboardEntry } from '../services/LeaderboardService';

export type LeaderboardFetch =
  | { ok: true; entries: LeaderboardEntry[] }
  | { ok: false; error: string };

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Tela de ranking online (SPEC-JOGO §11/§12): nome, pontuação e tempo. */
export class LeaderboardScreen extends BaseScreen {
  private readonly statusElement: HTMLParagraphElement;
  private readonly tableWrapper: HTMLElement;

  constructor(
    private readonly fetchEntries: () => Promise<LeaderboardFetch>,
    onBack: () => void,
  ) {
    super('screen--leaderboard');

    this.statusElement = document.createElement('p');
    this.statusElement.className = 'screen__hint';
    this.tableWrapper = document.createElement('div');
    this.tableWrapper.className = 'leaderboard';

    this.element.append(
      createTitle('Ranking', 2),
      this.statusElement,
      this.tableWrapper,
      createButton('Voltar', onBack),
    );
  }

  show(): void {
    super.show();
    this.statusElement.textContent = 'Carregando...';
    this.tableWrapper.replaceChildren();
    void this.load();
  }

  private async load(): Promise<void> {
    const result = await this.fetchEntries();
    if (!this.element.classList.contains('screen--visible')) {
      return; // jogador saiu da tela
    }
    if (!result.ok) {
      this.statusElement.textContent = 'Não foi possível carregar o ranking.';
      return;
    }
    if (result.entries.length === 0) {
      this.statusElement.textContent = 'Nenhum score registrado ainda. Seja o primeiro!';
      return;
    }
    this.statusElement.textContent = '';
    this.tableWrapper.replaceChildren(this.buildTable(result.entries));
  }

  private buildTable(entries: LeaderboardEntry[]): HTMLElement {
    const table = document.createElement('table');
    table.className = 'leaderboard__table';

    const head = document.createElement('tr');
    for (const label of ['#', 'Nome', 'Pontos', 'Tempo', 'Vitória']) {
      const th = document.createElement('th');
      th.textContent = label;
      head.append(th);
    }
    table.append(head);

    entries.forEach((entry, index) => {
      const row = document.createElement('tr');
      const cells = [
        String(index + 1),
        entry.player_name,
        String(entry.score),
        formatTime(entry.run_time_ms),
        entry.victory ? '🏆' : '—',
      ];
      for (const value of cells) {
        const td = document.createElement('td');
        td.textContent = value;
        row.append(td);
      }
      table.append(row);
    });
    return table;
  }
}
