/**
 * Sprites pixel art procedurais dos inimigos e bosses (SPEC-JOGO §6/§8).
 * Formas simples e reconhecíveis; âncora no centro inferior (16u × 20u).
 */

type PixelPlotter = (x: number, y: number, w: number, h: number, color: string) => void;

function makePlotter(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  unit: number,
): PixelPlotter {
  return (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(originX + x * unit, originY + y * unit, w * unit, h * unit);
  };
}

const EYE = '#141414';

function drawPernilongo(P: PixelPlotter): void {
  const body = '#4a4f1f';
  const wing = 'rgba(220, 230, 160, 0.7)';
  // corpo fino na vertical, asas laterais, pernas compridas
  P(7, 6, 2, 9, body);
  P(7, 3, 2, 3, body); // cabeça
  P(6, 4, 1, 1, EYE); P(9, 4, 1, 1, EYE);
  P(3, 5, 4, 2, wing); P(9, 5, 4, 2, wing); // asas
  P(5, 15, 1, 3, body); P(10, 15, 1, 3, body); // pernas
  P(8, 1, 1, 2, body); // probóscide
}

function drawCapivara(P: PixelPlotter): void {
  const fur = '#8d6e63';
  const dark = '#6d533f';
  P(3, 8, 10, 7, fur);  // corpanzil
  P(10, 6, 5, 6, fur);  // cabeça
  P(13, 8, 2, 2, dark); // focinho
  P(11, 5, 2, 1, fur);  // orelha
  P(12, 7, 1, 1, EYE);
  P(4, 15, 2, 5, dark); P(10, 15, 2, 5, dark); // pernas
  P(2, 9, 1, 4, fur);   // rabinho
}

function drawMotoboy(P: PixelPlotter): void {
  const jacket = '#e07b39';
  const helmet = '#2b2f36';
  P(5, 3, 6, 5, helmet);     // capacete
  P(7, 7, 4, 2, 'rgba(180,200,220,0.9)'); // viseira
  P(4, 8, 8, 8, jacket);     // jaqueta de motoboy
  P(4, 10, 8, 2, '#f4c150'); // faixa refletiva
  P(5, 16, 3, 4, '#23272e'); P(9, 16, 3, 4, '#23272e'); // pernas
  P(11, 8, 1, 5, helmet);    // mochila
}

function drawPombo(P: PixelPlotter): void {
  const body = '#8d99ae';
  P(5, 8, 7, 6, body);   // corpo
  P(9, 5, 4, 4, body);   // cabeça
  P(13, 6, 2, 1, '#e26d5c'); // bico
  P(10, 6, 1, 1, EYE);
  P(5, 9, 5, 3, '#6d7688');  // asa
  P(6, 14, 1, 5, '#e26d5c'); P(9, 14, 1, 5, '#e26d5c'); // patinhas
}

function drawMeiaPerdida(P: PixelPlotter): void {
  const sock = '#bdb2ff';
  const heel = '#8f84d8';
  P(6, 4, 5, 10, sock);  // cano da meia
  P(6, 14, 8, 4, sock);  // pé (dobrado)
  P(11, 14, 3, 4, heel); // calcanhar/ponta
  P(6, 4, 5, 2, heel);   // elástico
  P(7, 8, 1, 1, EYE); P(9, 8, 1, 1, EYE);
}

function drawRato(P: PixelPlotter): void {
  const fur = '#6c584c';
  P(4, 10, 7, 6, fur);   // corpo baixo
  P(10, 8, 4, 5, fur);   // cabeça
  P(12, 9, 1, 1, EYE);
  P(13, 10, 1, 1, '#e8a0a8'); // nariz rosa
  P(10, 6, 2, 2, '#8d7466');  // orelha
  P(1, 11, 3, 1, fur); P(1, 10, 1, 1, fur); // rabo
  P(5, 16, 2, 3, fur); P(9, 16, 2, 3, fur); // patas
}

