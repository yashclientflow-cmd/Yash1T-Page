"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "@/lib/gsap";
import StatCard from "./StatCard";

const DESCRIPTION =
  "Building AI products, trading global markets, and documenting everything — from a Tier-3 city, with zero capital, before he can vote.";

const PROOF = [
  { strong: "₹1L/month", text: " across 3 independent revenue streams" },
  { strong: "3 SaaS products", text: " live and generating users" },
  { strong: "$3,592", text: " single trading session. Real MetaTrader account." },
];

const STATS = [
  { value: "17", label: "Age" },
  { value: "₹1L", label: "Monthly Rev" },
  { value: "3", label: "Live SaaS" },
  { value: "62", label: "Videos shipped" },
];

type Props = { booted: boolean };

export default function HeroSection({ booted }: Props) {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!booted || !contentRef.current) return;

    gsap.fromTo(
      contentRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, delay: 0.1 }
    );
  }, [booted]);

  const words = DESCRIPTION.split(" ");

  return (
    <section className="hero content-section" id="hero" ref={heroRef}>
      <div className="hero-bg-text">YT</div>
      <div className="container" ref={contentRef}>
        <div className="hero-inner">
          <div className="hero-copy">
            <motion.div
              className="hero-tag"
              initial={{ opacity: 0, x: -40 }}
              animate={booted ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.95, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              Hapur, India — Age 17
            </motion.div>

            <h1 className="hero-name">
              <span className="hero-name__yash">
                {"Yash".split("").map((char, i) => (
                  <motion.span
                    key={`y-${i}`}
                    className="hero-char"
                    initial={{ opacity: 0, y: 20 }}
                    animate={booted ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1.05 + i * 0.06, duration: 0.4 }}
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
              <br />
              <motion.span
                className="accent hero-name__tyagi"
                initial={{ opacity: 0, y: 80 }}
                animate={booted ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: 1.35,
                  duration: 0.75,
                  type: "spring",
                  stiffness: 120,
                  damping: 14,
                }}
              >
                Tyagi
              </motion.span>
            </h1>

            <p className="hero-line">
              {words.map((word, i) => (
                <motion.span
                  key={`w-${i}`}
                  className="hero-word"
                  initial={{ opacity: 0, y: 10 }}
                  animate={booted ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.5 + i * 0.035, duration: 0.35 }}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </p>

            <div className="hero-proof">
              {PROOF.map((item, i) => (
                <motion.div
                  key={item.strong}
                  className="proof-item"
                  initial={{ opacity: 0, x: -16 }}
                  animate={booted ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 1.85 + i * 0.1, duration: 0.45 }}
                >
                  <strong>{item.strong}</strong>
                  {item.text}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="hero-stats">
            {STATS.map((s, i) => (
              <StatCard key={s.label} value={s.value} label={s.label} index={i} booted={booted} />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="scroll-hint"
        id="scrollHint"
        initial={{ opacity: 0 }}
        animate={booted ? { opacity: 0.7 } : {}}
        transition={{ delay: 2.2, duration: 0.5 }}
      >
        <span>Scroll</span>
        <div className="scroll-hint__line" />
      </motion.div>
    </section>
  );
}
