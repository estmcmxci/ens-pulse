"use client";

import { useState, useCallback, useRef, useEffect, Fragment } from "react";

const TICKER_ITEMS = [
  { label: "Prices", color: "#22c55e" },
  { label: "Proposals", color: "#5298ff" },
  { label: "Delegates", color: "#a099ff" },
  { label: "Treasury", color: "#e8a946" },
  { label: "Security", color: "#ef4444" },
  { label: "Metrics", color: "#3b82f6" },
  { label: "Calendar", color: "#f59e0b" },
  { label: "Forum", color: "#8b5cf6" },
  { label: "Signals", color: "#06b6d4" },
];

/**
 * Full-viewport hero overlay — observatory command interface.
 * Radial clip-path reveal from CTA click point.
 * Session-gated: shows once per browser session.
 */
export default function HeroOverlay() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("ens-pulse-hero-seen") === "1") return;
    } catch {
      return;
    }

    setVisible(true);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true));
    });
  }, []);

  const handleReveal = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!overlayRef.current || revealing) return;

      overlayRef.current.style.setProperty("--reveal-x", `${e.clientX}px`);
      overlayRef.current.style.setProperty("--reveal-y", `${e.clientY}px`);

      setRevealing(true);

      try {
        sessionStorage.setItem("ens-pulse-hero-seen", "1");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ens-pulse-hero-dismissed"));
        }
      } catch {
        /* noop */
      }

      setTimeout(() => {
        overlayRef.current?.classList.add("hero-overlay--collapsing");
      }, 350);

      setTimeout(() => setVisible(false), 1150);
    },
    [revealing]
  );

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className={`hero-overlay${mounted ? " hero-overlay--mounted" : ""}${revealing ? " hero-overlay--revealing" : ""}`}
      role="dialog"
      aria-label="Welcome to ENS Pulse"
    >
      {/* Background layers */}
      <div className="hero-overlay__bg" aria-hidden="true" />
      <div className="hero-overlay__orb" aria-hidden="true">
        {/* Tick marks at cardinal + diagonal positions */}
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={`hero-overlay__orb-tick hero-overlay__orb-tick--${i + 1}`} />
        ))}
      </div>
      <div className="hero-overlay__topo" aria-hidden="true" />
      <div className="hero-overlay__grain" aria-hidden="true" />

      {/* Live indicator */}
      <div className="hero-overlay__live" aria-hidden="true">
        <span className="hero-overlay__live-dot" />
        <span>Live</span>
      </div>

      {/* Logo mark — positioned independently on right side */}
      <div className="hero-overlay__mark" aria-hidden="true">
        <div className="hero-overlay__pulse-ring" />
        <div className="hero-overlay__pulse-ring hero-overlay__pulse-ring--2" />
        <div className="hero-overlay__pulse-ring hero-overlay__pulse-ring--3" />
        <div className="hero-overlay__icon">
          <img src="/ens-icon.svg" alt="" width={48} height={48} draggable={false} />
        </div>
      </div>

      {/* Content — left-aligned text stack */}
      <div className="hero-overlay__content">
        {/* Title */}
        <h1 className="hero-overlay__title">PULSE</h1>

        {/* Subtitle */}
        <span className="hero-overlay__subtitle">DAO Monitor</span>

        {/* Divider */}
        <div className="hero-overlay__line" aria-hidden="true" />

        {/* Signal categories — scrolling ticker with colored pips */}
        <div
          className="hero-overlay__signals"
          aria-label={TICKER_ITEMS.map((i) => i.label).join(", ")}
        >
          <div className="hero-overlay__ticker">
            {[0, 1].map((copy) => (
              <div className="hero-overlay__ticker-track" key={copy} aria-hidden={copy === 1}>
                {TICKER_ITEMS.map((item) => (
                  <Fragment key={item.label}>
                    <span className="hero-overlay__ticker-item">
                      <span
                        className="hero-overlay__ticker-dot"
                        style={{ background: item.color }}
                      />
                      {item.label}
                    </span>
                    <span className="hero-overlay__ticker-sep" aria-hidden="true">
                      ·
                    </span>
                  </Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button className="hero-overlay__cta" onClick={handleReveal} type="button">
          Enter Dashboard
        </button>
      </div>

      {/* Status readout — bottom-right data cluster */}
      <div className="hero-overlay__readout" aria-hidden="true">
        <div className="hero-overlay__readout-row">
          <span className="hero-overlay__readout-label">Network</span>
          <span className="hero-overlay__readout-value">Ethereum Mainnet</span>
        </div>
        <div className="hero-overlay__readout-row">
          <span className="hero-overlay__readout-label">Status</span>
          <span className="hero-overlay__readout-value hero-overlay__readout-value--active">Monitoring</span>
        </div>
      </div>

    </div>
  );
}
