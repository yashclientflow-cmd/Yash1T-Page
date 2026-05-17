"use client";

import { useEffect, useRef } from "react";
import { getFrameManager } from "@/lib/frameManager";
import { getEventThrottler } from "@/lib/eventThrottler";

type ParallaxTargets = {
  deep?: React.RefObject<HTMLElement | null>;
  mid?: React.RefObject<HTMLElement | null>;
  front?: React.RefObject<HTMLElement | null>;
  face?: React.RefObject<HTMLElement | null>;
  hero?: React.RefObject<HTMLElement | null>;
};

export function useMouseParallax(targets: ParallaxTargets, enabled = true) {
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const frameUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const isDisabled = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches;
    if (isDisabled) return;

    const throttler = getEventThrottler();
    const frameManager = getFrameManager();

    // Single mousemove listener through throttler
    unsubscribeRef.current = throttler.on((e: MouseEvent) => {
      pos.current.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pos.current.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Update transforms in unified frame loop
    frameUnsubscribeRef.current = frameManager.subscribe("parallax", () => {
      const p = pos.current;
      p.x += (p.tx - p.x) * 0.06;
      p.y += (p.ty - p.y) * 0.06;

      const { x, y } = p;

      if (targets.deep?.current) {
        targets.deep.current.style.transform = `translate3d(${x * -4}px, ${y * -4}px, 0)`;
      }
      if (targets.mid?.current) {
        targets.mid.current.style.transform = `translate3d(${x * 3}px, ${y * 3}px, 0)`;
      }
      if (targets.front?.current) {
        targets.front.current.style.transform = `translate3d(${x * 5}px, ${y * 5}px, 0)`;
      }
      if (targets.face?.current) {
        targets.face.current.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 0)`;
      }
      if (targets.hero?.current) {
        targets.hero.current.style.transform = `translate3d(${x * 3}px, ${y * 3}px, 0)`;
      }
    }, 10);

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (frameUnsubscribeRef.current) frameUnsubscribeRef.current();
    };
  }, [enabled, targets]);
}
