"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";

type Props = { onComplete: () => void };

export default function BootSequence({ onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const leftDoorRef = useRef<HTMLDivElement>(null);
  const rightDoorRef = useRef<HTMLDivElement>(null);
  const glitchRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onComplete();
      setDone(true);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          setDone(true);
          onComplete();
        },
      });

      gsap.set([leftDoorRef.current, rightDoorRef.current], { xPercent: 0 });
      gsap.set(scanRef.current, { scaleX: 0, opacity: 0 });
      gsap.set(glitchRef.current, { opacity: 0 });

      tl.fromTo(dotRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25 }, 0)
        .fromTo(
          textRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2 },
          0.15
        )
        .to(
          {},
          {
            duration: 0.85,
            onUpdate: function () {
              const p = Math.round(this.progress() * 100);
              if (pctRef.current) pctRef.current.textContent = `${p}%`;
            },
          },
          0.2
        )
        .to(scanRef.current, { scaleX: 1, opacity: 1, duration: 0.35, ease: "power2.out" }, 1.05)
        .to(scanRef.current, { opacity: 0, duration: 0.15 }, 1.4)
        .to(glitchRef.current, { opacity: 0.35, duration: 0.05, repeat: 3, yoyo: true }, 1.35)
        .to(
          leftDoorRef.current,
          { xPercent: -102, duration: 0.55, ease: "power4.inOut" },
          1.45
        )
        .to(
          rightDoorRef.current,
          { xPercent: 102, duration: 0.55, ease: "power4.inOut" },
          1.45
        )
        .to(rootRef.current, { opacity: 0, duration: 0.2, pointerEvents: "none" }, 1.95);
    }, rootRef);

    return () => ctx.revert();
  }, [onComplete]);

  if (done) return null;

  return (
    <div className="boot" ref={rootRef} aria-hidden={done}>
      <div className="boot__doors">
        <div className="boot__door boot__door--left" ref={leftDoorRef} />
        <div className="boot__door boot__door--right" ref={rightDoorRef} />
      </div>
      <div className="boot__center">
        <div className="boot__dot" ref={dotRef} />
        <p className="boot__text" ref={textRef}>
          INITIALIZING YASH OS<span className="boot__cursor">_</span>
        </p>
        <p className="boot__pct">
          <span ref={pctRef}>0%</span>
        </p>
      </div>
      <div className="boot__scan" ref={scanRef} />
      <div className="boot__glitch" ref={glitchRef} />
    </div>
  );
}
