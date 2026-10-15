import { BaseScreen, createButton, createTitle } from './Screen';
import { CHANGELOG } from '../data/changelog';

/** Tela "Novidades" — exibe o changelog da última versão. */
export class ChangelogScreen extends BaseScreen {
  constructor(onBack: () => void) {
    super('screen--changelog');

    const list = document.createElement('ul');
    list.className = 'screen__list';
    for (const entry of CHANGELOG) {
      const li = document.createElement('li');
      li.textContent = entry;
      list.append(li);
    }

    this.element.append(createTitle('Novidades', 2), list, createButton('Voltar', onBack));
  }
}
