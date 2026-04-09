"use client";

import type { Checkpoint, Message } from "@langchain/langgraph-sdk";
import { ArrowDown, ArrowLeft, Clock, Paperclip, Send, Square, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { ContentBlocksPreview } from "../thread/components/content-blocks-preview";
import { AssistantMessage, AssistantMessageLoading } from "../components/messages/ai-message";
import { HumanMessage } from "../components/messages/human-message";
import { useSearchAssistantsAssistantsSearchPost } from "@/gen/hooks/use-search-assistants-assistants-search-post";
import { kubbClient } from "@/lib/kubb";
import { DO_NOT_RENDER_ID_PREFIX, ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { cn } from "@/lib/utils";
import { useChatState, useStreamContext } from "../hooks";
import { useWallet } from "@/shared/context/wallet-context";
import { useFileUpload } from "@/shared/hooks/use-file-upload";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { Button } from "@/shared/ui/button-v2";
import { useMultiSidebar } from "@/shared/ui/multi-sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
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
  const messages = stream.messages;
  const isLoading = stream.isLoading;
  const { hideToolCalls, setHideToolCalls, setAssistantInfo } = useChatState();
  const { address: walletAddress } = useWallet();

  // Fetch assistant info for avatar
  const { mutate: searchAssistants } = useSearchAssistantsAssistantsSearchPost({ client: kubbClient });

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
  const isNewChat = messages.length === 0 && !isLoading;

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

  // Track first token received
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1]?.type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [messages]);

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

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: [
        ...(input.trim().length > 0 ? [{ type: "text", text: input }] : []),
        ...contentBlocks,
      ] as Message["content"],
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], ...(walletAddress && { wallet_address: walletAddress }) },
      {
        // @ts-ignore - streamMode may not be in type definition
        streamMode: ["values"],
        streamSubgraphs: false,
        streamResumable: true,
        // @ts-ignore - optimisticValues may not be in type definition
        optimisticValues: (prev: any) => ({
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
    parentCheckpoint: Checkpoint | null | undefined,
    parentValues?: { messages: Message[] }
  ) => {
    // Stop any current stream first
    if (stream.isLoading) {
      stream.stop();
    }

    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);

    stream.submit(undefined, {
      // @ts-ignore - checkpoint may not be in type definition
      checkpoint: parentCheckpoint || null,
      // @ts-ignore - streamMode may not be in type definition
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
      // @ts-ignore - optimisticValues may not be in type definition
      optimisticValues: (prev: any) => {
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

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: text,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    stream.submit(
      { messages: [...toolMessages, newHumanMessage], ...(walletAddress && { wallet_address: walletAddress }) },
      {
        // @ts-ignore - streamMode may not be in type definition
        streamMode: ["values"],
        streamSubgraphs: false,
        streamResumable: true,
        // @ts-ignore - optimisticValues may not be in type definition
        optimisticValues: (prev: any) => ({
          ...prev,
          messages: [...(prev?.messages ?? []), ...toolMessages, newHumanMessage],
        }),
      }
    );
    setUserScrolledUp(false); // Reset scroll state
  };

  const hasNoAIOrToolMessages = !messages.find((m) => m.type === "ai" || m.type === "tool");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header - no border */}
      <header className="flex shrink-0 items-center gap-3 bg-background px-4 py-3">
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
      <div ref={messagesContainerRef} className="relative flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-4">
          {isNewChat && <Greeting agentId={agentId} />}

          <div className="flex flex-col gap-4">
            {messages
              .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
              // Filter out tool and system messages - they are not user-facing
              .filter((m) => m.type !== "tool" && m.type !== "system")
              // Filter out sub-agent intermediate AI messages that only contain tool calls
              // (e.g., discover, resolve_pool from sub-agents) with no user-facing text
              .filter((m) => {
                if (m.type !== "ai") return true;
                const aiMsg = m as any;
                const hasToolCallsOnly =
                  aiMsg.tool_calls?.length > 0;
                const content =
                  typeof aiMsg.content === "string"
                    ? aiMsg.content.trim()
                    : Array.isArray(aiMsg.content)
                      ? aiMsg.content
                          .filter((c: any) => c.type === "text")
                          .map((c: any) => c.text?.trim())
                          .join("")
                      : "";
                // Hide AI messages that have tool calls for MCP tools (not supervisor calls) and no text
                if (hasToolCallsOnly && !content) {
                  const allAreMcpTools = aiMsg.tool_calls.every(
                    (tc: any) =>
                      !tc.name?.startsWith("call_") ||
                      !tc.name?.endsWith("_agent")
                  );
                  if (allAreMcpTools) return false;
                }
                return true;
              })
              .map((message, index, arr) => {
                const prevMessage = index > 0 ? arr[index - 1] : undefined;
                const isConsecutiveAi =
                  message.type !== "human" &&
                  prevMessage?.type !== "human" &&
                  !!prevMessage;

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
                    isLoading={isLoading}
                    handleRegenerate={handleRegenerate}
                    hideAvatar={isConsecutiveAi}
                  />
                );
              })}

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
              "fixed z-20 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background shadow-lg hover:bg-accent transition-colors",
              isMobile ? "bottom-32 right-4" : "bottom-28 right-8"
            )}
          >
            <ArrowDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Fixed Input Area at Bottom - no border */}
      <div
        className={cn(
          "shrink-0 bg-background px-4 py-4",
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
              dragOver ? "border-primary border-2 border-dotted" : "border-border"
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
                className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[200px]"
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
                        className="flex h-8 cursor-pointer items-center gap-1.5 px-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
                          "flex h-8 items-center gap-1.5 px-2 rounded-lg transition-colors",
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
                    className="h-8 w-8 rounded-full p-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
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
