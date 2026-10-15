import './style.css';
import { GAME_CONFIG } from './config/gameConfig';
import { Game } from './game/Game';

function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Elemento #${id} não encontrado no DOM`);
  }
  return element as T;
}

const canvas = getRequiredElement<HTMLCanvasElement>('game-canvas');
const uiRoot = getRequiredElement<HTMLDivElement>('ui-root');
const overlayCanvas = getRequiredElement<HTMLCanvasElement>('overlay-canvas');

const game = new Game(canvas, uiRoot, overlayCanvas);
game.start();

console.info(`${GAME_CONFIG.title} v1.0 — auto battler 2D do grupo Tilápia. Boa run!`);
