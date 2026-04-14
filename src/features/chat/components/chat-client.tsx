"use client";

import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowLeft, Clock, Paperclip, Send, Square, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useSearchAssistantsAssistantsSearchPost } from "@/gen/hooks/use-search-assistants-assistants-search-post";
import { DO_NOT_RENDER_ID_PREFIX, ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { kubbClient } from "@/lib/kubb";
import { cn } from "@/lib/utils";
import { useWallet } from "@/shared/context/wallet-context";
import { useFileUpload } from "@/shared/hooks/use-file-upload";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { BackgroundRippleEffect } from "@/shared/ui/background-ripple-effect";
import { Button } from "@/shared/ui/button-v2";
import { useMultiSidebar } from "@/shared/ui/multi-sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { AssistantMessage, AssistantMessageLoading } from "../components/messages/ai-message";
import { HumanMessage } from "../components/messages/human-message";
import { useChatState, useStreamContext } from "../hooks";
import { ContentBlocksPreview } from "../thread/components/content-blocks-preview";
import { Greeting } from "./greeting";
import { SuggestedActions } from "./suggested-actions";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoading = stream.isLoading || isSubmitting;

  // Preserve messages to avoid flicker when submitting new message
  const [displayMessages, setDisplayMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Only update display messages if we have messages from stream
    // This prevents clearing messages during optimistic updates
    if (stream.messages && stream.messages.length > 0) {
      setDisplayMessages(stream.messages);
    }
  }, [stream.messages]);

  // Clear isSubmitting when stream actually starts loading
  useEffect(() => {
    if (stream.isLoading) {
      setIsSubmitting(false);
    }
  }, [stream.isLoading]);

  const messages = displayMessages;

  const { hideToolCalls, setHideToolCalls, setAssistantInfo } = useChatState();
  const { address: walletAddress } = useWallet();

  // Fetch assistant info for avatar
  const { mutate: searchAssistants } = useSearchAssistantsAssistantsSearchPost({
    client: kubbClient,
  });

  useEffect(() => {
    searchAssistants(
      { data: { graph_id: agentId as any } },
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

    // Optimistically add the message to display immediately
    setDisplayMessages([...stream.messages, ...toolMessages, newHumanMessage]);

    stream.submit(
      {
        // IMPORTANT: Send ALL existing messages + tool responses + new message
        // This ensures LangGraph appends instead of overwrites
        messages: [...stream.messages, ...toolMessages, newHumanMessage],
        ...(walletAddress && { wallet_address: walletAddress }),
      },
      {
        /* biome-ignore lint/suspicious/noExplicitAny */optimisticValues: (prev: any) => ({
          ...prev,
          messages: [...(prev?.messages ?? []), ...toolMessages, newHumanMessage],
        }),
      }
    );

    setInput("");
    setContentBlocks([]);
    setUserScrolledUp(false); // Reset scroll state when sending new message
  };

  const handleRegenerate = (
    _parentCheckpoint: Checkpoint | null | undefined,
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
      /* biome-ignore lint/suspicious/noExplicitAny */optimisticValues: (prev: any) => {
        // Return parent state to immediately remove AI message from UI
        if (parentValues) {
          return parentValues;
        }
        return prev;
      },
    });
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

    // Optimistically add the message to display immediately
    setDisplayMessages([...stream.messages, ...toolMessages, newHumanMessage]);

    stream.submit(
      {
        // IMPORTANT: Send ALL existing messages + tool responses + new message
        messages: [...stream.messages, ...toolMessages, newHumanMessage],
        ...(walletAddress && { wallet_address: walletAddress }),
      },
      {
        /* biome-ignore lint/suspicious/noExplicitAny */optimisticValues: (prev: any) => ({
          ...prev,
          messages: [...(prev?.messages ?? []), ...toolMessages, newHumanMessage],
        }),
      }
    );
    setUserScrolledUp(false); // Reset scroll state
  };

  const hasNoAIOrToolMessages = !messages.find((m) => m.type === "ai" || m.type === "tool");

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Background Ripple Effect - z-0 behind content */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <BackgroundRippleEffect rows={20} cols={15} cellSize={80} />
      </div>

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

          <div className="pointer-events-auto flex flex-col gap-4">
            {(() => {
              const filtered = messages
                .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
                // Filter out hidden messages (IDs starting with __hidden__)
                .filter((m) => !m.id?.startsWith("__hidden__"))
                // Filter out tool and system messages - they are not user-facing
                .filter((m) => m.type !== "tool" && m.type !== "system")
                // Filter out sub-agent intermediate AI messages that only contain tool calls
                // (e.g., discover, resolve_pool from sub-agents) with no user-facing text
                .filter((m, index, arr) => {
                  if (m.type !== "ai") return true;
                  const aiMsg = m as any;
                  const hasToolCallsOnly = aiMsg.tool_calls?.length > 0;
                  const content =
                    typeof aiMsg.content === "string"
                      ? aiMsg.content.trim()
                      : Array.isArray(aiMsg.content)
                        ? aiMsg.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text?.trim())
                            .join("")
                        : "";

                  // NEVER filter out the last AI message - it needs to render UI components
                  const isLastAiMessage = index === arr.length - 1 && m.type === "ai";
                  if (isLastAiMessage) {
                    return true;
                  }

                  // Hide AI messages that have tool calls for MCP tools (not supervisor calls) and no text
                  if (hasToolCallsOnly && !content) {
                    const allAreMcpTools =
            aiMsg.tool_calls.every(
                      (tc: any) => !tc.name?.startsWith("call_") || !tc.name?.endsWith("_agent")
                    );
                    if (allAreMcpTools) return false;
                  }
                  return true;
                });

              return filtered.map((message, index, arr) => {
                const prevMessage = index > 0 ? arr[index - 1] : undefined;
                const isConsecutiveAi =
                  message.type !== "human" && prevMessage?.type !== "human" && !!prevMessage;

                return message.type === "human" ? (
                  <HumanMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={isLoading}
                  />
                ) : (
                  <AssistantMessage
                    key={message.id || `${message.type}-${index}`}
                    message={message}
                    isLoading={isLoading && index === messages.length - 1}
                    handleRegenerate={handleRegenerate}
                    hideAvatar={isConsecutiveAi}
                    isNewMessageLoading={effectiveIsLoading && !firstTokenReceived}
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

            {effectiveIsLoading && !firstTokenReceived && <AssistantMessageLoading />}
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
