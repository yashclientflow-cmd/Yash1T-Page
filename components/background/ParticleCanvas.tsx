"use client";

import { useEffect, useRef, useState } from "react";
import { getFrameManager } from "@/lib/frameManager";
import { getEventThrottler } from "@/lib/eventThrottler";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
};

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isDisabled = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)").matches;
    setEnabled(!isDisabled);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];
    let unsubscribeThrottler: (() => void) | null = null;
    let unsubscribeFrame: (() => void) | null = null;

    // Detect device capability for particle optimization
    const isLowEnd = window.matchMedia("(max-width: 768px) or (max-height: 600px)").matches;
    const isMidRange = window.matchMedia("(max-width: 1024px)").matches;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      
      // Adaptive particle count based on device and resolution
      let count = Math.min(90, Math.max(30, Math.floor((w * h) / 28000)));
      
      // Reduce on lower-end devices
      if (isLowEnd) count = Math.max(15, Math.floor(count * 0.4));
      else if (isMidRange) count = Math.max(20, Math.floor(count * 0.6));
      
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.2 + 0.3,
        a: Math.random() * 0.45 + 0.15,
      }));
    };

    const throttler = getEventThrottler();
    const frameManager = getFrameManager();

    // Single throttled mousemove listener
    unsubscribeThrottler = throttler.on((e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    });

    // Particle rendering in frame loop
    unsubscribeFrame = frameManager.subscribe("particles", () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        const dx = mouse.current.x - p.x;
        const dy = mouse.current.y - p.y;
        const dist = Math.hypot(dx, dy);
        
        // Mouse repulsion - slightly reduced for better performance
        if (dist < 100) {
          p.x -= dx * 0.01;
          p.y -= dy * 0.01;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrapping
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.fillStyle = `rgba(200, 255, 0, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }, 1);

    const handleResize = () => {
      resize();
    };

    resize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      if (unsubscribeThrottler) unsubscribeThrottler();
      if (unsubscribeFrame) unsubscribeFrame();
      window.removeEventListener("resize", handleResize);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} className="layer layer--particles" aria-hidden="true" />;
}
