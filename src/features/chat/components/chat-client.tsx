"use client";

import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowLeft, Clock, Paperclip, Send, Square, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { WelcomeRewardCard } from "@/features/welcome-reward/components/welcome-reward-card";
import { useWelcomeReward } from "@/features/welcome-reward/hooks/use-welcome-reward";
import { useSearchAssistantsAssistantsSearchPost } from "@/gen-ai/hooks/use-search-assistants-assistants-search-post";
import { DO_NOT_RENDER_ID_PREFIX, ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { kubbClient } from "@/lib/kubb";
import { cn } from "@/lib/utils";
import { useWallet } from "@/shared/context/wallet-context";
import { useFileUpload } from "@/shared/hooks/use-file-upload";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button-v2";
import { useMultiSidebar } from "@/shared/ui/multi-sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { useWalletStore } from "@/store/use-wallet";
import { AssistantMessage, AssistantMessageLoading } from "../components/messages/ai-message";
import { HumanMessage } from "../components/messages/human-message";
import { useChatState, useStreamContext } from "../hooks";
import { ContentBlocksPreview } from "../thread/components/content-blocks-preview";
import { mergeMessagesWithCache, shouldFilterMessage } from "./chat-client-helpers";
// import { BackgroundRippleEffect } from '@/shared/ui/background-ripple-effect';
import { Greeting } from "./greeting";
import { SuggestedActions } from "./suggested-actions";

// Mapping from short agent IDs to API graph_ids
const AGENT_TO_GRAPH_ID: Record<string, string> = {
  supervisor: "supervisor",
  info_agent: "info_agent",
  blend_agent: "blend_agent",
  soroswap_agent: "soroswap_agent",
  phoenix_agent: "phoenix_agent",
  aquarius_agent: "aquarius_agent",
  defindex_agent: "defindex_agent",
  templar_agent: "templar_agent",
  allbridge_agent: "allbridge_agent",
  sdex_agent: "sdex_agent",
  bridge_agent: "bridge_agent",
  yield_agent: "yield_agent",
  research_agent: "research_agent",
  // Short aliases used in URLs
  staking: "supervisor",
  research: "research_agent",
  yield: "yield_agent",
  bridge: "bridge_agent",
};

function toGraphId(agentId: string): string {
  return AGENT_TO_GRAPH_ID[agentId] ?? agentId;
}

// Agent configuration
const AGENT_CONFIG: Record<string, { name: string }> = {
  staking: { name: "Staking Agent" },
  research: { name: "Research Agent" },
  yield: { name: "Yield Agent" },
  bridge: { name: "Bridge Agent" },
} as const;

const DEFAULT_AGENT = { name: "DeFi Agent" };

interface ChatClientProps {
  agentId: string;
  chatId: string;
}

export function ChatClient({ agentId, chatId }: ChatClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toggleRightSidebar } = useMultiSidebar();
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [isInteractingWithContent, setIsInteractingWithContent] = useState(false);
  const lastMessageCountRef = useRef(0);

  // File upload hook
  const {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    dragOver,
    handlePaste,
  } = useFileUpload();

  // Stream context from provider
  const stream = useStreamContext();
  type StreamSubmitOptions = Parameters<typeof stream.submit>[1];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = stream.isLoading || isSubmitting;

  // Cache messages to prevent content loss during streaming
  const messagesCache = useRef<Message[]>([]);
  // Cache UI to prevent UI loss during streaming
  const uiCache = useRef<any[]>([]);
  // Force re-render trigger for instant user message display
  const [, forceUpdate] = useState({});

  const messages = useMemo(() => {
    const incoming = stream.messages || [];
    const merged = mergeMessagesWithCache(messagesCache.current, incoming);
    messagesCache.current = merged;
    return merged;
  }, [stream.messages, forceUpdate]);

  const uiComponents = useMemo(() => {
    const incoming = (stream.values?.["ui"] as any[] | undefined) || [];

    // If incoming is empty and we have cache, keep cache
    if (incoming.length === 0 && uiCache.current.length > 0) {
      return uiCache.current;
    }

    // Merge incoming with cache - keep UI from both
    if (incoming.length > 0) {
      const merged = [...uiCache.current];

      incoming.forEach((newUI: any) => {
        const existingIndex = merged.findIndex((ui: any) => ui.id === newUI.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = newUI;
        } else {
          merged.push(newUI);
        }
      });

      uiCache.current = merged;
      return merged;
    }

    return uiCache.current;
  }, [stream.values]);

  // Clear isSubmitting when stream actually starts loading
  useEffect(() => {
    if (stream.isLoading) {
      setIsSubmitting(false);
    }
  }, [stream.isLoading]);

  const { hideToolCalls, setHideToolCalls, setAssistantInfo } = useChatState();
  const { address: walletAddress } = useWallet();
  // Fallback: Zustand persists wallet address synchronously from previous session.
  // The React state from useWallet() starts null on page load and is set after async kit init.
  // Using the store as fallback ensures wallet_address is always included even before kit ready.
  const effectiveWalletAddress = walletAddress ?? useWalletStore.getState().account;
  const { status: welcomeRewardStatus, openRewardPage } = useWelcomeReward();

  // Fetch assistant info for avatar
  const { mutate: searchAssistants } = useSearchAssistantsAssistantsSearchPost({
    client: kubbClient,
  });

  useEffect(() => {
    searchAssistants(
      { data: { graph_id: toGraphId(agentId) as any } },
      {
        onSuccess: (data) => {
          if (data && data.length > 0) {
            const assistant = data[0];
            if (assistant) {
              setAssistantInfo({
                assistant_id: assistant.assistant_id,
                graph_id: assistant.graph_id,
                metadata: assistant.metadata as any,
                name: assistant.name || "",
              });
            }
          }
        },
      }
    );
  }, [agentId, searchAssistants, setAssistantInfo]);

  const config = AGENT_CONFIG[agentId] || DEFAULT_AGENT;
  const chatTitle = chatId === "new" ? "New Chat" : `Chat with ${config.name}`;
  const isNewChat = messages.length === 0;

  // Check if the last AI message is complete (has content and no pending tool calls)
  const lastAiMessage = messages.filter((m) => m.type === "ai").pop();
  const hasToolCalls =
    lastAiMessage &&
    "tool_calls" in lastAiMessage &&
    Array.isArray(lastAiMessage.tool_calls) &&
    lastAiMessage.tool_calls.length > 0;
  const isAiResponseComplete =
    lastAiMessage &&
    !hasToolCalls &&
    (typeof lastAiMessage.content === "string" ? lastAiMessage.content.length > 0 : true);

  // Effective loading state - consider AI response complete as "not loading" for UI purposes
  // This helps avoid the 3-5s delay where stream.isLoading is still true after AI finishes
  const effectiveIsLoading = isLoading && !(isAiResponseComplete && firstTokenReceived);

  // Show greeting only before the first user message.
  // Let exit animation handle the transition out on first submit.
  const showGreeting = isNewChat;

  // Show suggestions when: new chat OR agent finished responding
  // Use isAiResponseComplete as a faster indicator that AI is done
  const showSuggestions = isNewChat || (!effectiveIsLoading && messages.length > 0);
  const showWelcomeRewardCard =
    Boolean(welcomeRewardStatus?.reserved) && !welcomeRewardStatus?.welcomeCardSeen;

  // Error handling
  const lastError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = stream.error && (stream.error as any).message;
      if (!message || lastError.current === message) return;
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // Track first token received for CURRENT response
  const prevMessageLength = useRef(0);
  const lastAiMessageIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (messages?.length && messages[messages.length - 1]?.type === "ai") {
      const lastAiMsg = messages[messages.length - 1];
      const messageId = lastAiMsg?.id;

      // If we have a new AI message ID (different from the last one we tracked)
      // reset firstTokenReceived so we show "Thinking..." for this new response
      if (messageId && messageId !== lastAiMessageIdRef.current) {
        lastAiMessageIdRef.current = messageId;
        setFirstTokenReceived(false);
      }

      const hasContent =
        lastAiMsg &&
        ((typeof lastAiMsg.content === "string" && lastAiMsg.content.trim().length > 0) ||
          (Array.isArray(lastAiMsg.content) && lastAiMsg.content.length > 0));

      // Only mark firstTokenReceived when CURRENT AI message actually has content
      if (hasContent && !firstTokenReceived) {
        setFirstTokenReceived(true);
      }
    }
    prevMessageLength.current = messages.length;
  }, [messages, firstTokenReceived]);

  // Auto-scroll to bottom only when new messages arrive and user hasn't scrolled up
  // and user is not interacting with scrollable content inside messages
  useEffect(() => {
    if (
      messages.length > lastMessageCountRef.current &&
      !userScrolledUp &&
      !isInteractingWithContent
    ) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, userScrolledUp, isInteractingWithContent]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);

      // Track if user manually scrolled up
      if (!isNearBottom) {
        setUserScrolledUp(true);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Detect when user is interacting with scrollable content inside messages
  // This prevents auto-scroll from interrupting user's scroll inside tool UI cards
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if hovering over a scrollable element inside messages
      const scrollableParent = target.closest(
        '[data-scrollable="true"], .overflow-y-auto, .overflow-auto'
      );
      if (scrollableParent && scrollableParent !== container) {
        setIsInteractingWithContent(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest(
        '[data-scrollable="true"], .overflow-y-auto, .overflow-auto'
      );
      if (scrollableParent && scrollableParent !== container) {
        setIsInteractingWithContent(false);
      }
    };

    // Use event delegation for better performance
    container.addEventListener("mouseenter", handleMouseEnter, true);
    container.addEventListener("mouseleave", handleMouseLeave, true);

    return () => {
      container.removeEventListener("mouseenter", handleMouseEnter, true);
      container.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, []);

  const scrollToBottom = () => {
    setUserScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || effectiveIsLoading) return;
    setFirstTokenReceived(false);
    setIsSubmitting(true);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    // Add user message to cache immediately for instant display
    messagesCache.current = [...messagesCache.current, newHumanMessage];

    // Force re-render to show user message immediately
    forceUpdate({});

    stream.submit(
      {
        messages: [...stream.messages, ...toolMessages, newHumanMessage],
        ...(effectiveWalletAddress && { wallet_address: effectiveWalletAddress }),
      },
      {
        streamMode: ["values", "custom"],
        streamSubgraphs: false,
        streamResumable: true,
        optimisticValues: (prev: any) => ({
          ...prev,
          messages: [...(prev?.messages ?? []), ...toolMessages, newHumanMessage],
        }),
      } as StreamSubmitOptions
    );

    setInput("");
    setContentBlocks([]);
    setUserScrolledUp(false); // Reset scroll state when sending new message
  };

  const handleEdit = (
    _message: Message,
    newContent: string,
    parentCheckpoint: Checkpoint | null | undefined,
    messagesBeforeCurrent: Message[]
  ) => {
    if (stream.isLoading) {
      stream.stop();
    }

    const newHumanMessage: Message = { type: "human", content: newContent };

    // Ensure no dangling tool calls in the context before the edit point.
    // If checkpoint fork works, this context isn't sent. If it falls back to append,
    // this prevents the 400 "tool_calls must be followed by tool messages" error.
    const toolCompletionMessages = ensureToolCallsHaveResponses(messagesBeforeCurrent);
    const safeMessagesBeforeCurrent = [...messagesBeforeCurrent, ...toolCompletionMessages];

    // Reset cache to only messages before the edit point + new message
    // This prevents stale messages from bleeding through mergeMessagesWithCache
    messagesCache.current = [...safeMessagesBeforeCurrent, newHumanMessage];
    uiCache.current = [];

    setFirstTokenReceived(false);
    setIsSubmitting(true);
    forceUpdate({});

    stream.submit(
      { messages: [newHumanMessage] },
      {
        // Use parentCheckpoint directly (not ?? null). The SDK treats null as "no checkpoint"
        // (same as undefined), but a valid checkpoint object triggers a branch fork.
        // After onFinish fires and history.data is refreshed, getMessagesMetadata returns
        // a valid parent_checkpoint for the fork to work correctly.
        checkpoint: parentCheckpoint ?? undefined,
        streamMode: ["values", "custom"],
        streamSubgraphs: false,
        streamResumable: true,
        optimisticValues: () => ({
          messages: [...safeMessagesBeforeCurrent, newHumanMessage],
        }),
      } as StreamSubmitOptions
    );
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined,
    parentValues?: { messages: Message[] }
  ) => {
    // Stop any current stream first
    if (stream.isLoading) {
      stream.stop();
    }

    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    setIsSubmitting(true);

    stream.submit(undefined, {
      checkpoint: parentCheckpoint || null,
      streamMode: ["values", "custom"],
      streamSubgraphs: true,
      streamResumable: true,
      optimisticValues: (prev: any) => {
        // Return parent state to immediately remove AI message from UI
        if (parentValues) {
          return parentValues;
        }
        return prev;
      },
    } as StreamSubmitOptions);
  };

  const handleSendSuggestion = (text: string) => {
    if (!text.trim() || effectiveIsLoading) return;
    setFirstTokenReceived(false);
    setIsSubmitting(true);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: text,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    // Add user message to cache immediately for instant display
    messagesCache.current = [...messagesCache.current, newHumanMessage];

    // Force re-render to show user message immediately
    forceUpdate({});

    stream.submit(
      {
        // IMPORTANT: Send ALL existing messages + tool responses + new message
        messages: [...stream.messages, ...toolMessages, newHumanMessage],
        ...(effectiveWalletAddress && { wallet_address: effectiveWalletAddress }),
      },
      {
        streamMode: ["values", "custom"],
        streamSubgraphs: false,
        streamResumable: true,
        optimisticValues: (prev: any) => ({
          ...prev,
          messages: [...(prev?.messages ?? []), ...toolMessages, newHumanMessage],
        }),
      } as StreamSubmitOptions
    );
    setUserScrolledUp(false); // Reset scroll state
  };

  const hasNoAIOrToolMessages = !messages.find((m) => m.type === "ai" || m.type === "tool");

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Background Ripple Effect - z-0 behind content */}
      {/* <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <BackgroundRippleEffect
          rows={20}
          cols={15}
          cellSize={80}
        />
      </div> */}

      {/* Header - no border */}
      <header className="relative z-10 flex shrink-0 items-center gap-3 px-4 py-3">
        <Button className="h-8 w-8 p-0" onClick={() => router.push("/agents")} variant="outline">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-foreground text-lg">{chatTitle}</span>
        <div className="ml-auto">
          <Button className="h-9 w-9 p-0" onClick={toggleRightSidebar} variant="ghost">
            <Clock className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Messages Area - Scrollable, takes remaining space */}
      <div ref={messagesContainerRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="pointer-events-none mx-auto max-w-3xl px-4 pt-6 pb-4">
          <AnimatePresence initial={false}>
            {showGreeting && <Greeting agentId={agentId} />}
          </AnimatePresence>

          {showWelcomeRewardCard && welcomeRewardStatus && (
            <div className="pointer-events-auto">
              <WelcomeRewardCard
                status={welcomeRewardStatus}
                onOpen={() => void openRewardPage()}
              />
            </div>
          )}

          <div className="pointer-events-auto flex flex-col gap-4">
            {(() => {
              // First pass: remove hidden/tool/system messages for rendering
              const visible = messages
                .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                .filter((m) => !m.id?.startsWith("__hidden__"))
                .filter((m) => m.type !== "tool" && m.type !== "system");
              // Second pass: filter intermediate AI messages.
              // Pass full `messages` (not `visible`) so shouldFilterMessage
              // can find tool result messages when deciding whether to keep
              // AI messages that have tool_calls.
              const filtered = visible.filter(
                (m, index, arr) => !shouldFilterMessage(m, index, arr, uiComponents, messages)
              );

              return filtered.map((message, index, arr) => {
                const prevMessage = index > 0 ? arr[index - 1] : undefined;
                // Check if there's a hidden human message (e.g. __hidden__tx-success-*) between
                // prevMessage and message in the unfiltered thread. If so, treat as new turn → show avatar.
                const hasHiddenHumanBetween =
                  prevMessage && message
                    ? (() => {
                        const prevIdx = messages.findIndex((m) => m.id === prevMessage.id);
                        const currIdx = messages.findIndex((m) => m.id === message.id);
                        if (prevIdx === -1 || currIdx === -1) return false;
                        return messages
                          .slice(prevIdx + 1, currIdx)
                          .some((m) => m.type === "human" && !!m.id?.startsWith("__hidden__"));
                      })()
                    : false;
                const isConsecutiveAi =
                  !hasHiddenHumanBetween &&
                  message.type !== "human" &&
                  prevMessage?.type !== "human" &&
                  !!prevMessage;

                return message.type === "human" ? (
                  <HumanMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                  />
                ) : (
                  <AssistantMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={isLoading && index === messages.length - 1}
                    handleRegenerate={handleRegenerate}
                    hideAvatar={isConsecutiveAi}
                    isNewMessageLoading={effectiveIsLoading && !firstTokenReceived}
                    cachedUI={uiComponents}
                    allMessages={messages}
                    data-testid="agent-response"
                  />
                );
              });
            })()}

            {/* Special rendering case for interrupt without messages */}
            {hasNoAIOrToolMessages && !!stream.interrupt && (
              <AssistantMessage
                key="interrupt-msg"
                message={undefined}
                isLoading={isLoading}
                handleRegenerate={handleRegenerate}
              />
            )}

            {effectiveIsLoading &&
              !firstTokenReceived &&
              (() => {
                // Check if there are any tool-status UI messages
                // If yes, don't show "Thinking..." - the tool status UI is already showing
                const hasToolStatusUI = (stream.values?.["ui"] as any[] | undefined)?.some(
                  (ui: any) => ui.name?.includes("-tool-status")
                );

                if (hasToolStatusUI) {
                  return null;
                }

                // Check if there's already an AI message being rendered
                // If yes, don't show separate "Thinking..." - it's already in the AI message
                const hasAIMessage = messages.some((m) => m.type === "ai");
                if (hasAIMessage) {
                  return null;
                }

                return <AssistantMessageLoading />;
              })()}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className={cn(
              "fixed z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg transition-colors hover:bg-accent",
              isMobile ? "right-4 bottom-32" : "right-8 bottom-28"
            )}
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Fixed Input Area at Bottom - no border */}
      <div
        className={cn(
          "pointer-events-auto relative z-10 shrink-0 px-4 py-4",
          isMobile && "pb-6" // Extra padding on mobile for safe area
        )}
      >
        <div className="mx-auto max-w-3xl">
          {/* Suggestions - show when not loading */}
          {showSuggestions && (
            <div className="mb-4">
              <SuggestedActions agentId={agentId} onSendMessage={handleSendSuggestion} />
            </div>
          )}

          {/* Input Form */}
          <div
            ref={dropRef}
            className={cn(
              "rounded-xl border bg-muted/50 transition-all",
              dragOver ? "border-2 border-primary border-dotted" : "border-border"
            )}
          >
            <form onSubmit={handleSubmit}>
              {/* Content blocks preview */}
              <ContentBlocksPreview blocks={contentBlocks} onRemove={removeBlock} />

              {/* Text input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.metaKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    const form = (e.target as HTMLElement)?.closest("form");
                    form?.requestSubmit();
                  }
                }}
                placeholder="Send a message..."
                className="max-h-[200px] min-h-[44px] w-full resize-none border-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none"
                rows={1}
              />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  {/* Upload button with label */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label
                        htmlFor="file-input"
                        className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="text-xs">Attach</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>Attach files (images, PDF)</TooltipContent>
                  </Tooltip>
                  <input
                    id="file-input"
                    type="file"
                    onChange={handleFileUpload}
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    className="hidden"
                  />

                  {/* Toggle hide tools button with label */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => setHideToolCalls(!hideToolCalls)}
                        className={cn(
                          "flex h-8 items-center gap-1.5 rounded-lg px-2 transition-colors",
                          hideToolCalls
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <Wrench className="h-4 w-4" />
                        <span className="text-xs">Tools</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {hideToolCalls ? "Show tool calls" : "Hide tool calls"}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Send/Stop button */}
                {effectiveIsLoading ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={() => stream.stop()}
                        variant="destructive"
                        className="h-8 w-8 rounded-full p-0"
                      >
                        <Square className="h-3.5 w-3.5 fill-current" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Stop generating</TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    type="submit"
                    disabled={effectiveIsLoading || (!input.trim() && contentBlocks.length === 0)}
                    className="h-8 w-8 rounded-full bg-primary p-0 text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
