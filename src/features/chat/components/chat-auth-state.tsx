"use client";

import { Wallet } from "lucide-react";
import { Button } from "@/shared/ui/button-v2";

type ChatAuthStateMode = "disconnected" | "authenticating" | "session-invalid";

interface ChatAuthStateProps {
  mode: ChatAuthStateMode;
  onConnect?: () => void;
  onReconnect?: () => void;
}

const CONTENT: Record<ChatAuthStateMode, { title: string; body: string; cta?: string }> = {
  disconnected: {
    title: "Connect your wallet",
    body: "You need to connect a Stellar wallet to access the AI agent chat.",
    cta: "Connect Wallet",
  },
  authenticating: {
    title: "Verifying wallet session...",
    body: "Hold on while we verify your wallet signature with the backend session.",
  },
  "session-invalid": {
    title: "Reconnect your wallet",
    body: "Your wallet is connected, but this session is no longer valid for chat.",
    cta: "Reconnect Wallet",
  },
};

export function ChatAuthState({ mode, onConnect, onReconnect }: ChatAuthStateProps) {
  const content = CONTENT[mode];
  const onClick = mode === "disconnected" ? onConnect : onReconnect;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-semibold text-lg">{content.title}</h2>
        <p className="max-w-xs text-muted-foreground text-sm">{content.body}</p>
      </div>
      {content.cta ? (
        <Button
          type="button"
          variant="gradient"
          size="sm"
          onClick={() => onClick?.()}
          className="h-9 rounded-full px-4 font-bold text-sm"
        >
          {content.cta}
        </Button>
      ) : null}
    </div>
  );
}
