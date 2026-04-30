"use client";

import type { Message } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";
import {
  isRemoveUIMessage,
  isUIMessage,
  type RemoveUIMessage,
  type UIMessage,
  uiMessageReducer,
} from "@langchain/langgraph-sdk/react-ui";
import type React from "react";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getApiKey } from "@/lib/api-key";
import { buildAiIdentityHeaders } from "@/lib/ai-auth";
import { getBrowserAiBaseUrl } from "@/lib/runtime-urls";
import { LangGraphLogoSVG } from "@/shared/icons/langgraph";
import { useWallet } from "@/shared/context/wallet-context";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";
import { createClient } from "../lib/client";
import { classifyChatProductError } from "../lib/chat-product-error";
import type { StateType } from "../types";
import { useChatState } from "./chat-state-provider";
import { useThreads } from "./thread-provider";

const useTypedStream = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
      context?: Record<string, unknown>;
      signed_txs?: Record<string, unknown>;
      charge_usage?: boolean;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

export type StreamContextType = ReturnType<typeof useTypedStream>;
export const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(apiKey: string | null): Promise<boolean> {
  try {
    const res = await fetch("/info", {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const { threadId, setThreadId } = useChatState();
  const { getThreads, setThreads } = useThreads();
  const { address: walletAddress } = useWallet();
  const accessToken = useAuthStore((state) => state.accessToken);
  const effectiveWallet = walletAddress ?? useWalletStore.getState().account;
  const defaultHeaders = buildAiIdentityHeaders({
    accessToken,
    walletAddress: effectiveWallet,
  });
  const initialThreadId = useRef(threadId);

  useEffect(() => {
    const preExistingThreadId = initialThreadId.current;
    if (!preExistingThreadId) return;

    const client = createClient(apiUrl, {
      apiKey: apiKey ?? undefined,
      accessToken,
      walletAddress: effectiveWallet,
    });

    client.threads.get(preExistingThreadId).catch((error) => {
      if (classifyChatProductError(error) === "SESSION_INVALID") {
        return;
      }

      setThreadId(null);
      window.history.replaceState(null, "", `/chat/${assistantId}/new`);
    });
  }, [accessToken, apiKey, apiUrl, assistantId, effectiveWallet, setThreadId]);

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    defaultHeaders,
    fetchStateHistory: true,
    onFinish: () => {},
    onCustomEvent: (event, options) => {
      if (isUIMessage(event) || isRemoveUIMessage(event)) {
        options.mutate((prev: any) => {
          const ui = uiMessageReducer(prev?.ui ?? [], event);
          return { ...prev, ui };
        });
      }
    },
    onThreadId: (id) => {
      setThreadId(id);
      window.history.replaceState(null, "", `/chat/${assistantId}/${id}`);
      if (effectiveWallet) {
        const client = createClient(apiUrl, {
          apiKey: apiKey ?? undefined,
          accessToken,
          walletAddress: effectiveWallet,
        });
        client.threads.update(id, { metadata: { wallet_address: effectiveWallet } }).catch(console.error);
      }
      sleep().then(() => getThreads(assistantId).then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    checkGraphStatus(apiKey).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and your API key is
              correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl]);

  return <StreamContext.Provider value={streamValue}>{children}</StreamContext.Provider>;
};

/** @deprecated Use StreamProvider from agui-stream-provider instead. */
export const LangGraphStreamProvider: React.FC<{
  children: ReactNode;
  agentId?: string;
}> = ({ children, agentId }) => {
  const assistantId = agentId || "";
  const apiUrl = getBrowserAiBaseUrl();

  const apiKey = typeof window !== "undefined" ? getApiKey() : null;

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
    <StreamSession apiKey={apiKey} apiUrl={apiUrl} assistantId={assistantId}>
      {children}
    </StreamSession>
  );
};

export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
