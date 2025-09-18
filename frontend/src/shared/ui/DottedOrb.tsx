import React from "react";
import "./dotted-orb.scss";

type DottedOrbProps = {
  size?: number; // px
  accentColor?: string;
  label?: string;
  description?: string;
  className?: string;
};

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));

const normalizeHex = (hex: string) => {
  let color = hex.replace("#", "").trim();
  if (color.length === 3) {
    color = color.split("").map((c) => c + c).join("");
  }
  return color.padEnd(6, "0");
};

const toRgb = (hex: string) => {
  const color = normalizeHex(hex);
  const num = parseInt(color, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `${r}, ${g}, ${b}`;
};

const adjustShade = (hex: string, amount: number) => {
  const color = normalizeHex(hex);
  const num = parseInt(color, 16);
  const r = clamp(((num >> 16) & 0xff) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return `rgb(${r}, ${g}, ${b})`;
};

export default function DottedOrb({
  size = 280,
  accentColor = "#5a7fff",
  label,
  description,
  className = "",
}: DottedOrbProps) {
  const s = `${size}px`;
  const accentRgb = toRgb(accentColor);
  const accentDark = adjustShade(accentColor, -80);

  return (
    <div
      className={["dotted-orb", className].filter(Boolean).join(" ")}
      style={{
        width: s,
        height: s,
        // @ts-ignore custom props
        "--orb-accent": accentColor,
        // @ts-ignore
        "--orb-accent-dark": accentDark,
        // @ts-ignore
        "--orb-accent-rgb": accentRgb,
      }}
    >
      <span className="orb-wave outer" />
      <span className="orb-wave middle" />
      <span className="orb-wave inner" />
      <div className="orb-shell">
        <div className="orb-core" />
        <div className="orb-glow" />
      </div>

      {(label || description) && (
        <div className="orb-text">
          <span className="orb-tag">Tool</span>
          {label && <h2 className="orb-title">{label}</h2>}
          {description && <p className="orb-description">{description}</p>}
        </div>
      )}
    </div>
  );
}
