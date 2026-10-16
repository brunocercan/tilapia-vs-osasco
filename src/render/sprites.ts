/**
 * Sprites pixel art procedurais (SPEC-JOGO §15 / SPEC-TECNICA §21).
 * Desenhados em Canvas como blocos de pixels — sem assets externos —
 * usando como referência os traços das fotos em /Source-Images:
 *
 * - Kiki:      cabelo escuro espetado, barba cheia escura, camiseta cinza
 * - Tombas:    franja na testa, bigode+barba, camisa xadrez vermelha
 * - Veronezio: cabelo curto, óculos retangular, blazer azul-marinho
 * - Marcola:   óculos redondo, barba ruiva, terno com gravata
 * - Mattioni:  cabelo bagunçado, óculos redondo, jaqueta jeans
 * - Gabsmanolo: cabelo bagunçado, barba curta, camiseta vermelha de
 *               pizzaria com fatia de pizza no peito (v1.7.0 — a IA não
 *               consegue ver /Source-Images/Gabsmanolo.png; ajuste as
 *               cores da spec conforme a referência)
 *
 * Animações (idle/walk/attack/hit) são transformações procedurais
 * (balanço, avanço do braço), condizente com "poucos frames".
 */

type PixelPlotter = (x: number, y: number, w: number, h: number, color: string) => void;

interface CharacterSpriteSpec {
  skin: string;
  hair: string;
  hairStyle: 'spiky' | 'fringe' | 'short' | 'messy' | 'light';
  beardStyle: 'full' | 'goatee' | 'short';
  beard: string;
  glasses: 'none' | 'rect' | 'round';
  glassesColor: string;
  shirt: string;
  jacket?: string;
  pants: string;
  tie?: string;
  plaidAccent?: string;
  /** Fatia de pizza no peito da camisa (Gabsmanolo, v1.7.0). */
  pizza?: boolean;
}

const CHARACTER_SPECS: Record<string, CharacterSpriteSpec> = {
  kiki: {
    skin: '#e8b58e',
    hair: '#1c1a17',
    hairStyle: 'spiky',
    beardStyle: 'full',
    beard: '#241f1c',
    glasses: 'none',
    glassesColor: '#000',
    shirt: '#9aa0a3',
    pants: '#3a3f44',
  },
  tombas: {
    skin: '#e9bfa0',
    hair: '#3b2a1e',
    hairStyle: 'fringe',
    beardStyle: 'goatee',
    beard: '#33241a',
    glasses: 'none',
    glassesColor: '#000',
    shirt: '#a41f1f',
    plaidAccent: '#1e1e1e',
    pants: '#23272e',
  },
  veronezio: {
    skin: '#db9f72',
    hair: '#141414',
    hairStyle: 'short',
    beardStyle: 'short',
    beard: '#20242a',
    glasses: 'rect',
    glassesColor: '#20242a',
    shirt: '#1f3a5f',
    jacket: '#16283f',
    pants: '#23303f',
  },
  marcola: {
    skin: '#efc49b',
    hair: '#7a5a3a',
    hairStyle: 'light',
    beardStyle: 'full',
    beard: '#a06428',
    glasses: 'round',
    glassesColor: '#1d2126',
    shirt: '#e8e4dc',
    jacket: '#232c3d',
    tie: '#28457a',
    pants: '#2b2b2b',
  },
  mattioni: {
    skin: '#e0a880',
    hair: '#4a3223',
    hairStyle: 'messy',
    beardStyle: 'full',
    beard: '#3d2b1d',
    glasses: 'round',
    glassesColor: '#24282e',
    shirt: '#15171a',
    jacket: '#3f5c7a',
    pants: '#26282d',
  },
  gabsmanolo: {
    skin: '#e6b088',
    hair: '#2a1d12',
    hairStyle: 'messy',
    beardStyle: 'short',
    beard: '#241a12',
    glasses: 'none',
    glassesColor: '#000',
    shirt: '#b02e2e', // camiseta vermelha de pizzaria
    pizza: true,
    pants: '#2b2b30',
  },
};

const EYE = '#141414';
const SHOE = '#141414';

function makePlotter(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  unit: number,
  flip: boolean,
): PixelPlotter {
  return (x, y, w, h, color) => {
    // flip espelha em torno da origem (personagens olham para a direita)
    const px = flip ? originX - (x + w) * unit : originX + x * unit;
    ctx.fillStyle = color;
    ctx.fillRect(px, originY + y * unit, w * unit, h * unit);
  };
}

function drawHair(P: PixelPlotter, spec: CharacterSpriteSpec): void {
  const h = spec.hair;
  switch (spec.hairStyle) {
    case 'spiky': // Kiki: volume no topo com pontas
      P(3, 0, 2, 1, h); P(6, 0, 2, 1, h); P(10, 0, 2, 1, h);
      P(3, 1, 10, 4, h);
      P(3, 3, 1, 4, h); P(12, 3, 1, 4, h);
      break;
    case 'fringe': // Tombas: franja cobrindo a testa, lateral comprida
      P(3, 0, 10, 4, h);
      P(3, 2, 2, 6, h);
      P(5, 3, 4, 2, h);
      P(12, 2, 1, 4, h);
      break;
    case 'short': // Veronezio: corte curto e alinhado
      P(4, 0, 8, 3, h);
      P(3, 1, 1, 3, h); P(12, 1, 1, 3, h);
      break;
    case 'messy': // Mattioni: cabelo armado/bagunçado
      P(3, 0, 10, 4, h);
      P(2, 1, 1, 2, h); P(13, 1, 1, 3, h);
      P(1, 2, 1, 1, h); P(14, 0, 1, 2, h);
      P(3, 3, 1, 5, h); P(12, 3, 1, 5, h);
      break;
    case 'light': // Marcola: fio claro e ralo no topo
      P(4, 2, 8, 2, h);
      P(3, 3, 1, 3, h); P(12, 3, 1, 3, h);
      break;
  }
}

