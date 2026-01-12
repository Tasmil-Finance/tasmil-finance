"use client";

// 🔌 Pending message provider - persists message across CopilotKit remounts

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';

interface PendingMessageContextValue {
  pendingMessage: string | null;
  setPendingMessage: (msg: string | null) => void;
}

const PendingMessageContext = createContext<PendingMessageContextValue | undefined>(undefined);

interface PendingMessageProviderProps {
  children: ReactNode;
}

export function PendingMessageProvider({ children }: PendingMessageProviderProps) {
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const value = useMemo<PendingMessageContextValue>(() => ({
    pendingMessage,
    setPendingMessage,
  }), [pendingMessage]);

  return (
    <PendingMessageContext.Provider value={value}>
      {children}
    </PendingMessageContext.Provider>
  );
}

export function usePendingMessage(): PendingMessageContextValue {
  const context = useContext(PendingMessageContext);
  if (!context) {
    throw new Error('usePendingMessage must be used within a PendingMessageProvider');
  }
  return context;
}
