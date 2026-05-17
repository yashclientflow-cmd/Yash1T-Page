/**
 * Performance Monitoring & Device Detection
 * Helps identify low-end devices and adjust rendering quality
 */

interface PerformanceInfo {
  cores: number;
  memory: number;
  deviceType: "desktop" | "tablet" | "mobile";
  gpu: "powerful" | "moderate" | "weak";
  connectionSpeed: "4g" | "3g" | "slow";
  isLowEnd: boolean;
  isMidRange: boolean;
}

class PerformanceMonitor {
  private fps: number = 60;
  private fpsHistory: number[] = [];
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private isMonitoring: boolean = false;

  /**
   * Get estimated device performance
   */
  getDevicePerformance(): PerformanceInfo {
    const nav = navigator as any;

    // CPU cores
    const cores = nav.hardwareConcurrency || 2;

    // Device memory (in GB)
    const memory = nav.deviceMemory || 4;

    // Device type detection
    const deviceType = this.detectDeviceType();

    // GPU capability estimation
    const gpu = this.estimateGPU();

    // Network type
    const connectionSpeed = this.getConnectionSpeed();

    // Low-end detection
    const isLowEnd = cores <= 2 || memory <= 2 || deviceType === "mobile";
    const isMidRange = cores <= 4 && memory <= 4;

    return {
      cores,
      memory,
      deviceType,
      gpu,
      connectionSpeed,
      isLowEnd,
      isMidRange,
    };
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): "desktop" | "tablet" | "mobile" {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
    if (/mobile|phone|android|iphone|windows phone/i.test(ua)) return "mobile";
    return "desktop";
  }

  /**
   * Estimate GPU capability
   */
  private estimateGPU(): "powerful" | "moderate" | "weak" {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl");
      if (!gl) return "weak";

      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (!debugInfo) return "moderate";

      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      // Check for integrated graphics
      if (
        renderer &&
        (renderer.includes("Intel") ||
          renderer.includes("UHD") ||
          renderer.includes("HD Graphics"))
      ) {
        return "moderate";
      }

      // Desktop dedicated graphics or mobile flagship
      if (renderer && (renderer.includes("NVIDIA") || renderer.includes("AMD"))) {
        return "powerful";
      }

      return "moderate";
    } catch (e) {
      return "moderate";
    }
  }

  /**
   * Get connection speed
   */
  private getConnectionSpeed(): "4g" | "3g" | "slow" {
    const nav = navigator as any;
    if (!nav.connection) return "4g";

    const type = nav.connection.effectiveType;
    if (type === "4g") return "4g";
    if (type === "3g") return "3g";
    return "slow";
  }

  /**
   * Start FPS monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.fpsHistory = [];
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.measureFPS();
  }

  /**
   * Measure FPS
   */
  private measureFPS = (): void => {
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.fps = this.frameCount;
      this.fpsHistory.push(this.fps);

      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift();
      }

      this.frameCount = 0;
      this.lastTime = now;
    }

    this.frameCount++;

    if (this.isMonitoring) {
      requestAnimationFrame(this.measureFPS);
    }
  };

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return Math.round(
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    );
  }

  /**
   * Check if performance is good
   */
  isPerformanceGood(): boolean {
    return this.getAverageFPS() >= 50;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }
}

// Global instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (typeof window === "undefined") {
    return null as any;
  }
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export type { PerformanceInfo };
