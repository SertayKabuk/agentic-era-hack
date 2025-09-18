import React from "react";
import "./dotted-chip.scss";

export type DottedChipProps = {
  label: string;
  size?: number; // px
  colors?: [string, string, string];
  onClick?: () => void;
  className?: string;
  motionScale?: number; // edge wobble intensity
  icon?: string; // material icon adı
};

export default function DottedChip({
  label,
  size = 120,
  colors,
  onClick,
  className = "",
  motionScale = 12,
  icon,
}: DottedChipProps) {
  const s = `${size}px`;
  return (
    <button
      className={["dotted-chip", className].filter(Boolean).join(" ")}
      style={{
        width: s,
        height: s,
        // @ts-ignore custom props
        "--chip-c1": colors?.[0] ?? "#ffd089",
        // @ts-ignore
        "--chip-c2": colors?.[1] ?? "#ff7a59",
        // @ts-ignore
        "--chip-c3": colors?.[2] ?? "#2e86ff",
        // @ts-ignore
        "--motion-scale": String(motionScale),
      }}
      onClick={onClick}
    >
      <svg
        className="chip-svg"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id="chipGrad" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="var(--chip-c1)" />
            <stop offset="55%" stopColor="var(--chip-c2)" />
            <stop offset="100%" stopColor="var(--chip-c3)" />
          </radialGradient>
          {/* simplified: remove dots and wobble animation */}
          <clipPath id="chipClip">
            <circle cx="100" cy="100" r="86" />
          </clipPath>
        </defs>
        <g>
          <circle cx="100" cy="100" r="86" fill="url(#chipGrad)" />
        </g>
      </svg>

      {icon && (
        <span className="material-icons chip-icon">{icon}</span>
      )}
      <span className="chip-label">{label}</span>
    </button>
  );
}

export function ConsoleScreenDotted(props: Omit<DottedChipProps, "label" | "icon">) {
  return (
    <DottedChip
      label="Samsung Air Conditioner Assistant"
      icon="inventory_2"   
      {...props}
    />
  );
}

export function DemoScreenDotted(props: Omit<DottedChipProps, "label" | "icon">) {
  return (
    <DottedChip
      label="Ticket Support"
      icon="airplane_ticket"
      {...props}
    />
  );
}
