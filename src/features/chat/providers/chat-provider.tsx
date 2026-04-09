"use client";

import type { ReactNode } from "react";
import { ChatStateProvider } from "./chat-state-provider";
import { ThreadProvider } from "./thread-provider";
import { StreamProvider } from "./stream-provider";
import { ArtifactProvider } from "../thread/components";

interface ChatProviderProps {
  children: ReactNode;
  agentId?: string;
  chatId?: string | null;
}

/**
 * Main chat provider that combines all chat-related providers
 * Order matters: ChatState → Thread → Stream → Artifact
 */
export function ChatProvider({ children, agentId, chatId }: ChatProviderProps) {
  const initialThreadId = chatId === null ? null : chatId;

  return (
    <ChatStateProvider initialThreadId={initialThreadId}>
      <ThreadProvider agentId={agentId}>
        <StreamProvider agentId={agentId}>
          <ArtifactProvider>{children}</ArtifactProvider>
        </StreamProvider>
      </ThreadProvider>
    </ChatStateProvider>
  );
}
