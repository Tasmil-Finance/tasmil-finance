"use client";

import { useParams } from "next/navigation";
import { ChatPageWrapper } from "@/components/chat/chat-page-wrapper";

export default function ChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const chatId = params.chatId as string;

  return <ChatPageWrapper agentId={agentId} chatId={chatId} />;
}
