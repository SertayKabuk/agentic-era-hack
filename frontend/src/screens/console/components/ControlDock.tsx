import React from "react";

export type ControlDockProps = {
  connected: boolean;
  muted: boolean;
  chatOpen: boolean;
  onPlayToggle: () => void;
  onMicToggle: () => void;
  onInfoToggle: () => void;
  onChatToggle: () => void;
  onExit?: () => void;
};

export default function ControlDock({
  connected,
  muted,
  chatOpen,
  onPlayToggle,
  onMicToggle,
  onInfoToggle,
  onChatToggle,
  onExit,
}: ControlDockProps) {
  return (
    <section className="control-dock">
      <div className="dock-pill">
        <button
          className={`dock-btn ${connected ? "danger" : "primary"}`}
          onClick={onPlayToggle}
          aria-pressed={connected}
          aria-label={connected ? "Pause" : "Play"}
        >
          <span className="material-symbols-outlined filled">
            {connected ? "pause" : "play_arrow"}
          </span>
        </button>

        <button
          className={`dock-btn ${!muted ? "active" : ""}`}
          onClick={onMicToggle}
          aria-pressed={!muted}
          aria-label={!muted ? "Mic on" : "Mic off"}
        >
          <span className="material-symbols-outlined filled">
            {!muted ? "mic" : "mic_off"}
          </span>
        </button>

        <button
          className="dock-btn info"
          onClick={onInfoToggle}
          aria-label="Information"
        >
          <span className="material-symbols-outlined filled">info</span>
        </button>

        <button
          className={`dock-btn ${chatOpen ? "active" : ""}`}
          onClick={onChatToggle}
          aria-pressed={chatOpen}
          aria-label={chatOpen ? "Close chat" : "Open chat"}
        >
          <span className="material-symbols-outlined filled">chat_bubble</span>
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
