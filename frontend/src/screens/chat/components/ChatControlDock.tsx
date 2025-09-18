import React from "react";

export type ChatControlDockProps = {
  connected: boolean;
  onConnectToggle: () => void;
  onInfoToggle: () => void;
  onExit?: () => void;
};

export default function ChatControlDock({
  connected,
  onConnectToggle,
  onInfoToggle,
  onExit,
}: ChatControlDockProps) {
  return (
    <section className="control-dock">
      <div className="dock-pill">
        <button
          className={`dock-btn ${connected ? "danger" : "primary"}`}
          onClick={onConnectToggle}
          aria-pressed={connected}
          aria-label={connected ? "Disconnect" : "Connect"}
        >
          <span className="material-symbols-outlined filled">
            {connected ? "stop" : "play_arrow"}
          </span>
        </button>


        {onExit && (
          <button className="dock-btn" onClick={onExit} aria-label="Back to selection">
            <span className="material-symbols-outlined filled">home</span>
          </button>
        )}
      </div>
    </section>
  );
}