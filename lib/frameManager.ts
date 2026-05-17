/**
 * Global Frame Manager - Consolidates all requestAnimationFrame loops
 * into a single efficient loop to prevent jank and improve performance
 */

type FrameCallback = (deltaTime: number, elapsed: number) => void;

interface FrameSubscription {
  id: string;
  priority: number;
  callback: FrameCallback;
}

class FrameManager {
  private callbacks: Map<string, FrameSubscription> = new Map();
  private rafId: number | null = null;
  private lastTime: number = 0;
  private elapsed: number = 0;
  private isRunning: boolean = false;
  private targetFPS: number = 60;

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
  }

  /**
   * Subscribe to frame updates
   * Priority: higher number = runs first (for dependency order)
   */
  subscribe(id: string, callback: FrameCallback, priority: number = 0): () => void {
    this.callbacks.set(id, { id, callback, priority });
    this.start();

    // Return unsubscribe function
    return () => this.unsubscribe(id);
  }

  /**
   * Unsubscribe from frame updates
   */
  unsubscribe(id: string): void {
    this.callbacks.delete(id);
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  /**
   * Start the frame loop
   */
  private start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.elapsed = 0;
    this.tick();
  }

  /**
   * Stop the frame loop
   */
  private stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
  }

  /**
   * Frame tick - executes all callbacks in priority order
   */
  private tick = (): void => {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;
    this.elapsed += deltaTime;

    // Skip frame if document is hidden (tab not active)
    if (document.hidden) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    // Execute callbacks in priority order (highest first)
    const sortedCallbacks = Array.from(this.callbacks.values())
      .sort((a, b) => b.priority - a.priority);

    for (const subscription of sortedCallbacks) {
      subscription.callback(deltaTime, this.elapsed);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  /**
   * Get current elapsed time
   */
  getElapsed(): number {
    return this.elapsed;
  }

  /**
   * Force reset (useful for page transitions)
   */
  reset(): void {
    this.elapsed = 0;
    this.lastTime = performance.now();
  }
}

// Global instance
let frameManager: FrameManager | null = null;

export function getFrameManager(): FrameManager {
  if (typeof window === "undefined") {
    return null as any;
  }
  if (!frameManager) {
    frameManager = new FrameManager(60);
  }
  return frameManager;
}

export type { FrameCallback };
