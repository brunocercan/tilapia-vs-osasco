import { drawCharlieFace, CHARLIE_FACE_ROWS } from '../render/charlieSprite';
import type { RandomService } from '../services/RandomService';

/**
 * Easter egg (pedido do usuário, fora da SPEC-JOGO): um "boss secreto" —
 * o rosto do Charlie Kirk — pode aparecer aleatoriamente em qualquer tela
 * (menu, seleção, batalha, ranking...), desliza do topo, fica alguns
 * segundos e some. Puramente visual, não interfere na run.
 *
 * Números concentrados aqui para facilitar ajuste (anti-spam visual).
 */
export class CharlieEasterEgg {
  /** Espera mínima desde o início da sessão antes da primeira aparição. */
  static readonly WARMUP_SECONDS = 30;
  /** Intervalo mínimo entre aparições. */
  static readonly COOLDOWN_SECONDS = 60;
  /** Chance de aparição por segundo após o warmup. */
  static readonly CHANCE_PER_SECOND = 0.03;
  /** Duração da aparição. */
  static readonly APPEARANCE_SECONDS = 4;

  private elapsedSeconds = 0;
  private lastTriggerAt = -Infinity;
  private activeRemaining = 0;

  constructor(private readonly random: RandomService) {}

  get active(): boolean {
    return this.activeRemaining > 0;
  }

  update(deltaSeconds: number): void {
    if (this.active) {
      this.activeRemaining = Math.max(0, this.activeRemaining - deltaSeconds);
      return;
    }
    this.elapsedSeconds += deltaSeconds;
    if (this.elapsedSeconds < CharlieEasterEgg.WARMUP_SECONDS) {
      return;
    }
    if (this.elapsedSeconds - this.lastTriggerAt < CharlieEasterEgg.COOLDOWN_SECONDS) {
      return;
    }
    if (this.random.chance(CharlieEasterEgg.CHANCE_PER_SECOND * 100 * deltaSeconds)) {
      this.activeRemaining = CharlieEasterEgg.APPEARANCE_SECONDS;
      this.lastTriggerAt = this.elapsedSeconds;
    }
  }

  /** Renderiza sobre TUDO (canvas de overlay acima do DOM dos menus). */
  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.active) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const total = CharlieEasterEgg.APPEARANCE_SECONDS;
    const remaining = this.activeRemaining;
    const fade = Math.min(1, (total - remaining) / 0.4, remaining / 0.4);

    // slide-in a partir do topo
    const popDuration = 0.6;
    const progress = Math.min(1, (total - remaining) / popDuration);
    const slide = 1 - (1 - progress) ** 3; // ease-out cúbico

    ctx.save();
    ctx.globalAlpha = fade;

    // vinheta escura de "jump scare"
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, width, height);

    const unit = Math.min(width, height) / 30;
    const faceHeight = CHARLIE_FACE_ROWS * unit;
    const targetY = height / 2 - faceHeight / 2;
    const topY = -faceHeight + (targetY + faceHeight) * slide;
    const cx = width / 2;

    drawCharlieFace(ctx, cx, topY, unit);

    // barra de "boss" de mentira
    const barWidth = 20 * unit;
    const barY = topY + faceHeight + unit;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(cx - barWidth / 2, barY, barWidth, unit * 1.2);
    ctx.fillStyle = '#d9534f';
    ctx.fillRect(cx - barWidth / 2, barY, barWidth, unit * 1.2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23c';
    ctx.font = `bold ${Math.round(unit * 1.6)}px "Courier New", monospace`;
    ctx.fillText('CHARLIE KIRK', cx, barY + unit * 2.6);
    ctx.fillStyle = '#e8f0e0';
    ctx.font = `${Math.round(unit)}px "Courier New", monospace`;
    ctx.fillText('boss secreto apareceu!!', cx, barY + unit * 3.8);

    ctx.restore();
  }
}
