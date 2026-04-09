"use client";

import type { Thread } from "@langchain/langgraph-sdk";
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { validate } from "uuid";
import { getApiKey } from "@/lib/api-key";
import { createClient } from "../lib/client";

interface ThreadContextType {
  getThreads: (assistantId?: string) => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children, agentId }: { children: ReactNode; agentId?: string }) {
  const apiUrl = process.env["NEXT_PUBLIC_API_URL"] || "";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(
    async (assistantId?: string): Promise<Thread[]> => {
      // Use agentId from props if assistantId not provided
      const finalAssistantId = assistantId || agentId;
      if (!apiUrl || !finalAssistantId) return [];
      const client = createClient(apiUrl, getApiKey() ?? undefined);

      const threads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(finalAssistantId),
        },
        limit: 100,
      });

      return threads;
    },
    [apiUrl, agentId]
  );

  const value = useMemo(
    () => ({
      getThreads,
      threads,
      setThreads,
      threadsLoading,
      setThreadsLoading,
    }),
    [getThreads, threads, threadsLoading]
  );

  return <ThreadContext.Provider value={value}>{children}</ThreadContext.Provider>;
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThreads must be used within a ThreadProvider");
  }
  return context;
}
