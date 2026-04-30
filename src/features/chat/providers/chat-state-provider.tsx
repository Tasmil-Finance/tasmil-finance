"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import type { AssistantInfo } from "../types";

interface ChatStateContextType {
  threadId: string | null;
  setThreadId: (id: string | null) => void;
  hideToolCalls: boolean;
  setHideToolCalls: (hide: boolean) => void;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  assistantInfo: AssistantInfo | null;
  setAssistantInfo: (info: AssistantInfo | null) => void;
  agentId: string | undefined;
  setAgentId: (id: string | undefined) => void;
  threadTitle: string | null;
  setThreadTitle: (title: string | null) => void;
}

const ChatStateContext = createContext<ChatStateContextType | undefined>(undefined);

interface ChatStateProviderProps {
  children: ReactNode;
  initialThreadId?: string | null;
  initialAgentId?: string;
}

export function ChatStateProvider({
  children,
  initialThreadId = null,
  initialAgentId,
}: ChatStateProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(initialThreadId);
  const [hideToolCalls, setHideToolCalls] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [assistantInfo, setAssistantInfo] = useState<AssistantInfo | null>(null);
  const [agentId, setAgentId] = useState<string | undefined>(initialAgentId);
  const [threadTitle, setThreadTitle] = useState<string | null>(null);

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
        assistantInfo,
        setAssistantInfo,
        agentId,
        setAgentId,
        threadTitle,
        setThreadTitle,
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
