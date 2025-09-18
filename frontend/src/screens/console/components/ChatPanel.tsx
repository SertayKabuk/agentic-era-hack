import React, { RefObject } from "react";
import Logger from "../../../components/logger/Logger";

export type ChatPanelProps = {
  connected: boolean;
  loggerRef: RefObject<HTMLDivElement>;
};

export default function ChatPanel({
  connected,
  loggerRef,
}: ChatPanelProps) {
  return (
    <section className="chat-panel">
      <div className="chat-heading">
        <span className={`chat-status ${connected ? "on" : "off"}`}>
          {connected ? "Streaming" : "Disconnected"}
        </span>
      </div>
      <div className="chat-list" ref={loggerRef}>
        <Logger filter="none" />
      </div>
    </section>
  );
}
