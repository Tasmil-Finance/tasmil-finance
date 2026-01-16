"use client";

import { ChatClient } from "@/features/chat/components";
import { ArtifactProvider } from "@/features/chat/thread/components";
import { ChatStateProvider } from "@/providers/chat-state-provider";
import { StreamProvider } from "@/providers/stream";
import { ThreadProvider } from "@/providers/thread";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  // Convert "new" to null for new chats
  const initialThreadId = chatId === "new" ? null : chatId;

  return (
    <ChatStateProvider initialThreadId={initialThreadId}>
      <ThreadProvider agentId={agentId} chatId={chatId}>
        <ArtifactProvider>
          <StreamProvider agentId={agentId} chatId={chatId}>
            <ChatClient agentId={agentId} chatId={chatId} />
          </StreamProvider>
        </ArtifactProvider>
      </ThreadProvider>
    </ChatStateProvider>
  );
}
