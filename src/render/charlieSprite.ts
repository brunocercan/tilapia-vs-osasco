/**
 * Easter egg: rosto do "boss secreto" Charlie Kirk (pedido do usuário).
 * Sprite pixel art de maior resolução (grade 20×26 — mais pixels que os
 * sprites normais de 16×22), somente o rosto, baseada em
 * /Source-Images/Charlie.png: cabelo castanho ondulado, sobrancelhas
 * escuras, olhos castanhos, sorriso aberto, terno azul com colarinho.
 *
 * Fora da SPEC-JOGO por ser easter egg; registrado em
 * PROGRESSO-DESENVOLVIMENTO.md.
 */

const PALETTE: Record<string, string> = {
  H: '#241a12', // cabelo castanho escuro
  K: '#171008', // cabelo sombra
  S: '#e3b28c', // pele
  s: '#c8946e', // pele sombra
  E: '#2a1d12', // sobrancelha
  W: '#f5f2ec', // branco do olho
  I: '#4a3520', // íris castanha
  N: '#cf9d74', // sombra do nariz
  M: '#7a3b2e', // interior da boca
  T: '#eae6dd', // dentes
  R: '#b06a52', // lábios
  J: '#1e2b45', // terno azul-marinho
  C: '#e8e4dc', // colarinho da camisa
};

// Grade 20×26. Cada string DEVE ter exatamente 20 caracteres.
const FACE: readonly string[] = [
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
];

export const CHARLIE_FACE_COLS = 20;
export const CHARLIE_FACE_ROWS = 26;

/**
 * Desenha o rosto ancorado no centro superior (cx, topY).
 * unit = tamanho de cada "pixel" em px de tela.
 */
export function drawCharlieFace(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  unit: number,
): void {
  const originX = cx - (CHARLIE_FACE_COLS / 2) * unit;
  for (let row = 0; row < FACE.length; row++) {
    const line = FACE[row];
    for (let col = 0; col < line.length; col++) {
      const color = PALETTE[line[col]];
      if (!color) {
        continue; // '.' transparente
      }
      ctx.fillStyle = color;
      ctx.fillRect(originX + col * unit, topY + row * unit, unit, unit);
    }
  }
}