function drawGlasses(P: PixelPlotter, spec: CharacterSpriteSpec): void {
  if (spec.glasses === 'none') {
    return;
  }
  const g = spec.glassesColor;
  // duas lentes 3x3 + ponte; "rect" é mais alto, "round" mais estreito
  const top = spec.glasses === 'rect' ? 5 : 6;
  const bottom = spec.glasses === 'rect' ? 9 : 8;
  for (const lx of [5, 9]) {
    P(lx, top, 3, 1, g);
    P(lx, bottom - 1, 3, 1, g);
    P(lx, top, 1, bottom - top, g);
    P(lx + 2, top, 1, bottom - top, g);
  }
  P(8, top + 1, 1, 1, g); // ponte
}

function drawBeard(P: PixelPlotter, spec: CharacterSpriteSpec): void {
  switch (spec.beardStyle) {
    case 'full': // Kiki / Marcola / Mattioni: barba cobrindo a mandíbula
      P(4, 9, 8, 3, spec.beard);
      P(4, 8, 1, 2, spec.beard); P(11, 8, 1, 2, spec.beard);
      break;
    case 'goatee': // Tombas: bigode + cavanhaque
      P(5, 9, 6, 1, spec.beard);
      P(6, 10, 4, 2, spec.beard);
      break;
    case 'short': // Veronezio: barba aparada
      P(4, 9, 8, 2, spec.beard);
      P(4, 8, 1, 1, spec.beard); P(11, 8, 1, 1, spec.beard);
      break;
  }
}

export interface SpriteDrawOptions {
  flip?: boolean;
  attacking?: boolean;
  alpha?: number;
}

/**
 * Desenha um personagem (16u × 22u de grade), âncora no centro inferior.
 * y = linha do chão (pés do sprite).
 */
export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  characterId: string,
  cx: number,
  groundY: number,
  unit: number,
  options: SpriteDrawOptions = {},
): void {
  const spec = CHARACTER_SPECS[characterId];
  if (!spec) {
    ctx.fillStyle = '#7ec850';
    ctx.fillRect(cx - 8 * unit, groundY - 22 * unit, 16 * unit, 22 * unit);
    return;
  }

  const originX = cx - 8 * unit;
  const originY = groundY - 22 * unit;
  const P = makePlotter(ctx, originX, originY, unit, options.flip ?? false);

  const prevAlpha = ctx.globalAlpha;
  if (options.alpha !== undefined) {
    ctx.globalAlpha = options.alpha;
  }

  // cabeça
  P(4, 3, 8, 8, spec.skin);
  drawHair(P, spec);
  P(6, 7, 1, 1, EYE); P(9, 7, 1, 1, EYE);
  drawGlasses(P, spec);
  drawBeard(P, spec);

  // pescoço e tronco
  P(6, 11, 4, 1, spec.skin);
  P(3, 12, 10, 6, spec.shirt);
  if (spec.plaidAccent) {
    // xadrez da camisa do Tombas
    P(3, 13, 10, 1, spec.plaidAccent);
    P(3, 16, 10, 1, spec.plaidAccent);
    P(5, 12, 1, 6, spec.plaidAccent);
    P(9, 12, 1, 6, spec.plaidAccent);
  }
  if (spec.jacket) {
    P(3, 12, 2, 6, spec.jacket);
    P(11, 12, 2, 6, spec.jacket);
  }
  if (spec.tie) {
    P(7, 12, 2, 4, spec.tie);
  }
  if (spec.pizza) {
    // Gabsmanolo: fatia de pizza no peito (borda, queijo e calabresa)
    P(6, 13, 4, 1, '#d1a054'); // borda dourada
    P(6, 14, 4, 1, '#f2c14e'); // queijo
    P(7, 15, 3, 1, '#f2c14e');
    P(7, 16, 2, 1, '#f2c14e'); // ponta da fatia
    P(7, 14, 1, 1, '#b03a2e'); // calabresa
  }

  // braço de ataque: estende para frente
  if (options.attacking) {
    P(12, 13, 4, 2, spec.jacket ?? spec.shirt);
    P(16, 13, 2, 2, spec.skin); // punho
  } else {
    P(2, 12, 1, 5, spec.jacket ?? spec.shirt);
    P(13, 12, 1, 5, spec.jacket ?? spec.shirt);
  }

  // pernas e sapatos
  P(4, 18, 3, 4, spec.pants);
  P(9, 18, 3, 4, spec.pants);
  P(4, 21, 3, 1, SHOE);
  P(9, 21, 3, 1, SHOE);

  ctx.globalAlpha = prevAlpha;
}
