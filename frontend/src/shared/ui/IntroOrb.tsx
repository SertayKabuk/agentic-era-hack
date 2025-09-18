import React, { useEffect, useState } from "react";
import "./intro-orb.scss";

type IntroOrbProps = {
  text?: string;
  showMs?: number; // how long it stays visible total
  appearMs?: number; // zoom-in duration
  colors?: [string, string, string]; // gradient colors
  onPick?: () => void; // click handler to reveal content
  dismissOnPick?: boolean; // hide orb after click
  autoHide?: boolean; // if false, do not auto-dismiss
};

export default function IntroOrb({
  text = "seçiminiz",
  showMs = 2400,
  appearMs = 900,
  colors,
  onPick,
  dismissOnPick = true,
  autoHide = true,
}: IntroOrbProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoHide) return;
    const t = window.setTimeout(() => setVisible(false), showMs);
    return () => window.clearTimeout(t);
  }, [showMs, autoHide]);

  if (!visible) return null;

  const fadeDelayMs = Math.max(appearMs, showMs - 800); // start fade so it ends at showMs

  return (
    <div className="intro-orb-overlay" aria-hidden>
      <div
        className={`intro-orb ${!autoHide ? 'no-fade' : ''}`}
        style={{
          ['--appearMs' as any]: `${appearMs}ms`,
          ['--fadeDelayMs' as any]: `${fadeDelayMs}ms`,
          ...(colors
            ? {
                ['--orb-c1' as any]: colors[0],
                ['--orb-c2' as any]: colors[1],
                ['--orb-c3' as any]: colors[2],
              }
            : {}),
        }}
        role="button"
        tabIndex={0}
        onClick={() => {
          onPick?.();
          if (dismissOnPick) setVisible(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick?.();
            if (dismissOnPick) setVisible(false);
          }
        }}
      >
        <svg className="orb-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="orbGrad" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="var(--orb-c1, #ffb867)" />
              <stop offset="55%" stopColor="var(--orb-c2, #ff7a59)" />
              <stop offset="100%" stopColor="var(--orb-c3, #1f94ff)" />
            </radialGradient>
            <filter id="edgeWobble" x="-50%" y="-50%" width="200%" height="200%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3">
                <animate attributeName="baseFrequency" values="0.012;0.018;0.012" dur="5s" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" scale="6" />
            </filter>
          </defs>
          <g filter="url(#edgeWobble)">
            <circle cx="100" cy="100" r="78" fill="url(#orbGrad)" />
          </g>
          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="orb-text">
            {text}
          </text>
        </svg>
      </div>
    </div>
  );
}
