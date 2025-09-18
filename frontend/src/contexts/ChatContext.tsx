import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  userId?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_MESSAGES' };

const initialState: ChatState = {
  messages: [],
  isLoading: false,
  error: null,
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (message: string, userId?: string) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  const addMessage = (message: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const sendMessage = async (message: string, userId?: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      message,
      sender: 'user',
      timestamp: new Date(),
      userId,
    };
    
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/turkish-airlines/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const agentMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: data.response,
          sender: 'agent',
          timestamp: new Date(),
          userId,
        };
        dispatch({ type: 'ADD_MESSAGE', payload: agentMessage });
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Unknown error' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to send message' });
      console.error('Error sending message:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  return (
    <ChatContext.Provider
      value={{
        state,
        addMessage,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}