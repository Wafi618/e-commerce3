import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Message Interface
 */
interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

/**
 * Message Context Interface
 */
interface MessageContextValue {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  showMessageModal: boolean;
  setShowMessageModal: (show: boolean) => void;
  fetchMessages: () => Promise<void>;
}

interface MessageProviderProps {
  children: ReactNode;
}

/**
 * Message Context
 * Manages messages state and fetching logic
 */
const MessageContext = createContext<MessageContextValue | undefined>(undefined);

/**
 * Message Provider Component
 * Provides message management functionality
 */
export function MessageProvider({ children }: MessageProviderProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);

  /**
   * Fetches messages from the API
   */
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages');
      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const value: MessageContextValue = {
    messages,
    setMessages,
    showMessageModal,
    setShowMessageModal,
    fetchMessages,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

/**
 * Custom hook to use Message context
 * @throws Error if used outside MessageProvider
 */
export function useMessage(): MessageContextValue {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}
