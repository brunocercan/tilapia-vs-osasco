import type { PhaseDefinition } from '../data/types';

interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface PhaseTheme {
  skyTop: string;
  skyBottom: string;
  groundY: number; // fração da altura onde começa o chão
  groundColor: string;
  shapes: Shape[]; // silhuetas pixeladas do cenário
}

/**
 * Cenários minimalistas por fase (SPEC-JOGO §2/§15):
 * formas simples com poucos elementos, foco em legibilidade.
 * Computados uma vez por layout — nada de alocação por frame (§24).
 */

function mataoTheme(w: number, h: number): PhaseTheme {
  const shapes: Shape[] = [];
  const sky = { skyTop: '#1a2f1a', skyBottom: '#0d160f' };
  // copas de árvores (círculos pixelados = blocos) + troncos
  for (let i = 0; i < 4; i++) {
    const tx = w * (0.12 + i * 0.24);
    shapes.push({ x: tx - 3, y: h * 0.28, w: 6, h: h * 0.24, color: '#2d4a22' });
    shapes.push({ x: tx - 14, y: h * 0.16, w: 28, h: h * 0.14, color: '#24401c' });
  }
  // arbustos no chão
  shapes.push({ x: w * 0.3, y: h * 0.62, w: 30, h: 12, color: '#24401c' });
  shapes.push({ x: w * 0.68, y: h * 0.63, w: 34, h: 12, color: '#24401c' });
  return { ...sky, groundY: 0.66, groundColor: '#1c2e16', shapes };
}

function remediosTheme(w: number, h: number): PhaseTheme {
  const shapes: Shape[] = [];
  const sky = { skyTop: '#1c2430', skyBottom: '#10141c' };
  // prédios do fundo da cidade
  const buildings = [0.55, 0.45, 0.6, 0.5, 0.58];
  buildings.forEach((frac, i) => {
    const bw = w * 0.14;
    const bx = i * bw * 1.15;
    const bh = h * frac;
    shapes.push({ x: bx, y: h * 0.68 - bh, w: bw, h: bh, color: i % 2 ? '#26303f' : '#2b3648' });
    // janelas acesas
    for (let wy = 0; wy < 3; wy++) {
      for (let wx = 0; wx < 2; wx++) {
        shapes.push({ x: bx + 6 + wx * 10, y: h * 0.68 - bh + 8 + wy * 14, w: 5, h: 5, color: '#c9b458' });
      }
    }
  });
  // faixa da rua
  shapes.push({ x: 0, y: h * 0.68, w, h: 6, color: '#1a1f28' });
  return { ...sky, groundY: 0.68, groundColor: '#14181f', shapes };
}

function tocaTheme(w: number, h: number): PhaseTheme {
  const shapes: Shape[] = [];
  const sky = { skyTop: '#251a14', skyBottom: '#17100c' };
  // parede com rodapé e quadro na parede (dentro da "toca")
  shapes.push({ x: 0, y: h * 0.64, w, h: h * 0.04, color: '#2e2019' });
  // quadro com moldura (referência ao quadro da sala)
  shapes.push({ x: w * 0.42, y: h * 0.2, w: w * 0.16, h: h * 0.16, color: '#3a2a20' });
  shapes.push({ x: w * 0.43, y: h * 0.21, w: w * 0.14, h: h * 0.14, color: '#4a6741' });
  shapes.push({ x: w * 0.45, y: h * 0.23, w: 10, h: 8, color: '#c9b458' }); // luminária do quadro
  // escuridão de canto
  shapes.push({ x: 0, y: 0, w: w * 0.1, h: h * 0.66, color: 'rgba(0,0,0,0.25)' });
  shapes.push({ x: w * 0.9, y: 0, w: w * 0.1, h: h * 0.66, color: 'rgba(0,0,0,0.25)' });
  return { ...sky, groundY: 0.66, groundColor: '#241911', shapes };
}

/** Monta e cacheia o tema visual da fase conforme o tamanho da tela. */
export class PhaseBackdrop {
  private theme: PhaseTheme | null = null;

  constructor(private readonly phase: PhaseDefinition) {}

  layout(width: number, height: number): void {
    switch (this.phase.id) {
      case 'osasco':
        this.theme = remediosTheme(width, height);
        break;
      case 'toca':
        this.theme = tocaTheme(width, height);
        break;
      default:
        this.theme = mataoTheme(width, height);
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.theme) {
      this.layout(width, height);
    }
    const theme = this.theme!;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, theme.skyTop);
    gradient.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (const shape of theme.shapes) {
      ctx.fillStyle = shape.color;
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    }

    // chão
    ctx.fillStyle = theme.groundColor;
    ctx.fillRect(0, theme.groundY * height, width, height * (1 - theme.groundY));
    ctx.fillStyle = 'rgba(126, 200, 80, 0.08)';
    ctx.fillRect(0, theme.groundY * height, width, 3);
  }
}
