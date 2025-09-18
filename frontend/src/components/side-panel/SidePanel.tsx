/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from "classnames";
import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../utils/store-logger";
// Video streaming features removed per requirements
import { AudioRecorder } from "../../utils/audio-recorder";
import AudioPulse from "../audio-pulse/AudioPulse";
import Logger, { LoggerFilterType } from "../logger/Logger";
import "./side-panel.scss";

// Keep only "All" option
const filterOptions = [
  { value: "none", label: "All" },
];

export type SidePanelProps = {
  videoRef?: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo?: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
  serverUrl?: string;
  userId?: string;
  onServerUrlChange?: (url: string) => void;
  onUserIdChange?: (userId: string) => void;
};

// Media stream buttons removed

function SidePanel({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo = true,
  serverUrl = "ws://localhost:8000/",
  userId = "user1",
  onServerUrlChange = () => {},
  onUserIdChange = () => {},
}: SidePanelProps) {
  const { connected, client, connect, disconnect, volume } = useLiveAPIContext();
  const [open, setOpen] = useState(true);
  const [connectionExpanded, setConnectionExpanded] = useState(false);

  // Auto-collapse connection settings when panel is closed
  useEffect(() => {
    if (!open && connectionExpanded) {
      setConnectionExpanded(false);
    }
  }, [open, connectionExpanded]);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();

  const [textInput, setTextInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Control states
  // Video streaming removed
  const [activeVideoStream, setActiveVideoStream] = useState<MediaStream | null>(null);
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  // Removed video canvas
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  
  // Feedback state (local to SidePanel)
  const [feedbackScore, setFeedbackScore] = useState<number>(10);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [sendFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);
  
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`,
    );
  }, [inVolume]);

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

  // Video frame capture removed

  //handler for swapping from one video-stream to the next
  // Stream switcher removed

  const submitFeedback = async () => {
    const feedbackUrl = new URL('feedback', serverUrl.replace('ws', 'http')).href;
    
    try {
      const response = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          score: feedbackScore,
          text: feedbackText,
          run_id: client.currentRunId,
          user_id: userId,
          log_type: "feedback"
        })
      });
      if (!response.ok) {
        throw new Error(`Failed to submit feedback: Server returned status ${response.status} ${response.statusText}`);
      }

      // Clear feedback after successful submission
      setFeedbackScore(10);
      setFeedbackText("");
      setShowFeedback(false);
      alert("Feedback submitted successfully!");
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert(`Failed to submit feedback:  ${error}`);
    }
  };

  //scroll the log to the bottom when new logs come in
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  // listen for log events and store them
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  const handleSubmit = () => {
    client.send([{ text: textInput }]);

    setTextInput("");
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  };

  return (
    <div className={`side-panel ${open ? "open" : ""}`}>
      {/* video canvas removed */}
      <header className="top">
        <h2>Console</h2>
        {open ? (
          <button className="opener" onClick={() => setOpen(false)}>
            <RiSidebarFoldLine color="#b4b8bb" />
          </button>
        ) : (
          <button className="opener" onClick={() => setOpen(true)}>
            <RiSidebarUnfoldLine color="#b4b8bb" />
          </button>
        )}
      </header>
      
      {/* Connection Settings Section */}
      <section className="connection-settings">
        <button 
          className="connection-expander"
          onClick={() => setConnectionExpanded(!connectionExpanded)}
        >
          Connection Settings
          <span>{connectionExpanded ? '▼' : '▶'}</span>
        </button>
        {connectionExpanded && open && (
          <div className="connection-content">
            <div className="setting-group">
              <label htmlFor="server-url">Server URL</label>
              <input
                id="server-url"
                type="text"
                value={serverUrl}
                onChange={(e) => onServerUrlChange(e.target.value)}
                placeholder="ws://localhost:8000/"
                className="setting-input"
              />
            </div>
            <div className="setting-group">
              <label htmlFor="user-id">User ID</label>
              <input
                id="user-id"
                type="text"
                value={userId}
                onChange={(e) => onUserIdChange(e.target.value)}
                placeholder="user123"
                className="setting-input"
              />
            </div>
            <button 
              onClick={() => setShowFeedback(!sendFeedback)}
              className="feedback-button"
            >
              {sendFeedback ? 'Hide Feedback' : 'Send Feedback'}
            </button>
          </div>
        )}
      </section>

      {/* Control Tray - video controls removed */}
      <section className="control-tray">
        <nav className={cn("actions-nav", { disabled: !connected })}>
          <button
            ref={connectButtonRef}
            className={cn("action-button connect-toggle", { connected })}
            onClick={connected ? disconnect : connect}
          >
            <span className="material-symbols-outlined filled">
              {connected ? "pause" : "play_arrow"}
            </span>
          </button>

          <button
            className={cn("action-button mic-button", { active: !muted })}
            onClick={() => setMuted(!muted)}
          >
            {!muted ? (
              <span className="material-symbols-outlined filled">mic</span>
            ) : (
              <span className="material-symbols-outlined filled">mic_off</span>
            )}
          </button>

          <div className="action-button no-action outlined">
            <AudioPulse volume={volume} active={connected} hover={false} />
          </div>
          {children}
        </nav>

        <div className="connection-status">
          <span className={cn("text-indicator", { connected })}>
            {connected ? "Streaming" : "Disconnected"}
          </span>
        </div>
      </section>

      <section className="indicators">
        <Select
          className="react-select"
          classNamePrefix="react-select"
          styles={{
            control: (baseStyles) => ({
              ...baseStyles,
              background: "var(--Neutral-15)",
              color: "var(--Neutral-90)",
              minHeight: "33px",
              maxHeight: "33px",
              border: 0,
            }),
            option: (styles, { isFocused, isSelected }) => ({
              ...styles,
              backgroundColor: isFocused
                ? "var(--Neutral-30)"
                : isSelected
                  ? "var(--Neutral-20)"
                  : undefined,
            }),
          }}
          defaultValue={selectedOption}
          options={filterOptions}
          onChange={(e) => {
            setSelectedOption(e);
          }}
        />
        <div className={cn("streaming-indicator", { connected })}>
          {connected
            ? `🔵${open ? " Streaming" : ""}`
            : `⏸️${open ? " Paused" : ""}`}
        </div>
      </section>
      <div className="side-panel-container" ref={loggerRef}>
        <Logger
          filter={(selectedOption?.value as LoggerFilterType) || "none"}
        />
      </div>
      <div className={cn("input-container", { disabled: !connected })}>
        <div className="input-content">
          <textarea
            className="input-area"
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            onChange={(e) => setTextInput(e.target.value)}
            value={textInput}
          ></textarea>
          <span
            className={cn("input-content-placeholder", {
              hidden: textInput.length,
            })}
          >
            Type&nbsp;something...
          </span>

          <button
            className="send-button material-symbols-outlined filled"
            onClick={handleSubmit}
          >
            send
          </button>
        </div>
      </div>
      
      {/* Audio Pulse Bottom Section */}
      <section className="audio-pulse-bottom">
        <div className="pulse-container">
          <AudioPulse volume={volume} active={connected} hover={false} />
          <span className="pulse-label">
            {connected ? (volume > 0 ? "AI Speaking..." : "AI Ready") : "Not connected"}
          </span>
        </div>
      </section>

      {/* Feedback Overlay Section */}
      {sendFeedback && (
        <div className="feedback-section" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          borderRadius: '8px',
          zIndex: 1001,
          minWidth: '300px'
        }}>
          <h3>Provide Feedback</h3>
          <div>
            <label htmlFor="feedback-score">Score (0-10): </label>
            <input
              id="feedback-score"
              type="number"
              min="0"
              max="10"
              value={feedbackScore}
              onChange={(e) => setFeedbackScore(Number(e.target.value))}
              style={{margin: '0 10px'}}
            />
          </div>
          <div style={{marginTop: '10px'}}>
            <label htmlFor="feedback-text">Comments: </label>
            <textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              style={{
                width: '100%',
                height: '60px',
                margin: '5px 0'
              }}
            />
          </div>
          <button
            onClick={submitFeedback}
            style={{
              padding: '5px 10px',
              marginTop: '5px',
              cursor: 'pointer'
            }}
          >
            Submit Feedback
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(SidePanel);
