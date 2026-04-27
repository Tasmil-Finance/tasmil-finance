"use client";

import { useWallet } from "@/shared/context/wallet-context";
import { ChatProvider } from "../providers";
import { ChatAuthState } from "./chat-auth-state";
import { ChatClient } from "./chat-client";

interface ChatPageWrapperProps {
  agentId: string;
  chatId: string;
}

export function ChatPageWrapper({ agentId, chatId }: ChatPageWrapperProps) {
  const { isConnected, connectWalletOnly } = useWallet();

  if (!isConnected) {
    return <ChatAuthState mode="disconnected" onConnect={() => void connectWalletOnly()} />;
  }

  const initialThreadId = chatId === "new" ? undefined : chatId;

  return (
    <ChatProvider key={chatId} agentId={agentId} chatId={initialThreadId}>
      <ChatClient agentId={agentId} chatId={chatId} />
    </ChatProvider>
  );
}
