"use client";

import {
  CopilotKit,
  useCopilotChat,
  useCopilotReadable,
} from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
// eslint-disable-next-line @typescript-eslint/no-require-imports
import { useAgent, useCopilotKit, CopilotChatConfigurationProvider } from "@copilotkitnext/react";
import type { Message } from "@langchain/langgraph-sdk";
import type { UIMessage } from "@langchain/langgraph-sdk/react-ui";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { DefiToolRenderers } from "../hooks/use-defi-tool-renderers";
import { HitlHandler } from "../hooks/use-hitl-handler";
import { ReasoningRenderer } from "../hooks/use-reasoning-renderer";
import { StreamContext, type StreamContextType } from "./stream-provider";

// ---------------------------------------------------------------------------
// Inner session — runs inside <CopilotKit>, bridges AG-UI agent to StreamContext
// ---------------------------------------------------------------------------

function CopilotKitStreamSession({ children, agentId, threadId }: { children: ReactNode; agentId: string; threadId?: string | null }) {
  const { address: walletAddress } = useWallet();

  useCopilotReadable({
    description: "The connected Stellar wallet address",
    value: walletAddress ?? "",
  });

  // Get the full AG-UI agent object — agent.messages updates per-token (streaming)
  const { agent } = useAgent({ agentId });
  useCopilotKit(); // keep hook stable; result unused here

  // useCopilotChat for sending messages
  const { appendMessage, stopGeneration } = useCopilotChat();

  // Track messages reactively via subscription
  const [agentMessages, setAgentMessages] = useState<any[]>([]);
  const [agentState, setAgentState] = useState<any>({});
  const [isRunning, setIsRunning] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Accumulate completed tool-call messages that AG-UI would otherwise discard.
  // AG-UI replaces messages on each step, so step-1 tool calls vanish when step-2 starts.
  const completedToolCyclesRef = useRef<any[]>([]);

  // Set the agent's threadId from the URL so LangGraphAgent uses the right thread
  useEffect(() => {
    if (!agent || !threadId) return;
    if (agent.threadId !== threadId) {
      agent.threadId = threadId;
    }
  }, [agent, threadId]);

  // Load thread history from backend when visiting an existing thread
  useEffect(() => {
    if (!threadId || historyLoaded || !agent) return;

    fetch(`/threads/${threadId}/state`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((state) => {
        if (!state?.values?.messages?.length) return;

        // Convert LangGraph messages to AG-UI format and set on agent
        const aguiMessages = state.values.messages.map((msg: any) => {
          switch (msg.type) {
            case "human":
              return { id: msg.id, role: "user", content: msg.content ?? "" };
            case "ai":
              return {
                id: msg.id,
                role: "assistant",
                content: msg.content ?? "",
                toolCalls: msg.tool_calls?.map((tc: any) => ({
                  id: tc.id,
                  type: "function",
                  function: { name: tc.name, arguments: JSON.stringify(tc.args ?? {}) },
                })) ?? [],
              };
            case "tool":
              return {
                id: msg.id,
                role: "tool",
                content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
                toolCallId: msg.tool_call_id,
              };
            default:
              return null;
          }
        }).filter(Boolean);

        // Only update local display state — do NOT call agent.setMessages().
        // Calling agent.setMessages() puts the CopilotKit AG-UI agent into a
        // mid-conversation state that prevents appendMessage from creating new runs.
        // LangGraph already holds the full thread history in its DB, so the backend
        // will have context when the next run is created.
        setAgentMessages(aguiMessages);

        if (state.values.ui) {
          setAgentState((prev: any) => ({ ...prev, ui: state.values.ui }));
        }
        setHistoryLoaded(true);
      })
      .catch(() => {
        // Thread may not exist yet
      });
  }, [threadId, agent, historyLoaded]);

  useEffect(() => {
    if (!agent) return;

    const sub = agent.subscribe({
      onMessagesChanged: ({ messages: msgs }: any) => {
        const incoming = [...msgs];

        // Detect completed tool cycles (AI with toolCalls + matching tool result)
        // and save them before AG-UI replaces them on the next step.
        const toolResultIds = new Set(
          incoming.filter((m: any) => m.role === "tool" && m.toolCallId)
            .map((m: any) => m.toolCallId)
        );

        // Find AI messages whose tool calls all have results — these are "done"
        for (const m of incoming) {
          if (m.role !== "assistant" || !m.toolCalls?.length) continue;
          const allDone = m.toolCalls.every((tc: any) => toolResultIds.has(tc.id));
          if (!allDone) continue;
          const saved = completedToolCyclesRef.current;
          if (saved.some((s: any) => s.id === m.id)) continue;
          saved.push(m);
          for (const tc of m.toolCalls) {
            const toolMsg = incoming.find(
              (t: any) => t.role === "tool" && t.toolCallId === tc.id
            );
            if (toolMsg && !saved.some((s: any) => s.id === toolMsg.id)) {
              saved.push(toolMsg);
            }
          }
        }

        setAgentMessages(incoming);
      },
      onStateChanged: ({ state }: any) => {
        setAgentState(state ?? {});
      },
      onRunInitialized: () => {
        // Do NOT clear completedToolCyclesRef here.
        // AG-UI fires onRunInitialized for every LangGraph step (each model call),
        // not just when a new user message is submitted. Clearing the ref here
        // would wipe saved tool cycles the moment the AI starts streaming its
        // text response (the next step), making cards disappear until the full
        // response is done. Instead we clear the ref in submit() so it only
        // resets on genuine new user messages.
        if (agent.messages?.length > 0) setIsRunning(true);
      },
      onRunFinalized: () => setIsRunning(false),
    });

    if (agent.messages?.length > 0) {
      setAgentMessages([...agent.messages]);
    }
    if (agent.state) {
      setAgentState(agent.state);
    }

    return () => sub.unsubscribe();
  }, [agent]);

  const uiCache = useRef<UIMessage[]>([]);

  // Convert a single AG-UI message to LangGraph Message shape
  const toLangGraphMsg = useCallback((msg: any): Message => ({
    id: msg.id,
    type: msg.role === "assistant" ? "ai" : msg.role === "user" ? "human" : msg.role === "tool" ? "tool" : "unknown",
    content: msg.content ?? "",
    ...(msg.role === "assistant" && {
      tool_calls: msg.toolCalls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function?.name ?? tc.name,
        args: (() => {
          try {
            const raw = tc.function?.arguments;
            if (typeof raw === "string" && raw.length > 0) return JSON.parse(raw);
            return tc.function?.arguments ?? tc.args ?? {};
          } catch { return tc.args ?? {}; }
        })(),
      })) ?? [],
    }),
    ...(msg.role === "tool" && {
      tool_call_id: msg.toolCallId,
    }),
  }) as unknown as Message, []);

  // Convert AG-UI messages to LangGraph Message shape,
  // re-injecting completed tool cycles that AG-UI discarded.
  const messages = useMemo<Message[]>(() => {
    const currentIds = new Set(agentMessages.map((m: any) => m.id));
    const saved = completedToolCyclesRef.current;

    // Collect missing saved messages (not present in current AG-UI messages)
    const missing = saved.filter((m: any) => !currentIds.has(m.id));

    if (missing.length === 0) {
      return agentMessages.map(toLangGraphMsg);
    }

    // Find the last human message in current messages to inject after
    const lastHumanIdx = [...agentMessages].reverse()
      .findIndex((m: any) => m.role === "user");
    const insertAfter = lastHumanIdx >= 0
      ? agentMessages.length - 1 - lastHumanIdx
      : 0;

    // Build merged array: messages before insertion point + missing + rest
    const before = agentMessages.slice(0, insertAfter + 1);
    const after = agentMessages.slice(insertAfter + 1);
    const merged = [...before, ...missing, ...after];

    return merged.map(toLangGraphMsg);
  }, [agentMessages, toLangGraphMsg]);

  // UI elements from agent state
  const values = useMemo(() => {
    const ui = agentState?.ui ?? uiCache.current;
    if (Array.isArray(ui)) {
      uiCache.current = ui as UIMessage[];
    }
    return { messages, ui: uiCache.current };
  }, [messages, agentState]);

  const submit = useCallback(
    (
      payload: { messages: Message[]; wallet_address?: string },
      _options?: Record<string, unknown>,
    ) => {
      const lastMessage = payload.messages[payload.messages.length - 1];
      if (!lastMessage) return;

      const content =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : Array.isArray(lastMessage.content)
            ? lastMessage.content
                .map((c: unknown) =>
                  typeof c === "object" && c !== null && "text" in c
                    ? (c as { text: string }).text
                    : String(c),
                )
                .join("")
            : String(lastMessage.content);

      try {
        // Clear saved tool cycles on new user message so previous turn's cards
        // don't bleed into the next turn's message list.
        completedToolCyclesRef.current = [];

        // Set wallet address on agent state before sending message
        // so WalletContextMiddleware can read it from the LangGraph state
        if (agent && (payload.wallet_address || walletAddress)) {
          const addr = payload.wallet_address || walletAddress;
          agent.setState({ ...(agent.state ?? {}), wallet_address: addr });
        }

        const { TextMessage, Role } = require("@copilotkit/runtime-client-gql");
        const msg = new TextMessage({
          id: lastMessage.id || crypto.randomUUID(),
          role: Role.User,
          content,
        });
        appendMessage(msg);
      } catch (e) {
        console.error("[CK-Stream] appendMessage error:", e);
      }
    },
    [appendMessage, agent, walletAddress],
  );

  const stop = useCallback(() => {
    agent?.abortRun?.();
    stopGeneration?.();
  }, [agent, stopGeneration]);

  const contextValue = useMemo(
    () =>
      ({
        messages,
        values,
        isLoading: isRunning || (agent?.isRunning ?? false),
        error: undefined,
        interrupt: undefined,
        submit,
        stop,
        getMessagesMetadata: () => undefined,
      }) as unknown as StreamContextType,
    [messages, values, isRunning, agent?.isRunning, submit, stop],
  );

  return (
    <StreamContext.Provider value={contextValue}>
      {children}
    </StreamContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Public provider
// ---------------------------------------------------------------------------

const COPILOTKIT_BACKEND_URL = "/api/copilotkit";

export const CopilotKitStreamProvider: React.FC<{
  children: ReactNode;
  agentId?: string;
  threadId?: string | null;
}> = ({ children, agentId, threadId }) => {
  const resolvedAgentId = agentId || "supervisor";
  return (
    <CopilotKit runtimeUrl={COPILOTKIT_BACKEND_URL} agent={resolvedAgentId}>
      <CopilotChatConfigurationProvider agentId={resolvedAgentId} threadId={threadId ?? undefined}>
        <DefiToolRenderers />
        <HitlHandler />
        <ReasoningRenderer />
        <CopilotKitStreamSession agentId={resolvedAgentId} threadId={threadId}>{children}</CopilotKitStreamSession>
      </CopilotChatConfigurationProvider>
    </CopilotKit>
  );
};
