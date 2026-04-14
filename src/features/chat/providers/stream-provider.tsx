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
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { toast } from "sonner";
import { getApiKey } from "@/lib/api-key";
import { LangGraphLogoSVG } from "@/shared/icons/langgraph";
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
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(apiUrl: string, apiKey: string | null): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
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

  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    fetchStateHistory: true,
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
      // Refetch threads list when thread ID changes.
      sleep().then(() => getThreads(assistantId).then(setThreads).catch(console.error));
    },
  });

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey).then((ok) => {
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

export const StreamProvider: React.FC<{
  children: ReactNode;
  agentId?: string;
}> = ({ children, agentId }) => {
  // Get environment variables
  const envApiUrl: string | undefined = process.env["NEXT_PUBLIC_API_URL"];

  // Use agentId from props as assistantId
  const assistantId = agentId || "";
  const apiUrl = envApiUrl || "";

  // For API key, use localStorage with env var fallback
  const apiKey = typeof window !== "undefined" ? getApiKey() : null;

  // Show error if we don't have required values
  if (!apiUrl || !assistantId) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-4">
        <div className="fade-in-0 zoom-in-95 flex max-w-3xl animate-in flex-col rounded-lg border bg-background p-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <LangGraphLogoSVG className="h-7" />
            <h1 className="font-semibold text-xl tracking-tight">Configuration Error</h1>
            <p className="text-muted-foreground">
              Missing required configuration. Please ensure NEXT_PUBLIC_API_URL is set and agentId
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

// Create a custom hook to use the context
export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
