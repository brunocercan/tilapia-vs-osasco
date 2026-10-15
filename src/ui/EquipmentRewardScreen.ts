import { BaseScreen, createButton, createTitle } from './Screen';
import { BALANCE } from '../data/balance';
import type { CharacterDefinition, EquipmentDefinition } from '../data/types';

export interface EquipmentRewardHooks {
  getOptions: () => EquipmentDefinition[];
  getTeam: () => readonly CharacterDefinition[];
  /** Nomes dos equipamentos já ocupando os slots do personagem. */
  getEquipmentNames: (characterId: string) => string[];
  /** Itens equipados (definições completas) — passo de substituição (v1.3.0). */
  getEquippedItems: (characterId: string) => EquipmentDefinition[];
  /** `replacedId` informado = substitui o item antigo pelo novo (v1.3.0). */
  onAssigned: (characterId: string, equipmentId: string, replacedId?: string) => void;
  /** v1.6.0: pular a recompensa — ex.: slots cheios e nada vale a substituição. */
  onSkip: () => void;
}

/**
 * Tela de recompensa pós-boss (SPEC-JOGO §12):
 * "BOSS DERROTADO! Escolha 1 equipamento: [A] [B]"
 * Depois o jogador escolhe qual personagem ocupa o slot — e, com os slots
 * cheios, qual item é substituído (v1.3.0: itens novos sempre podem entrar).
 */
export class EquipmentRewardScreen extends BaseScreen {
  private readonly optionContainer: HTMLElement;
  private readonly assignContainer: HTMLElement;
  private readonly assignTitle: HTMLHeadingElement;
  private readonly skipButton: HTMLButtonElement;
  private step: 'pick' | 'assign' | 'replace' = 'pick';
  private chosen: EquipmentDefinition | null = null;

  constructor(private readonly hooks: EquipmentRewardHooks) {
    super('screen--reward');

    this.optionContainer = document.createElement('div');
    this.optionContainer.className = 'equip-grid';

    this.assignTitle = createTitle('', 2);
    this.assignContainer = document.createElement('div');
    this.assignContainer.className = 'equip-grid';

    // v1.6.0: pular a recompensa (útil com slots cheios — nada obrigado a substituir)
    this.skipButton = createButton('Pular recompensa (manter itens atuais)', () => this.hooks.onSkip());
    this.skipButton.classList.add('btn--secondary');

    this.element.append(
      createTitle('BOSS DERROTADO!', 2),
      this.optionContainer,
      this.assignTitle,
      this.assignContainer,
      this.skipButton,
    );
  }

  show(): void {
    this.renderPickStep();
    super.show();
  }

  private renderPickStep(): void {
    this.step = 'pick';
    this.chosen = null;
    this.assignTitle.textContent = '';
    this.assignContainer.replaceChildren();
    this.assignContainer.style.display = 'none';
    this.optionContainer.style.display = '';
    this.skipButton.style.display = '';

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
    this.skipButton.style.display = 'none';

    this.assignTitle.textContent = `Quem equipa ${option.name}?`;
    this.assignContainer.replaceChildren();

    for (const character of this.hooks.getTeam()) {
      const items = this.hooks.getEquippedItems(character.id);
      const maxSlots = BALANCE.equipment.maxSlots;
      const full = items.length >= maxSlots;
      // Item não-acumulável que o personagem já tem: não pode reequipar.
      const jaPossuiNaoAcumulavel = !option.stackable && items.some((item) => item.id === option.id);

      const card = document.createElement('button');
      card.className = 'char-card equip-card';
      card.style.setProperty('--char-color', character.color);
      card.disabled = jaPossuiNaoAcumulavel;

      const name = document.createElement('span');
      name.className = 'char-card__name';
      name.textContent = character.name;
      const slots = document.createElement('span');
      slots.className = 'char-card__passive';
      slots.textContent = jaPossuiNaoAcumulavel
        ? 'Slots cheios'
        : full
          ? `Slots cheios (${items.map((item) => item.name).join(', ')}) — substitua um item`
          : `Slots: ${items.length}/${maxSlots}` + (items.length > 0 ? ` (${items.map((item) => item.name).join(', ')})` : '');
      card.append(name, slots);

      card.addEventListener('click', () => {
        if (this.step !== 'assign' || !this.chosen) {
          return;
        }
        if (full) {
          this.renderReplaceStep(character, this.chosen);
        } else {
          this.hooks.onAssigned(character.id, this.chosen.id);
        }
      });
      this.assignContainer.append(card);
    }

    const back = createButton('Escolher outro equipamento', () => this.renderPickStep());
    back.classList.add('btn--secondary');
    this.assignContainer.append(back);
  }

  /** v1.3.0: slots cheios → escolhe qual item antigo sai para o novo entrar. */
  private renderReplaceStep(character: CharacterDefinition, option: EquipmentDefinition): void {
    this.step = 'replace';
    this.assignTitle.textContent = `Substituir qual item de ${character.name} por ${option.name}?`;
    this.assignContainer.replaceChildren();

    for (const item of this.hooks.getEquippedItems(character.id)) {
      const card = document.createElement('button');
      card.className = 'char-card equip-card';
      card.style.setProperty('--char-color', item.color);
      if (item.rarity === 'lendario') {
        card.classList.add('equip-card--lendario');
      }

      const name = document.createElement('span');
      name.className = 'char-card__name';
      name.textContent = item.name;
      const desc = document.createElement('span');
      desc.className = 'char-card__passive';
      desc.textContent = item.description;
      card.append(name, desc);

      if (item.rarity === 'lendario') {
        const badge = document.createElement('span');
        badge.className = 'equip-card__badge';
        badge.textContent = '★ LENDÁRIO';
        card.append(badge);
      }

      card.addEventListener('click', () => {
        if (this.step === 'replace') {
          this.hooks.onAssigned(character.id, option.id, item.id);
        }
      });
      this.assignContainer.append(card);
    }

    const back = createButton('Escolher outro personagem', () => {
      if (this.chosen) {
        this.renderAssignStep(this.chosen);
      }
    });
    back.classList.add('btn--secondary');
    this.assignContainer.append(back);
  }
}
