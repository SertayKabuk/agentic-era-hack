import React from "react";
import "./corner-logo.scss";

type CornerLogoProps = {
  src?: string;
  alt?: string;
  width?: number; // px
};

export default function CornerLogo({
  src = "/logo.png",
  alt = "Logo",
  width = 160,
}: CornerLogoProps) {
  return (
    <div className="corner-logo" style={{ width }} aria-hidden>
      <img src={src} alt={alt} />
    </div>
  );
}
