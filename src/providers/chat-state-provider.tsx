"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface ChatStateContextType {
  threadId: string | null;
  setThreadId: (id: string | null) => void;
  hideToolCalls: boolean;
  setHideToolCalls: (hide: boolean) => void;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

interface ChatStateProviderProps {
  children: ReactNode;
  initialThreadId?: string | null;
}

export function ChatStateProvider({ children, initialThreadId = null }: ChatStateProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [hideToolCalls, setHideToolCalls] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);

  const handleSetChatHistoryOpen = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === "function") {
      setChatHistoryOpen(value);
    } else {
      setChatHistoryOpen(value);
    }
  }, []);

  return (
    <ChatStateContext.Provider
      value={{
        threadId,
        setThreadId,
        hideToolCalls,
        setHideToolCalls,
        chatHistoryOpen,
        setChatHistoryOpen: handleSetChatHistoryOpen,
      }}
    >
      {children}
    </ChatStateContext.Provider>
  );
}

export function useChatState() {
  const context = useContext(ChatStateContext);
  if (!context) {
    throw new Error("useChatState must be used within a ChatStateProvider");
  }
  return context;
}
