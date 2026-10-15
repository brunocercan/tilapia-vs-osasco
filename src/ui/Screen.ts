/** Contrato de telas em HTML (menus). A batalha será renderizada no Canvas. */
export interface Screen {
  readonly element: HTMLElement;
  show(): void;
  hide(): void;
}

/** Classe base simples para telas: div escondida por padrão. */
export abstract class BaseScreen implements Screen {
  readonly element: HTMLElement;

  protected constructor(className: string) {
    this.element = document.createElement('div');
    this.element.className = `screen ${className}`;
    this.hide();
  }

  show(): void {
    this.element.classList.add('screen--visible');
  }

  hide(): void {
    this.element.classList.remove('screen--visible');
  }
}

export function createTitle(text: string, level: 1 | 2 = 1): HTMLHeadingElement {
  const title = document.createElement(level === 1 ? 'h1' : 'h2');
  title.className = 'screen__title';
  title.textContent = text;
  return title;
}

export function createButton(label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}
