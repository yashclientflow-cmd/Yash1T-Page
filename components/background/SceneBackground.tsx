"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "@/lib/gsap";
import { ScrollTrigger } from "@/lib/gsap";
import ParticleCanvas from "./ParticleCanvas";
import ThreeDepth from "./ThreeDepth";
import { useMouseParallax } from "@/hooks/useMouseParallax";

type Props = { booted: boolean };

export default function SceneBackground({ booted }: Props) {
  const deepRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const faceRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [visualsEnabled, setVisualsEnabled] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 900px)").matches;
    setVisualsEnabled(!isTouch);
  }, []);

  const parallaxTargets = useMemo(
    () => ({ deep: deepRef, mid: mapRef, front: heroRef, face: faceRef }),
    []
  );

  useMouseParallax(parallaxTargets, booted && visualsEnabled);

  useEffect(() => {
    if (!booted || !faceRef.current) return;

    gsap.fromTo(
      faceRef.current,
      { scale: 1.2, opacity: 0, "--face-blur": "20px" },
      {
        scale: 1,
        opacity: 1,
        "--face-blur": "0px",
        duration: 1.35,
        delay: 0.08,
        ease: "power2.out",
      }
    );
  }, [booted]);

  useEffect(() => {
    if (!booted) return;

    const ctx = gsap.context(() => {
      // Reduced rotation speed and duration for better perf
      gsap.to(raysRef.current, {
        rotate: 6,
        duration: 22,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Reduced movement distance
      gsap.to(codeRef.current, {
        y: -60,
        duration: 28,
        repeat: -1,
        ease: "none",
      });

      // Scroll-driven animations with optimized blur
      ScrollTrigger.create({
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(heroRef.current, {
            scale: 1 - p * 0.1,
            opacity: 1 - p * 0.8,
            "--bg-blur": `${p * 8}px`,
          });
          gsap.set(mapRef.current, {
            rotate: p * 4,
          });
          gsap.set(cardsRef.current, {
            y: -p * 50,
          });
        },
      });

      ScrollTrigger.create({
        trigger: "#goals",
        start: "top 85%",
        end: "center center",
        scrub: 0.5,
        onEnter: () => dashboardRef.current?.classList.add("is-active"),
        onLeaveBack: () => dashboardRef.current?.classList.remove("is-active"),
        onUpdate: (self) => {
          const p = self.progress;
          gsap.set(dashboardRef.current, {
            scale: 0.85 + p * 0.15,
            opacity: p,
            "--bg-blur": `${(1 - p) * 10}px`,
          });
        },
      });
    });

    return () => ctx.revert();
  }, [booted]);

  useEffect(() => {
    if (!booted || !faceRef.current) return;

    const sweep = gsap.timeline({ repeat: -1, repeatDelay: 10 });
    sweep
      .set(faceRef.current, { "--sweep-x": "-120%" })
      .to(faceRef.current, { "--sweep-x": "220%", duration: 1.6, ease: "power2.inOut" });

    return () => {
      sweep.kill();
    };
  }, [booted]);

  return (
    <div className="bg-stack" aria-hidden="true">
      <div className="layer layer--gradient" />
      <div ref={deepRef} className="layer layer--deep">
        <ThreeDepth />
        <ParticleCanvas />
      </div>
      <div ref={mapRef} className="layer layer--map">
        <svg viewBox="0 0 1200 600" className="world-map" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 48 }).map((_, i) => (
            <circle
              key={i}
              cx={80 + (i % 12) * 90 + (Math.sin(i) * 20)}
              cy={100 + Math.floor(i / 12) * 110}
              r="2"
              className="map-dot"
            />
          ))}
        </svg>
      </div>
      <div ref={raysRef} className="layer layer--rays" />
      <div ref={cardsRef} className="layer layer--glass-cards">
        <span className="glass-chip" style={{ top: "18%", right: "12%" }} />
        <span className="glass-chip" style={{ top: "42%", right: "8%" }} />
        <span className="glass-chip" style={{ bottom: "22%", right: "18%" }} />
      </div>
      <div ref={codeRef} className="layer layer--code">
        <pre>{`const yashOS = {\n  build: true,\n  ship: daily,\n  leverage: "compound"\n};`}</pre>
      </div>
      <div ref={linesRef} className="layer layer--lines" />
      <div className="layer layer--noise" />

      <div className="bg-layer bg-layer--hero" ref={heroRef} id="bgHero">
        <div className="bg-layer__inner" id="bgHeroInner">
          <div ref={faceRef} className="hero-face-wrap">
            <Image
              src="/assets/hero-bg.png"
              alt=""
              fill
              priority
              quality={70}
              className="bg-layer__img hero-face-img"
              sizes="100vw"
            />
            <span className="face-sweep" aria-hidden="true" />
            <span className="face-light-beam" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="bg-overlay" id="bgOverlay" />

      <div className="bg-layer bg-layer--dashboard" ref={dashboardRef} id="bgDashboard">
        <div className="bg-layer__inner" id="bgDashboardInner">
          <Image src="/assets/img2.png" alt="" fill quality={70} className="bg-layer__img" sizes="100vw" />
        </div>
      </div>
    </div>
  );
}
