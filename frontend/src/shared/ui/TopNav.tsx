import React from "react";
import "./top-nav.scss";

export default function TopNav() {
  return (
    <nav className="top-nav" aria-label="Global Navigation">
      <div className="nav-inner">
        <div className="brand">
          <img src="/logo.png" alt="Compass logo" className="brand-logo" />
          <span className="brand-name">Compass</span>
        </div>
      </div>
    </nav>
  );
}

