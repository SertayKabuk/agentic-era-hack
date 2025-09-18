import React, { RefObject, useEffect } from "react";
import cn from "classnames";
import { useChatContext } from "../../../contexts/ChatContext";
import ChatMessageComponent from "./ChatMessage";

export type ChatPanelProps = {
  connected: boolean;
  loggerRef: RefObject<HTMLDivElement>;
  textInput: string;
  onTextInputChange: (value: string) => void;
  onSubmit: () => void;
  inputRef: RefObject<HTMLTextAreaElement>;
  userId?: string;
};

export default function ChatPanel({
  connected,
  loggerRef,
  textInput,
  onTextInputChange,
  onSubmit,
  inputRef,
  userId,
}: ChatPanelProps) {
  const { state, sendMessage } = useChatContext();

  const handleSubmit = async () => {
    if (!textInput.trim()) return;
    
    // Send message to Turkish Airlines agent
    await sendMessage(textInput, userId);
    onTextInputChange("");
    onSubmit();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (loggerRef.current) {
      loggerRef.current.scrollTop = loggerRef.current.scrollHeight;
    }
  }, [state.messages, loggerRef]);

  return (
    <section className="chat-panel">
      <div className="chat-heading">
        <span className={`chat-status ${connected ? "on" : "off"}`}>
          Turkish Airlines Support - {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      
      <div className="chat-list" ref={loggerRef}>
        <div className="chat-messages">
          {state.messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-content">
                <h3>Hello! 👋</h3>
                <p>I'm Compass from the TURKISH AIRLINES support team. How can I assist you today?</p>
              </div>
            </div>
          ) : (
            state.messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))
          )}
          
          {state.isLoading && (
            <div className="loading-message">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          {state.error && (
            <div className="error-message">
              <p>Hata: {state.error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="chat-input-area">
        <div className="input-container">
          <div className="input-content">
            <textarea
              ref={inputRef}
              placeholder=""
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSubmit();
                }
              }}
              onChange={(e) => onTextInputChange(e.target.value)}
              value={textInput}
              disabled={state.isLoading}
            ></textarea>
            <span
              className={cn("input-content-placeholder", {
                hidden: textInput.length,
              })}
            >
              Mesajınızı yazın...
            </span>
          </div>

          <button
            className="send-button material-symbols-outlined filled"
            onClick={handleSubmit}
            disabled={!textInput.trim() || state.isLoading}
          >
            send
          </button>
        </div>
      </div>
    </section>
  );
}