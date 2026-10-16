import { BaseScreen, createButton, createTitle } from './Screen';

const HOW_TO_PLAY_ITEMS: readonly string[] = [
  'Escolha 2 dos 6 amigos do grupo Tilápia.',
  'O combate é 100% automático — seu time luta sozinho.',
  'Vença os inimigos de cada fase e derrote o boss.',
  'A cada boss derrotado, escolha 1 entre 2 equipamentos.',
  'Sobreviva às 3 fases: Matão, Ruas de Osasco e Toca.',
  'Após as 3 fases: continue a run INFINITA ∞ — inimigos mais fortes, mais pontos!',
  'Slots cheios? Escolha qual item substituir pelo novo.',
  'MINI-KIRK pode surgir no meio de qualquer fase: derrote o sub-chefe para XP extra!',
  'Pontos só por inimigos derrotados: quanto mais tempo vivo, maior o multiplicador!',
  'Ao subir de nível, o time cura por completo — e um personagem morto renasce!',
  'Subir de nível ou derrotar o boss pode render um item LENDÁRIO ★',
];

/** Tela "Como Jogar" (SPEC-JOGO §12/§13) — lista com rolagem própria. */
export class HowToPlayScreen extends BaseScreen {
  constructor(onBack: () => void) {
    super('screen--howto');

    const list = document.createElement('ul');
    // A lista rola quando estoura a tela; o botão Voltar fica sempre visível.
    list.className = 'screen__list screen__list--scroll';
    for (const item of HOW_TO_PLAY_ITEMS) {
      const li = document.createElement('li');
      li.textContent = item;
      list.append(li);
    }

    this.element.append(
      createTitle('Como Jogar', 2),
      list,
      createButton('Voltar', onBack),
    );
  }
}
