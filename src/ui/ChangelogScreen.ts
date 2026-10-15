import { BaseScreen, createButton, createTitle } from './Screen';
import { CHANGELOG } from '../data/changelog';

/** Quantidade de novidades exibidas — apenas as mais recentes. */
const MAX_ENTRIES = 5;

/** Tela "Novidades" — exibe as últimas alterações (mais recentes primeiro). */
export class ChangelogScreen extends BaseScreen {
  constructor(onBack: () => void) {
    super('screen--changelog');

    const list = document.createElement('ul');
    // A lista rola quando estoura a tela; o botão Voltar fica sempre visível.
    list.className = 'screen__list screen__list--scroll';
    for (const entry of CHANGELOG.slice(0, MAX_ENTRIES)) {
      const li = document.createElement('li');
      li.textContent = entry;
      list.append(li);
    }

    this.element.append(createTitle('Novidades', 2), list, createButton('Voltar', onBack));
  }
}
