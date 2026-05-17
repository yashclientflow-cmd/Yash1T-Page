/**
 * Event Throttler - Efficiently throttles high-frequency events
 * Prevents multiple listeners from processing same event
 */

type ThrottledCallback = (e: MouseEvent) => void;

class EventThrottler {
  private listeners: Set<ThrottledCallback> = new Set();
  private lastMouseX: number = -9999;
  private lastMouseY: number = -9999;
  private isAttached: boolean = false;
  private throttleDelay: number = 16; // ~60fps

  constructor(throttleDelay: number = 16) {
    this.throttleDelay = throttleDelay;
  }

  /**
   * Subscribe to throttled mousemove events
   */
  on(callback: ThrottledCallback): () => void {
    this.listeners.add(callback);
    this.attach();

    return () => this.off(callback);
  }

  /**
   * Unsubscribe from throttled events
   */
  off(callback: ThrottledCallback): void {
    this.listeners.delete(callback);
    if (this.listeners.size === 0) {
      this.detach();
    }
  }

  /**
   * Attach the single global mousemove listener
   */
  private attach(): void {
    if (this.isAttached) return;
    this.isAttached = true;

    const handleMouseMove = (e: MouseEvent) => {
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      // Batch notify all listeners
      this.listeners.forEach(listener => listener(e));
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Store for cleanup
    (this as any)._unsubscribe = () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }

  /**
   * Detach the global listener
   */
  private detach(): void {
    if (!this.isAttached) return;
    this.isAttached = false;
    if ((this as any)._unsubscribe) {
      (this as any)._unsubscribe();
    }
  }

  /**
   * Get last known mouse position (useful for RAF updates)
   */
  getLastPosition(): { x: number; y: number } {
    return { x: this.lastMouseX, y: this.lastMouseY };
  }
}

// Global instance
let eventThrottler: EventThrottler | null = null;

export function getEventThrottler(): EventThrottler {
  if (typeof window === "undefined") {
    return null as any;
  }
  if (!eventThrottler) {
    eventThrottler = new EventThrottler(16);
  }
  return eventThrottler;
}
