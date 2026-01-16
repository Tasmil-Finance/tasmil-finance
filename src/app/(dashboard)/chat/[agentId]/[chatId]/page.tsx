"use client";

import { useParams } from "next/navigation";
import { ChatPageWrapper } from "@/features/chat/components/chat-page-wrapper";

export default function ChatPage() {
  const { agentId, chatId } = useParams();

  return <ChatPageWrapper agentId={agentId as string} chatId={chatId as string} />;
}
