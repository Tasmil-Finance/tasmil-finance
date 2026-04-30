"use client";

/**
 * AG-UI Stream Provider.
 *
 * Wraps `useAguiStream` and provides the same `StreamContext` that the rest
 * of the chat feature expects.  Drop-in replacement for `StreamProvider`
 * (which uses `useStream` from `@langchain/langgraph-sdk`).
 *
 * Activated via `NEXT_PUBLIC_USE_AGUI=true`.
 */

import type React from "react";
import { type ReactNode, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { buildAiIdentityHeaders } from "@/lib/ai-auth";
import { getBrowserAiBaseUrl } from "@/lib/runtime-urls";
import { LangGraphLogoSVG } from "@/shared/icons/langgraph";
import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { useAguiStream } from "../hooks/use-agui-stream";
import { StreamContext } from "./stream-provider";
import { useChatState } from "./chat-state-provider";
import { useThreads } from "./thread-provider";

function AguiStreamSession({
  children,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiUrl: string;
  assistantId: string;
}) {
  const { threadId, setThreadId } = useChatState();
  const { getThreads, setThreads } = useThreads();
  const { address: walletAddress } = useWallet();
  const accessToken = useAuthStore((state) => state.accessToken);
  const effectiveWallet = walletAddress ?? useWalletStore.getState().account;

  const defaultHeaders = useMemo(
    () => buildAiIdentityHeaders({ accessToken, walletAddress: effectiveWallet }),
    [accessToken, effectiveWallet],
  );

  const streamValue = useAguiStream({
    apiUrl,
    assistantId,
    threadId: threadId ?? null,
    defaultHeaders,
    fetchStateHistory: true,
    onThreadId: (id) => {
      setThreadId(id);
      window.history.replaceState(null, "", `/chat/${assistantId}/${id}`);

      // Refresh thread list after a short delay
      setTimeout(() => {
        getThreads(assistantId).then(setThreads).catch(console.error);
      }, 4000);
    },
  });

  // Health check on mount
  useEffect(() => {
    fetch(`${apiUrl}/info`, {
      headers: defaultHeaders,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Health check failed");
      })
      .catch(() => {
        toast.error("Failed to connect to AI server", {
          description: () => (
            <p>
              Please ensure the AI server is running at <code>{apiUrl}</code>.
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      });
  }, [apiUrl, defaultHeaders]);

  return <StreamContext.Provider value={streamValue}>{children}</StreamContext.Provider>;
}

export const AguiStreamProvider: React.FC<{
  children: ReactNode;
  agentId?: string;
}> = ({ children, agentId }) => {
  const assistantId = agentId || "";
  const apiUrl = getBrowserAiBaseUrl();

  if (!apiUrl || !assistantId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="fade-in-0 zoom-in-95 flex max-w-3xl animate-in flex-col rounded-lg border bg-background p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <LangGraphLogoSVG className="h-7" />
            <h1 className="font-semibold text-xl tracking-tight">Configuration Error</h1>
            <p className="text-muted-foreground">
              Missing required configuration. Please ensure NEXT_PUBLIC_AI_URL is set and agentId
              is provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AguiStreamSession apiUrl={apiUrl} assistantId={assistantId}>
      {children}
    </AguiStreamSession>
  );
};