function drawBarataP(P: PixelPlotter): void {
  const shell = '#7a5c4a';
  P(6, 8, 4, 8, shell);  // corpo oval pequena
  P(6, 5, 4, 3, shell);  // cabeça
  P(6, 3, 1, 2, shell); P(9, 3, 1, 2, shell); // antenas
  P(4, 10, 2, 1, shell); P(10, 10, 2, 1, shell); // pernas
  P(4, 13, 2, 1, shell); P(10, 13, 2, 1, shell);
  P(7, 6, 1, 1, EYE); P(8, 6, 1, 1, EYE);
}

function drawInsetoGigante(P: PixelPlotter): void {
  const shell = '#4a6741';
  const dark = '#324530';
  P(3, 8, 10, 8, shell);  // corpo grande
  P(9, 5, 5, 5, shell);   // cabeça
  P(11, 6, 1, 1, EYE); P(12, 7, 1, 1, EYE);
  P(5, 6, 6, 3, 'rgba(200,220,180,0.35)'); // asa com brilho
  P(9, 3, 1, 2, dark); P(11, 3, 1, 2, dark); // antenas
  for (let i = 0; i < 3; i += 1) { // 6 pernas
    P(2, 10 + i * 3, 2, 1, dark);
    P(12, 10 + i * 3, 3, 1, dark);
  }
}

function drawCachorroBravo(P: PixelPlotter): void {
  const fur = '#a4673f';
  const dark = '#7e4e2e';
  P(3, 9, 9, 7, fur);    // corpo
  P(10, 6, 6, 6, fur);   // cabeça
  P(14, 8, 2, 3, dark);  // focinho
  P(11, 7, 1, 1, EYE); P(13, 7, 1, 1, EYE);
  P(10, 4, 2, 2, dark);  // orelha
  P(14, 9, 2, 1, '#f2f2f2'); // dente
  P(4, 16, 2, 4, dark); P(9, 16, 2, 4, dark); // pernas
  P(1, 6, 2, 4, fur);    // rabo levantado
}

function drawBarataVoadora(P: PixelPlotter): void {
  const shell = '#5b3d2e';
  const wing = 'rgba(230,210,190,0.45)';
  P(4, 7, 8, 10, shell); // corpo oval grande
  P(5, 4, 6, 4, shell);  // cabeça
  P(6, 5, 1, 1, EYE); P(9, 5, 1, 1, EYE);
  P(6, 2, 1, 2, shell); P(9, 2, 1, 2, shell); // antenas
  P(2, 6, 4, 8, wing); P(10, 6, 4, 8, wing);  // asas abertas
  P(3, 15, 2, 1, '#3f2a20'); P(11, 15, 2, 1, '#3f2a20'); // pernas
}

// ---------- Mini-Kirk (v1.4.0): sub-chefe surpresa ----------
// Design pixel art baseado em /Source-Images/Charlie.png (revivido do antigo
// charlieSprite.ts): rosto grande — cabelo castanho, olhos castanhos,
// sorriso aberto, terno azul com colarinho — sobre um corpinho minúsculo.

const KIRK_PALETTE: Record<string, string> = {
  H: '#241a12', // cabelo castanho escuro
  K: '#171008', // cabelo sombra
  S: '#e3b28c', // pele
  s: '#c8946e', // pele sombra
  E: '#2a1d12', // sobrancelha
  W: '#f5f2ec', // branco do olho
  I: '#4a3520', // íris castanha
  N: '#cf9d74', // sombra do nariz
  M: '#7a3b2e', // interior da boca
  T: '#eae6dd', // dentes / camisa
  R: '#b06a52', // lábios
  J: '#1e2b45', // terno azul-marinho
  C: '#e8e4dc', // colarinho da camisa
  B: '#1a1a1a', // sapatos
};

