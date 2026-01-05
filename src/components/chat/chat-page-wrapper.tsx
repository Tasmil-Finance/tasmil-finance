"use client";

import { StreamProvider } from "@/providers/stream";
import { ThreadProvider } from "@/providers/thread";
import { ChatStateProvider } from "@/providers/chat-state-provider";
import { ArtifactProvider } from "@/components/thread/artifact";
import { ChatClient } from "./chat-client";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  // Convert "new" to null for new chats
  const initialThreadId = chatId === "new" ? null : chatId;
  
  return (
    <ChatStateProvider initialThreadId={initialThreadId}>
      <ThreadProvider>
        <ArtifactProvider>
          <StreamProvider>
            <ChatClient agentId={agentId} chatId={chatId} />
          </StreamProvider>
        </ArtifactProvider>
      </ThreadProvider>
    </ChatStateProvider>
  );
}
