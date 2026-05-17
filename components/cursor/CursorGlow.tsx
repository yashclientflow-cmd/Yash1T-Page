"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { getFrameManager } from "@/lib/frameManager";
import { getEventThrottler } from "@/lib/eventThrottler";

export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, rx: 0, ry: 0 });
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const frameUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (coarse) return;

    const throttler = getEventThrottler();
    const frameManager = getFrameManager();

    // Single throttled mousemove listener
    unsubscribeRef.current = throttler.on((e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;

      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top = `${e.clientY}px`;
      }
    });

    // Smooth cursor ring movement in frame loop
    frameUnsubscribeRef.current = frameManager.subscribe("cursor", () => {
      pos.current.rx += (pos.current.x - pos.current.rx) * 0.14;
      pos.current.ry += (pos.current.y - pos.current.ry) * 0.14;

      if (ringRef.current) {
        ringRef.current.style.left = `${pos.current.rx}px`;
        ringRef.current.style.top = `${pos.current.ry}px`;
      }
    }, 5);

    const cleanupListeners: Array<() => void> = [];
    const links = document.querySelectorAll("a, button");

    links.forEach((el) => {
      const onEnter = () => {
        gsap.to(ringRef.current, { scale: 1.8, duration: 0.25, ease: "power2.out" });
      };
      const onLeave = () => {
        gsap.to(ringRef.current, { scale: 1, duration: 0.25, ease: "power2.out" });
      };
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      cleanupListeners.push(() => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (frameUnsubscribeRef.current) frameUnsubscribeRef.current();
      cleanupListeners.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <>
      <div className="cursor-glow" ref={glowRef} aria-hidden="true" />
      <div className="cursor" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  );
}
