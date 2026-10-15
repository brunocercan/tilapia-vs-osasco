/**
 * Game loop baseado em requestAnimationFrame (SPEC-TECNICA §12).
 * A lógica recebe deltaTime em segundos para não depender do FPS.
 */
export class GameLoop {
  private frameHandle = 0;
  private lastTime = 0;
  private running = false;

  constructor(
    private readonly update: (deltaSeconds: number) => void,
    private readonly render: () => void,
    private readonly maxDeltaMs: number,
  ) {}

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = performance.now();

    const tick = (now: number): void => {
      if (!this.running) {
        return;
      }
      const deltaMs = Math.min(now - this.lastTime, this.maxDeltaMs);
      this.lastTime = now;

      this.update(deltaMs / 1000);
      this.render();

      this.frameHandle = requestAnimationFrame(tick);
    };

    this.frameHandle = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
  }
}
