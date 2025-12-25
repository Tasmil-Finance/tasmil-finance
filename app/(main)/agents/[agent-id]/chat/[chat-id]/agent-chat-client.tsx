"use client";

import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import type { ChatMessage } from "@repo/api";
import type { VisibilityType } from "@/components/visibility-selector";

interface AgentChatClientProps {
  chatId: string;
  initialChatModel: string;
  initialMessages: ChatMessage[];
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  agentId: string;
  autoResume: boolean;
}

export function AgentChatClient({
  chatId,
  initialChatModel,
  initialMessages,
  initialVisibilityType,
  isReadonly,
  agentId,
  autoResume,
}: AgentChatClientProps) {
  console.log("[AgentChatClient] Rendering with:", {
    chatId,
    messagesCount: initialMessages.length,
    initialMessages: initialMessages.slice(0, 2), // Log first 2 messages
    agentId,
    isReadonly,
  });

  return (
    <>
      <Chat
        autoResume={autoResume}
        id={chatId}
        initialChatModel={initialChatModel}
        initialMessages={initialMessages}
        initialVisibilityType={initialVisibilityType}
        isReadonly={isReadonly}
        agentId={agentId}
      />
      <DataStreamHandler />
    </>
  );
}

