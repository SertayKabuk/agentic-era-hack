import React from "react";
import "./talking-avatar.scss";

export default function TalkingAvatar({ speaking = true }: { speaking?: boolean }) {
  const avatarSrc = `${process.env.PUBLIC_URL || ""}/customer.jpg`;

  return (
    <div className={`talking-avatar ${speaking ? 'speaking' : ''}`} aria-hidden>
      <img className="photo" src={avatarSrc} alt="Customer avatar" />
      <div className="edge" />
      <div className="wave w1" style={{ opacity: speaking ? 1 : 0.4 }} />
      <div className="wave w2" style={{ opacity: speaking ? 1 : 0.2 }} />
      <div className="wave w3" style={{ opacity: speaking ? 1 : 0.12 }} />
    </div>
  );
}
