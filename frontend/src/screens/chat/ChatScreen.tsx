import React, { useEffect, useRef, useState } from "react";
import cn from "classnames";
import { ChatProvider } from "../../contexts/ChatContext";
import "./chat.scss";
import ChatPanel from "./components/ChatPanel";
import ChatControlDock from "./components/ChatControlDock";
import ConnectionDrawer from "../console/components/ConnectionDrawer";

export type ChatScreenProps = {
  serverUrl: string;
  userId: string;
  onServerUrlChange: (url: string) => void;
  onUserIdChange: (id: string) => void;
  onExit?: () => void;
};

export default function ChatScreen({
  serverUrl,
  userId,
  onServerUrlChange,
  onUserIdChange,
  onExit,
}: ChatScreenProps) {
  const [connectionExpanded, setConnectionExpanded] = useState(false);
  const [textInput, setTextInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loggerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    if (!textInput.trim()) return;
    // This will be handled by ChatPanel now
    setTextInput("");
    inputRef.current?.focus();
  };

  return (
    <ChatProvider>
      <div className="chat-screen">
        <ConnectionDrawer
          open={connectionExpanded}
          serverUrl={serverUrl}
          userId={userId}
          onServerUrlChange={onServerUrlChange}
          onUserIdChange={onUserIdChange}
          onClose={() => setConnectionExpanded(false)}
        />

        <ChatPanel
          connected={true} // Always show as connected for Turkish Airlines agent
          loggerRef={loggerRef}
          textInput={textInput}
          onTextInputChange={setTextInput}
          onSubmit={handleSubmit}
          inputRef={inputRef}
          userId={userId}
        />

        <ChatControlDock
          connected={true} // Always show as connected for Turkish Airlines agent
          onConnectToggle={() => {}} // No-op since we don't use WebSocket
          onInfoToggle={() => setConnectionExpanded((v) => !v)}
          onExit={onExit}
        />
      </div>
    </ChatProvider>
  );
}