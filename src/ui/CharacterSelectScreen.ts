import { BaseScreen, createButton, createTitle } from './Screen';
import { CHARACTERS } from '../data/characters';
import { sanitizePlayerName, PLAYER_NAME_MAX_LENGTH } from '../utils/sanitize';
import type { CharacterDefinition } from '../data/types';

export const TEAM_SIZE = 2;

const STAT_LABELS: ReadonlyArray<[keyof CharacterDefinition['baseStats'], string]> = [
  ['maxHp', 'Vida'],
  ['damage', 'Dano'],
  ['attackSpeed', 'Vel. Ataque'],
  ['range', 'Alcance'],
  ['defense', 'Defesa'],
  ['critChance', 'Crítico %'],
  ['dodgeChance', 'Esquiva %'],
];

/**
 * Tela de seleção (SPEC-JOGO §11/§12): nome do jogador, 5 personagens,
 * seleção de 2, descrição das passivas e botão Iniciar Run.
 */
export class CharacterSelectScreen extends BaseScreen {
  private readonly selected = new Map<string, CharacterDefinition>();
  private readonly startButton: HTMLButtonElement;
  private readonly nameInput: HTMLInputElement;

  constructor(
    private readonly onConfirm: (team: CharacterDefinition[], playerName: string) => void,
    onBack: () => void,
  ) {
    super('screen--select');

    const hint = document.createElement('p');
    hint.className = 'screen__hint';
    hint.textContent = `Escolha ${TEAM_SIZE} dos ${CHARACTERS.length} amigos`;

    const nameLabel = document.createElement('label');
    nameLabel.className = 'screen__field';
    const nameLabelText = document.createElement('span');
    nameLabelText.textContent = 'Seu nome (para o ranking)';
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.maxLength = PLAYER_NAME_MAX_LENGTH;
    this.nameInput.placeholder = 'Anônimo';
    this.nameInput.autocomplete = 'off';
    nameLabel.append(nameLabelText, this.nameInput);

    const grid = document.createElement('div');
    grid.className = 'char-grid';
    for (const character of CHARACTERS) {
      grid.append(this.createCard(character));
    }

    this.startButton = createButton('Iniciar Run', () => {
      if (this.selected.size === TEAM_SIZE) {
        const name = sanitizePlayerName(this.nameInput.value) || 'Anônimo';
        this.onConfirm([...this.selected.values()], name);
      }
    });
    this.startButton.disabled = true;

    const buttons = document.createElement('div');
    buttons.className = 'screen__buttons screen__buttons--row';
    buttons.append(this.startButton, createButton('Voltar', onBack));

    this.element.append(createTitle('Escolha seu time', 2), nameLabel, hint, grid, buttons);
  }

  private createCard(character: CharacterDefinition): HTMLElement {
    const card = document.createElement('button');
    card.className = 'char-card';
    card.style.setProperty('--char-color', character.color);

    const name = document.createElement('span');
    name.className = 'char-card__name';
    name.textContent = character.name;

    const passive = document.createElement('span');
    passive.className = 'char-card__passive';
    passive.textContent = `${character.passive.name} — ${character.passive.description}`;

    const stats = document.createElement('span');
    stats.className = 'char-card__stats';
    stats.textContent = STAT_LABELS
      .map(([key, label]) => `${label}: ${character.baseStats[key]}`)
      .join(' · ');

    card.append(name, passive, stats);
    card.addEventListener('click', () => this.toggle(character, card));
    return card;
  }

  private toggle(character: CharacterDefinition, card: HTMLElement): void {
    if (this.selected.has(character.id)) {
      this.selected.delete(character.id);
      card.classList.remove('char-card--selected');
    } else if (this.selected.size < TEAM_SIZE) {
      this.selected.set(character.id, character);
      card.classList.add('char-card--selected');
    }
    this.startButton.disabled = this.selected.size !== TEAM_SIZE;
  }
}
