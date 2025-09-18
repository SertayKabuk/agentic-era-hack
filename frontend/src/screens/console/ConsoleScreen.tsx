import React, { useEffect, useRef, useState } from "react";
import cn from "classnames";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../utils/store-logger";
import { AudioRecorder } from "../../utils/audio-recorder";
import "./console.scss";
import TalkingAvatar from "../../shared/ui/TalkingAvatar";
import ChatPanel from "./components/ChatPanel";
import ControlDock from "./components/ControlDock";
import ConnectionDrawer from "./components/ConnectionDrawer";

export type ConsoleScreenProps = {
  serverUrl: string;
  userId: string;
  onServerUrlChange: (url: string) => void;
  onUserIdChange: (id: string) => void;
  onExit?: () => void;
};

export default function ConsoleScreen({
  serverUrl,
  userId,
  onServerUrlChange,
  onUserIdChange,
  onExit,
}: ConsoleScreenProps) {
  const { connected, client, connect, disconnect, volume } = useLiveAPIContext();
  const { log, logs } = useLoggerStore();
  const [textInput, setTextInput] = useState("");
  const [muted, setMuted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const [connectionExpanded, setConnectionExpanded] = useState(false);
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [viewMode, setViewMode] = useState<'avatar' | 'chat'>("avatar");
  const [showAvatar, setShowAvatar] = useState(true);

  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const sh = el.scrollHeight;
      if (sh !== loggerLastHeightRef.current) {
        el.scrollTop = sh;
        loggerLastHeightRef.current = sh;
      }
    }
  }, [logs]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  const handleSubmit = () => {
    if (!textInput.trim()) return;
    client.send([{ text: textInput }]);
    setTextInput("");
    inputRef.current?.focus();
  };

  const onPlayClick = () => {
    if (connected) {
      disconnect();
      setShowAvatar(false);
    } else {
      connect();
      setViewMode("avatar");
      setShowAvatar(true);
    }
  };

  return (
    <div className={cn("console-screen", { "mode-chat": viewMode === "chat", "mode-avatar": viewMode === "avatar" })}>

      <ConnectionDrawer
        open={connectionExpanded}
        serverUrl={serverUrl}
        userId={userId}
        onServerUrlChange={onServerUrlChange}
        onUserIdChange={onUserIdChange}
        onClose={() => setConnectionExpanded(false)}
      />

      {showAvatar && <TalkingAvatar speaking={connected && !muted} />}

      {viewMode === "chat" && (
        <ChatPanel
          connected={connected}
          loggerRef={loggerRef}
        />
      )}

      <ControlDock
        connected={connected}
        muted={muted}
        chatOpen={viewMode === "chat"}
        onPlayToggle={onPlayClick}
        onMicToggle={() => setMuted((m) => !m)}
        onInfoToggle={() => setConnectionExpanded((v) => !v)}
        onChatToggle={() => {
          if (viewMode === "chat") {
            setViewMode("avatar");
          } else {
            setShowAvatar(true);
            setViewMode("chat");
          }
        }}
        onExit={onExit}
      />
    </div>
  );
}
