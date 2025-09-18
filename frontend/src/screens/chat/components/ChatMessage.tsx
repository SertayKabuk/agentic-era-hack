import React from 'react';
import { ChatMessage } from '../../../contexts/ChatContext';
import './ChatMessage.scss';

interface ChatMessageProps {
  message: ChatMessage;
}

export default function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const timeString = message.timestamp.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`chat-message ${isUser ? 'user' : 'agent'}`}>
      <div className="message-content">
        <div className="message-text">
          {message.message}
        </div>
        <div className="message-time">
          {timeString}
        </div>
      </div>
      <div className="message-avatar">
        {isUser ? '👤' : '✈️'}
      </div>
    </div>
  );
}