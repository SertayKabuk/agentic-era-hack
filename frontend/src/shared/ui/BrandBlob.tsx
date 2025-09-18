import React from "react";

type BrandBlobProps = {
  size?: number;
  className?: string;
};

// Simple corporate-style blob with inner badge and smiley
export default function BrandBlob({ size = 220, className = "" }: BrandBlobProps) {
  const px = `${size}px`;
  return (
    <div
      className={["brand-blob", className].filter(Boolean).join(" ")}
      style={{ width: px, height: px }}
    >
      <div className="blob-bg" />
      <div className="blob-inner">
        <svg
          className="smiley"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle cx="50" cy="50" r="42" fill="#2E86FF" />
          <circle cx="38" cy="42" r="6" fill="#fff" />
          <circle cx="62" cy="42" r="6" fill="#fff" />
          <path
            d="M30 58c5 8 15 12 20 12s15-4 20-12"
            stroke="#fff"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}

