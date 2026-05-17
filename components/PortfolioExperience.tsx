"use client";

import { useState, useCallback } from "react";
import BootSequence from "@/components/boot/BootSequence";
import SceneBackground from "@/components/background/SceneBackground";
import CursorGlow from "@/components/cursor/CursorGlow";
import Nav from "@/components/layout/Nav";
import HeroSection from "@/components/hero/HeroSection";
import PageSections from "@/components/sections/PageSections";
import ContactDock from "@/components/contact/ContactDock";
import { useLenis } from "@/hooks/useLenis";

export default function PortfolioExperience() {
  const [booted, setBooted] = useState(false);
  const onBootComplete = useCallback(() => setBooted(true), []);

  useLenis(booted);

  return (
    <>
      <BootSequence onComplete={onBootComplete} />
      <SceneBackground booted={booted} />
      <CursorGlow />
      <ContactDock />
      <Nav booted={booted} />

      <main className={`site-main ${booted ? "site-main--live" : ""}`}>
        <HeroSection booted={booted} />
        <PageSections />
      </main>

      <footer className="site-footer">
        <span>
          Yash Tyagi — Hapur, India — <span className="footer-accent">Age 17</span>
        </span>
        <span>
          Building in public · 2025–<span className="footer-accent">∞</span>
        </span>
      </footer>
    </>
  );
}
