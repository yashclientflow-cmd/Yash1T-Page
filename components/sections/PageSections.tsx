"use client";

import { useEffect, useRef, useState } from "react";

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = elRef.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={elRef} className={`reveal ${visible ? "visible" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}

export default function PageSections() {
  const [phase, setPhase] = useState("1");

  return (
    <>
      <section className="proof-section content-section" id="proof">
        <div className="container">
          <div className="section-label reveal">Proof of Execution</div>
          <Reveal className="timeline">
            <div className="timeline-item">
              <div className="timeline-period">Start</div>
              <div className="timeline-num">₹0</div>
              <div className="timeline-desc">Zero capital. Zero network. Hapur, UP. Age 16.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Month 3–6</div>
              <div className="timeline-num">3x</div>
              <div className="timeline-desc">First freelance clients. Resume pipeline. WhatsApp → form → delivery in 24hrs.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Dec 2025</div>
              <div className="timeline-num">2 →</div>
              <div className="timeline-desc">KillarityEngine + TraderOS launched on Product Hunt within 10 days.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-period">Now</div>
              <div className="timeline-num">₹1L</div>
              <div className="timeline-desc">Monthly. Three streams. Still 17. Compounding.</div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="goals-section content-section" id="goals">
        <div className="container">
          <div className="section-label reveal">What I Do / Goals</div>
          <Reveal className="goals-inner">
            <div>
              <h2 className="goals-headline">
                Tools that remove<br />
                <em>friction</em> from<br />
                the decision loop.
              </h2>
            </div>
            <div className="goals-body">
              <p>Every product I&apos;ve built solves a problem I hit personally — founders stuck in validation fog, traders journaling in spreadsheets, freshers sending resumes to the void.</p>
              <p>I build with AI as the core — not as a feature. The goal is always the same: make the user more decisive, faster, with less noise.</p>
              <p>Direction: AI tooling → SaaS infrastructure → eventually, the layer that powers other builders.</p>
            </div>
          </Reveal>
          <Reveal className="goals-metrics">
            <div className="metric-card"><span className="metric-val">125K+</span><span className="metric-lbl">Active users target</span></div>
            <div className="metric-card"><span className="metric-val">$1T</span><span className="metric-lbl">North-star trajectory</span></div>
            <div className="metric-card"><span className="metric-val">Build → Own</span><span className="metric-lbl">Compound leverage daily</span></div>
          </Reveal>
        </div>
      </section>

      <section className="products-section content-section" id="products">
        <div className="container">
          <div className="section-label reveal">Products</div>
          <Reveal className="products-grid">
            <article className="product-card">
              <div className="product-index">01 / KillarityEngine</div>
              <div className="product-status">Live — v0.2 in build</div>
              <h3 className="product-name">KillarityEngine</h3>
              <p className="product-problem">Founders drown in uncertainty. KillarityEngine generates structured decision reports — instantly.</p>
              <div className="product-outcome">
                <div className="outcome-row"><span className="outcome-val">10.3K</span><span className="outcome-lbl">users / 7 days</span></div>
                <div className="outcome-row"><span className="outcome-val">$1,207</span><span className="outcome-lbl">revenue / 7 days</span></div>
              </div>
              <a className="product-link" href="https://killarity-engine-v0-1.vercel.app/" target="_blank" rel="noopener noreferrer">View Product</a>
            </article>
            <article className="product-card">
              <div className="product-index">02 / TraderOS</div>
              <div className="product-status">Live — active build</div>
              <h3 className="product-name">TraderOS</h3>
              <p className="product-problem">Traders lose on repeating mistakes. TraderOS learns from your data and feeds it back as edge.</p>
              <div className="product-outcome">
                <div className="outcome-row"><span className="outcome-val">85%+</span><span className="outcome-lbl">AI signal win rate</span></div>
                <div className="outcome-row"><span className="outcome-val">$3,592</span><span className="outcome-lbl">single session proof</span></div>
              </div>
              <a className="product-link" href="https://trade-os-six.vercel.app/" target="_blank" rel="noopener noreferrer">View Product</a>
            </article>
            <article className="product-card">
              <div className="product-index">03 / ResumeAI</div>
              <div className="product-status">Live — growing</div>
              <h3 className="product-name">ResumeAI</h3>
              <p className="product-problem">Freshers fail ATS filters. ResumeAI builds optimized resumes — fast.</p>
              <div className="product-outcome">
                <div className="outcome-row"><span className="outcome-val">423</span><span className="outcome-lbl">users / 7 days</span></div>
                <div className="outcome-row"><span className="outcome-val">₹7,960</span><span className="outcome-lbl">platform revenue / 7 days</span></div>
              </div>
              <a className="product-link" href="https://ai-resume-pi-sand.vercel.app/" target="_blank" rel="noopener noreferrer">View Product</a>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="edge-section content-section" id="edge">
        <div className="container">
          <div className="section-label reveal">Why This Compounds</div>
          <Reveal className="edge-grid">
            {[
              ["01", "Trading Funds the Lab", "Active Forex + crypto generates cash without dilution."],
              ["02", "Tier-3 Origin", "No safety net in Hapur. Every rupee earned is proof."],
              ["03", "AI as an 80% Bridge", "5-person team leverage as a solo 17-year-old."],
              ["04", "US PMF Signal", "45% US traffic. $1,207 in 7 days. Built from Hapur."],
              ["05", "FounderOS", "Scored decision engine with kill triggers."],
              ["06", "The Story Travels", "Distribution is a moat."],
            ].map(([n, t, d]) => (
              <div key={n} className="edge-item">
                <div className="edge-number">{n}</div>
                <h3 className="edge-title">{t}</h3>
                <p className="edge-desc">{d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="traj-section content-section" id="trajectory">
        <div className="container">
          <div className="section-label reveal">Trajectory</div>
          <Reveal>
            <p className="traj-statement">
              I&apos;m not building projects.
              <br />
              I&apos;m building <em>leverage layers.</em>
            </p>
          </Reveal>
          <Reveal className="traj-layout">
            <div className="traj-spine">
              <div className="spine-line" />
              {[
                ["1", "Phase 1", "Now → 18"],
                ["2", "Phase 2", "18 → 21"],
                ["3", "Phase 3", "21 → 25"],
                ["4", "Phase 4", "25 → 31"],
                ["end", "End State", "—"],
              ].map(([id, label, period]) => (
                <button
                  key={id}
                  type="button"
                  className={`phase-node ${phase === id ? "active" : ""} ${id === "end" ? "terminal" : ""}`}
                  onClick={() => setPhase(id)}
                >
                  <span className={`node-dot ${id === "end" ? "end-dot" : ""}`} />
                  <span className="node-label">{label}</span>
                  <span className="node-period">{period}</span>
                </button>
              ))}
            </div>
            <div className="traj-panels">
              {phase === "1" && (
                <div className="traj-panel active">
                  <div className="panel-tag">Phase 1 · Now → 18</div>
                  <div className="panel-headline">Ship fast. Prove revenue. Build distribution.</div>
                  <ul className="panel-points">
                    <li>Build and ship AI tools at high velocity</li>
                    <li>₹1L+/month baseline — already live</li>
                    <li>50+ shipped products by 18</li>
                  </ul>
                </div>
              )}
              {phase === "2" && (
                <div className="traj-panel active">
                  <div className="panel-tag">Phase 2 · 18 → 21</div>
                  <div className="panel-headline">One or two products. Serious scale.</div>
                  <ul className="panel-points">
                    <li>Narrow to 1–2 high-retention SaaS</li>
                    <li>₹10L–₹1Cr/month revenue range</li>
                  </ul>
                </div>
              )}
              {phase === "3" && (
                <div className="traj-panel active">
                  <div className="panel-tag">Phase 3 · 21 → 25</div>
                  <div className="panel-headline">From tools to platforms.</div>
                  <ul className="panel-points">
                    <li>Infrastructure-level products</li>
                    <li>APIs other builders depend on</li>
                  </ul>
                </div>
              )}
              {phase === "4" && (
                <div className="traj-panel active">
                  <div className="panel-tag">Phase 4 · 25 → 31</div>
                  <div className="panel-headline">Integrated ecosystem. Global positioning.</div>
                  <ul className="panel-points">
                    <li>Vertically integrated stack</li>
                    <li>Category-dominant globally</li>
                  </ul>
                </div>
              )}
              {phase === "end" && (
                <div className="traj-panel active">
                  <div className="panel-tag">End State</div>
                  <div className="panel-headline end-headline">A vertically integrated AI ecosystem at scale.</div>
                  <p className="panel-endnote">Not a startup. Not a portfolio. A system.</p>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="signal-section content-section" id="signal">
        <div className="container">
          <Reveal className="signal-inner">
            <div>
              <h2 className="signal-headline">
                If you&apos;re building
                <br />
                at the <span className="accent">edge</span> —<br />
                we should talk.
              </h2>
              <p className="signal-sub">Founders, builders, operators who move before the path is clear.</p>
            </div>
            <div className="signal-links">
              <a className="signal-link" href="https://x.com/yash0to1" target="_blank" rel="noopener noreferrer">X / @yash0to1 <span className="arrow">→</span></a>
              <a className="signal-link" href="https://www.linkedin.com/in/yash-tyagi-089a49345" target="_blank" rel="noopener noreferrer">LinkedIn <span className="arrow">→</span></a>
              <a className="signal-link" href="https://youtube.com/@zerotosaas" target="_blank" rel="noopener noreferrer">YouTube <span className="arrow">→</span></a>
              <a className="signal-link" href="https://www.producthunt.com/@saas_withyash" target="_blank" rel="noopener noreferrer">Product Hunt <span className="arrow">→</span></a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
