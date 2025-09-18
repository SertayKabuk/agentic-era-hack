import React from "react";
import "./background-video.scss";

type BackgroundVideoProps = {
  src?: string;
  opacity?: number; // 0..1
  dotSize?: number; // px
  dotAlpha?: number; // 0..1
};

export default function BackgroundVideo({
  src = "/bg-video.mp4",
  opacity = 0.5,
  dotSize = 12,
  dotAlpha = 0.08,
}: BackgroundVideoProps) {
  return (
    <div
      className="background-video"
      style={{
        // CSS variables for easy theming
        // @ts-ignore custom properties
        "--bgv-opacity": String(opacity),
        // @ts-ignore custom properties
        "--bgv-dot-size": `${dotSize}px`,
        // @ts-ignore custom properties
        "--bgv-dot-alpha": String(dotAlpha),
      }}
      aria-hidden
    >
      <video className="bgv-video" autoPlay muted loop playsInline>
        <source src={src} type="video/mp4" />
      </video>
      <div className="bgv-dots" />
    </div>
  );
}

