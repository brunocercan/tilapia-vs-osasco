import { GAME_CONFIG } from '../config/gameConfig';
import type { RandomService } from '../services/RandomService';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
}

/**
 * Fundo animado simples em pixel art: blocos flutuantes de floresta escura.
 * Partículas são criadas uma única vez (sem alocação no frame — SPEC-TECNICA §24).
 */
export class Background {
  private particles: Particle[] = [];
  private initialized = false;

  constructor(private readonly random: RandomService) {}

  private ensureParticles(width: number, height: number): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const cfg = GAME_CONFIG.background;
    for (let i = 0; i < cfg.particleCount; i++) {
      this.particles.push({
        x: this.random.randomFloat(0, width),
        y: this.random.randomFloat(0, height),
        size: this.random.randomFloat(cfg.minSize, cfg.maxSize),
        speed: this.random.randomFloat(cfg.minSpeed, cfg.maxSpeed),
      });
    }
  }

  update(deltaSeconds: number, width: number, height: number): void {
    this.ensureParticles(width, height);
    for (const p of this.particles) {
      p.y -= p.speed * deltaSeconds;
      if (p.y + p.size < 0) {
        p.y = height;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#16241a');
    gradient.addColorStop(1, '#0d160f');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(90, 140, 90, 0.15)';
    for (const p of this.particles) {
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }
  }
}
