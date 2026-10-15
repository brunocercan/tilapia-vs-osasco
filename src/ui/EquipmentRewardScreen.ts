import { BaseScreen, createButton, createTitle } from './Screen';
import { BALANCE } from '../data/balance';
import type { CharacterDefinition, EquipmentDefinition } from '../data/types';

export interface EquipmentRewardHooks {
  getOptions: () => EquipmentDefinition[];
  getTeam: () => readonly CharacterDefinition[];
  /** Nomes dos equipamentos já ocupando os slots do personagem. */
  getEquipmentNames: (characterId: string) => string[];
  onAssigned: (characterId: string, equipmentId: string) => void;
}

/**
 * Tela de recompensa pós-boss (SPEC-JOGO §12):
 * "BOSS DERROTADO! Escolha 1 equipamento: [A] [B]"
 * Depois o jogador escolhe qual personagem ocupa o slot.
 */
export class EquipmentRewardScreen extends BaseScreen {
  private readonly optionContainer: HTMLElement;
  private readonly assignContainer: HTMLElement;
  private readonly assignTitle: HTMLHeadingElement;
  private step: 'pick' | 'assign' = 'pick';
  private chosen: EquipmentDefinition | null = null;

  constructor(private readonly hooks: EquipmentRewardHooks) {
    super('screen--reward');

    this.optionContainer = document.createElement('div');
    this.optionContainer.className = 'equip-grid';

    this.assignTitle = createTitle('', 2);
    this.assignContainer = document.createElement('div');
    this.assignContainer.className = 'equip-grid';

    this.element.append(createTitle('BOSS DERROTADO!', 2), this.optionContainer, this.assignTitle, this.assignContainer);
  }

  show(): void {
    this.step = 'pick';
    this.chosen = null;
    this.renderPickStep();
    super.show();
  }

  private renderPickStep(): void {
    this.assignTitle.textContent = '';
    this.assignContainer.replaceChildren();
    this.assignContainer.style.display = 'none';
    this.optionContainer.style.display = '';

    this.optionContainer.replaceChildren();
    const hint = document.createElement('p');
    hint.className = 'screen__hint';
    hint.textContent = 'Escolha 1 equipamento:';
    this.optionContainer.append(hint);

    for (const option of this.hooks.getOptions()) {
      const card = document.createElement('button');
      card.className = 'char-card equip-card';
      card.style.setProperty('--char-color', option.color);
      if (option.rarity === 'lendario') {
        card.classList.add('equip-card--lendario');
      }

      const name = document.createElement('span');
      name.className = 'char-card__name';
      name.textContent = option.name;
      const desc = document.createElement('span');
      desc.className = 'char-card__passive';
      desc.textContent = option.description;
      card.append(name, desc);

      if (option.rarity === 'lendario') {
        const badge = document.createElement('span');
        badge.className = 'equip-card__badge';
        badge.textContent = '★ LENDÁRIO';
        card.append(badge);
      }

      card.addEventListener('click', () => this.renderAssignStep(option));
      this.optionContainer.append(card);
    }
  }

  private renderAssignStep(option: EquipmentDefinition): void {
    this.step = 'assign';
    this.chosen = option;
    this.optionContainer.style.display = 'none';
    this.assignContainer.style.display = '';

    this.assignTitle.textContent = `Quem equipa ${option.name}?`;
    this.assignContainer.replaceChildren();

    for (const character of this.hooks.getTeam()) {
      const items = this.hooks.getEquipmentNames(character.id);
      const full = items.length >= BALANCE.equipment.maxSlots;

      const card = document.createElement('button');
      card.className = 'char-card equip-card';
      card.style.setProperty('--char-color', character.color);
      card.disabled = full;

      const name = document.createElement('span');
      name.className = 'char-card__name';
      name.textContent = character.name;
      const slots = document.createElement('span');
      slots.className = 'char-card__passive';
      const maxSlots = BALANCE.equipment.maxSlots;
      slots.textContent = full
        ? 'Slots cheios'
        : `Slots: ${items.length}/${maxSlots}` + (items.length > 0 ? ` (${items.join(', ')})` : '');
      card.append(name, slots);

      card.addEventListener('click', () => {
        if (this.step === 'assign' && this.chosen) {
          this.hooks.onAssigned(character.id, this.chosen.id);
        }
      });
      this.assignContainer.append(card);
    }

    const back = createButton('Escolher outro equipamento', () => this.renderPickStep());
    back.classList.add('btn--secondary');
    this.assignContainer.append(back);
  }
}
