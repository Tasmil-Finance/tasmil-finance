"use client";

/**
 * AG-UI Stream Provider.
 *
 * Wraps `useAguiStream` and provides the same `StreamContext` that the rest
 * of the chat feature expects.  Uses `HttpAgent` from `@ag-ui/client` to
 * connect to the backend `/agui/{graphId}` SSE endpoint.
 */

import type React from "react";
import { type ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { buildAiIdentityHeaders } from "@/lib/ai-auth";
import { getBrowserAiBaseUrl } from "@/lib/runtime-urls";
import { LangGraphLogoSVG } from "@/shared/icons/langgraph";
import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { getAgentConfig } from "../config/agents.config";
import { createClient } from "../lib/client";
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
  const { threadId, setThreadId, setThreadTitle } = useChatState();
  const { getThreads, setThreads } = useThreads();
  const { address: walletAddress } = useWallet();
  const accessToken = useAuthStore((state) => state.accessToken);
  const effectiveWallet = walletAddress ?? useWalletStore.getState().account;

  // Keep a ref to the current thread ID so title callbacks can check it
  const currentThreadIdRef = useRef(threadId);
  // Track thread IDs that were just created (to skip title restore)
  const justCreatedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    currentThreadIdRef.current = threadId;
  }, [threadId]);

  const defaultHeaders = useMemo(
    () => buildAiIdentityHeaders({ accessToken, walletAddress: effectiveWallet }),
    [accessToken, effectiveWallet],
  );

  const agentName = getAgentConfig(assistantId).name;

  // Persist a title to thread metadata
  const persistThreadTitle = useCallback(
    (id: string, title: string) => {
      const client = createClient(apiUrl, {
        accessToken,
        walletAddress: effectiveWallet,
      });
      client.threads.update(id, { metadata: { title } }).catch(() => {
        // Silently ignore — title is cosmetic, metadata update may fail on new threads
      });
    },
    [apiUrl, accessToken, effectiveWallet],
  );

  const streamValue = useAguiStream({
    apiUrl,
    assistantId,
    threadId: threadId ?? null,
    defaultHeaders,
    fetchStateHistory: true,
    onThreadId: (id) => {
      setThreadId(id);
      window.history.replaceState(null, "", `/chat/${id}`);

      // Mark as just-created so restore useEffect doesn't overwrite title
      justCreatedRef.current.add(id);

      // Persist initial agent-name title to thread metadata
      persistThreadTitle(id, agentName);

      // Refresh thread list after a short delay
      setTimeout(() => {
        getThreads(assistantId).then(setThreads).catch(console.error);
      }, 4000);
    },
    onFirstResponse: (title) => {
      // Only update if we're still on the same thread
      const currentId = currentThreadIdRef.current;
      if (currentId) {
        setThreadTitle(title);
        persistThreadTitle(currentId, title);
      }
    },
  });

  // Restore thread title from metadata when loading an existing thread
  useEffect(() => {
    if (!threadId) {
      setThreadTitle(agentName);
      return;
    }

    // Skip restore for just-created threads — title already set by handleSubmit
    if (justCreatedRef.current.has(threadId)) {
      justCreatedRef.current.delete(threadId);
      return;
    }

    let cancelled = false;
    fetch(`${apiUrl}/threads/${threadId}`, { headers: defaultHeaders })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const savedTitle = data?.metadata?.title;
        if (savedTitle && typeof savedTitle === "string") {
          setThreadTitle(savedTitle);
        } else {
          setThreadTitle(agentName);
        }
      })
      .catch(() => {
        if (!cancelled) setThreadTitle(agentName);
      });

    return () => {
      cancelled = true;
    };
  }, [threadId, apiUrl, defaultHeaders, agentName, setThreadTitle]);

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

export const StreamProvider: React.FC<{
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