/** Grade 20×32: 26 linhas de rosto + 6 de corpo. Cada linha tem 20 chars. */
const MINI_KIRK_SPRITE: readonly string[] = [
  '.......HHHHHH.......',
  '.....HHHHHHHHHH.....',
  '....HHHHHHHHHHHH....',
  '...HKHHHHHHHHHKHH...',
  '..HHHHHHHHHHHHHHHH..',
  '..HHHSSHHSHHSSHHH...',
  '...HHSSSSSSSSSSSH...',
  '..HHSSSSSSSSSSSSHH..',
  '..HSSSSSSSSSSSSSSH..',
  '..HSSEEESSSSEEESSH..',
  '..SSSWIWSSSSWIWSSS..',
  '..SSSSSSSSSSSSSSSS..',
  '..SSSSSSSSSSSSSSSS..',
  '..SSSSSSSSNNSSSSSS..',
  '..SSSSSSSNNNSSSSSS..',
  '..SSSSSSSSSSSSSSSS..',
  '..SSSSSRRRRRRRSSSS..',
  '..SSSSMTTTTTTTMSSS..',
  '..SSSSSMTTTTTMSSSS..',
  '..SSSSSSSSSSSSSSSS..',
  '...SSSSSSSSSSSSSS...',
  '....SSSSSSSSSSSS....',
  '.....SSSSSSSSSS.....',
  '......SSSSSSSS......',
  '........ssss........',
  '..JJJJJCCssCCJJJJJ..',
  '.JJJJJJJJTTJJJJJJJJ.',
  '.JJJJJJJTTTTJJJJJJJ.',
  'SJJJJJJJTTTTJJJJJJS',
  '.JJJJJJJJTTJJJJJJJJ.',
  '..JJJJJJ....JJJJJJ..',
  '..BBBBBB....BBBBBB..',
];

function drawMiniKirk(P: PixelPlotter): void {
  // O grid é 20×32 e a âncora do drawEnemySprite é 16×20: desloca
  // dx/dy para centralizar horizontalmente e apoiar os pés no chão.
  const dx = -2;
  const dy = -12;
  for (let row = 0; row < MINI_KIRK_SPRITE.length; row += 1) {
    const line = MINI_KIRK_SPRITE[row];
    for (let col = 0; col < line.length; col += 1) {
      const color = KIRK_PALETTE[line[col]];
      if (color) {
        P(dx + col, dy + row, 1, 1, color);
      }
    }
  }
}

const ENEMY_SPRITES: Record<string, (P: PixelPlotter) => void> = {
  'pernilongo': drawPernilongo,
  'capivara-nervosa': drawCapivara,
  'motoboy-apressado': drawMotoboy,
  'pombo-de-praca': drawPombo,
  'meia-perdida': drawMeiaPerdida,
  'rato-da-toca': drawRato,
  'barata-pequena': drawBarataP,
  'inseto-gigante': drawInsetoGigante,
  'cachorro-bravo': drawCachorroBravo,
  'barata-voadora': drawBarataVoadora,
  'mini-kirk': drawMiniKirk,
};

/**
 * Desenha um inimigo/boss, âncora no centro inferior.
 * cx/cy = centro lógico do lutador; unit = tamanho do pixel lógico.
 */
export function drawEnemySprite(
  ctx: CanvasRenderingContext2D,
  enemyId: string,
  cx: number,
  groundY: number,
  unit: number,
): void {
  const draw = ENEMY_SPRITES[enemyId];
  const originX = cx - 8 * unit;
  const originY = groundY - 20 * unit;
  if (!draw) {
    ctx.fillStyle = '#b04a4a';
    ctx.fillRect(originX, originY, 16 * unit, 20 * unit);
    return;
  }
  draw(makePlotter(ctx, originX, originY, unit));
}

/** Altura (em unidades) usada pelos sprites de inimigo — 20u. */
export const ENEMY_SPRITE_ROWS = 20;
/** Altura dos sprites de personagem — 22u. */
export const CHARACTER_SPRITE_ROWS = 22;
/** Altura (em unidades) do rosto + corpo do Mini-Kirk — 32u (v1.4.0). */
export const MINI_KIRK_SPRITE_ROWS = 32;

/**
 * Altura em unidades do sprite do inimigo: 20u padrão; o Mini-Kirk usa
 * um grid maior (rosto + corpo) e por isso recebe "pixels" menores.
 */
export function enemySpriteRows(enemyId: string): number {
  return enemyId === 'mini-kirk' ? MINI_KIRK_SPRITE_ROWS : ENEMY_SPRITE_ROWS;
}
