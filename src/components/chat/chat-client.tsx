"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { ArrowLeft, Send, Clock, ArrowDown, Paperclip, Square, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button-v2";
import { cn } from "@/lib/utils";
import { useMultiSidebar } from "@/components/ui/multi-sidebar";
import { SuggestedActions } from "./suggested-actions";
import { Greeting } from "./greeting";
import { useStreamContext } from "@/providers/stream";
import { Message, Checkpoint } from "@langchain/langgraph-sdk";
import { AssistantMessage, AssistantMessageLoading } from "@/components/thread/messages/ai";
import { HumanMessage } from "@/components/thread/messages/human";
import { DO_NOT_RENDER_ID_PREFIX, ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";
import { toast } from "sonner";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ContentBlocksPreview } from "@/components/thread/content-blocks-preview";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { useChatState } from "@/providers/chat-state-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchAssistantsAssistantsSearchPost } from "@/gen/hooks/use-search-assistants-assistants-search-post";

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

  // Fetch assistant info for avatar
  const { mutate: searchAssistants } = useSearchAssistantsAssistantsSearchPost();
  
  useEffect(() => {
    searchAssistants({ data: { graph_id: agentId as any } }, {
      onSuccess: (data) => {
        if (data && data.length > 0) {
          const assistant = data[0];
          setAssistantInfo({
            assistant_id: assistant.assistant_id,
            graph_id: assistant.graph_id,
            metadata: assistant.metadata as any,
            name: assistant.name,
          });
        }
      }
    });
  }, [agentId, searchAssistants, setAssistantInfo]);

  const config = AGENT_CONFIG[agentId] || DEFAULT_AGENT;
  const chatTitle = chatId === "new" ? "New Chat" : `Chat with ${config.name}`;
  const isNewChat = messages.length === 0 && !isLoading;
  
  // Show suggestions when: new chat OR agent finished responding (not loading and has messages)
  const showSuggestions = isNewChat || (!isLoading && messages.length > 0);

  // Error handling
  const lastError = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) return;
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: <p><strong>Error:</strong> <code>{message}</code></p>,
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
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }
    prevMessageLength.current = messages.length;
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((input.trim().length === 0 && contentBlocks.length === 0) || isLoading) return;
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
      { messages: [...toolMessages, newHumanMessage] },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          messages: [...(prev.messages ?? []), ...toolMessages, newHumanMessage],
        }),
      }
    );

    setInput("");
    setContentBlocks([]);
  };

  const handleRegenerate = (parentCheckpoint: Checkpoint | null | undefined, parentValues?: { messages: Message[] }) => {
    // Stop any current stream first
    if (stream.isLoading) {
      stream.stop();
    }
    
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      streamSubgraphs: true,
      streamResumable: true,
      optimisticValues: (prev) => {
        // Return parent state to immediately remove AI message from UI
        if (parentValues) {
          return parentValues;
        }
        return prev;
      },
    });
  };

  const handleSendSuggestion = (text: string) => {
    if (!text.trim() || isLoading) return;
    setFirstTokenReceived(false);

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: text,
    };

    stream.submit(
      { messages: [newHumanMessage] },
      {
        streamMode: ["values"],
        streamSubgraphs: true,
        streamResumable: true,
        optimisticValues: (prev) => ({
          ...prev,
          messages: [...(prev.messages ?? []), newHumanMessage],
        }),
      }
    );
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
      <div 
        ref={messagesContainerRef}
        className="relative flex-1 overflow-y-auto"
      >
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-4">
          {isNewChat && <Greeting agentId={agentId} />}
          
          <div className="flex flex-col gap-4">
            {messages
              .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
              // Filter out tool messages - they are now shown inline with their AI message's tool calls
              .filter((m) => m.type !== "tool")
              .map((message, index) =>
                message.type === "human" ? (
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
                  />
                )
              )}

            {/* Special rendering case for interrupt without messages */}
            {hasNoAIOrToolMessages && !!stream.interrupt && (
              <AssistantMessage
                key="interrupt-msg"
                message={undefined}
                isLoading={isLoading}
                handleRegenerate={handleRegenerate}
              />
            )}

            {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
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
      <div className={cn(
        "shrink-0 bg-background px-4 py-4",
        isMobile && "pb-6" // Extra padding on mobile for safe area
      )}>
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
                  if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.nativeEvent.isComposing) {
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
                {stream.isLoading ? (
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
                    disabled={isLoading || (!input.trim() && contentBlocks.length === 0)}
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
