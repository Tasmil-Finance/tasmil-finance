import type { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { AgentAvatar } from "@/features/chat/components/agent-avatar";
import { AIReasoning, Shimmer } from "@/features/chat/components/ai";
import { useChatState, useStreamContext } from "@/features/chat/hooks";
import {
  extractIncompleteReasoningContent,
  extractReasoningContent,
  getContentString,
  hasIncompleteReasoningTags,
  stripReasoningSections,
} from "@/features/chat/lib/thread-utils";
import { ThreadView } from "@/features/chat/thread/agent-inbox";
import { MarkdownText } from "@/features/chat/thread/components/markdown-text";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { Loader } from "@/shared/ui/loader";
import { CopilotKitToolCallRenderer } from "./copilotkit-tool-renderer";
import { GenericInterruptView } from "./generic-interrupt";
import { BranchSwitcher, CommandBar } from "./shared";
import { ToolResult } from "./tool-calls";

/** Check if a tool call is a supervisor-to-agent delegation */
function isSupervisorAgentCall(name: string): boolean {
  return name.startsWith("call_") && name.endsWith("_agent");
}

/** Check if any tool calls are supervisor agent delegations */
function hasSupervisorAgentCalls(toolCalls: AIMessage["tool_calls"] | undefined): boolean {
  if (!toolCalls) return false;
  return toolCalls.some((tc) => isSupervisorAgentCall(tc.name || ""));
}


interface InterruptProps {
  interrupt?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

/** Returns true for bare LangGraph internal breakpoint interrupts that have no user-facing value */
function isInternalBreakpoint(interrupt: unknown): boolean {
  if (!interrupt || typeof interrupt !== "object") return false;
  const obj = interrupt as Record<string, any>;
  // LangGraph emits { when: "breakpoint" } or [{ when: "breakpoint" }] for node breakpoints
  if (obj.when === "breakpoint") return true;
  if (Array.isArray(interrupt)) {
    return (interrupt as any[]).every((item) => item?.when === "breakpoint");
  }
  return false;
}

function Interrupt({ interrupt, isLastMessage, hasNoAIOrToolMessages }: InterruptProps) {
  const fallbackValue = Array.isArray(interrupt)
    ? (interrupt as Record<string, any>[])
    : (((interrupt as { value?: unknown } | undefined)?.value ?? interrupt) as Record<string, any>);

  if (!interrupt || isInternalBreakpoint(interrupt)) return null;

  return (
    <>
      {isAgentInboxInterruptSchema(interrupt) && (isLastMessage || hasNoAIOrToolMessages) && (
        <ThreadView interrupt={interrupt} />
      )}
      {!isAgentInboxInterruptSchema(interrupt) &&
      (isLastMessage || hasNoAIOrToolMessages) ? (
        <GenericInterruptView interrupt={fallbackValue} />
      ) : null}
    </>
  );
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
  hideAvatar = false,
  isNewMessageLoading = false,
  cachedUI: _cachedUI,
  allMessages,
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (
    parentCheckpoint: Checkpoint | null | undefined,
    parentValues?: { messages: Message[] }
  ) => void;
  hideAvatar?: boolean;
  isNewMessageLoading?: boolean;
  cachedUI?: any[];
  /** Merged/cached messages from chat-client — prevents flash when stream restarts */
  allMessages?: Message[];
}) {
  const content = message?.content ?? [];
  const rawContentString = getContentString(content);
  // Strip reasoning sections - they're displayed separately in AIReasoning component
  const contentString = stripReasoningSections(rawContentString);
  const { hideToolCalls } = useChatState();

  // Extract reasoning content directly from the raw message content
  // This handles both complete and incomplete (streaming) reasoning blocks
  const isReasoningStreaming = hasIncompleteReasoningTags(rawContentString);
  const reasoningContent = isReasoningStreaming
    ? extractIncompleteReasoningContent(rawContentString)
    : extractReasoningContent(rawContentString);
  const hasReasoning = !!reasoningContent;

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages.length > 0 && thread.messages[thread.messages.length - 1]?.id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find((m) => m.type === "ai" || m.type === "tool");
  // Check if next non-tool message is also an AI message (i.e. this is an intermediate message)
  const currentIdx = message ? thread.messages.findIndex((m) => m.id === message.id) : -1;
  const nextVisibleMessage =
    currentIdx >= 0
      ? thread.messages.slice(currentIdx + 1).find((m) => m.type !== "tool")
      : undefined;
  const isIntermediateAiMessage = !isLastMessage && nextVisibleMessage?.type === "ai";
  // @ts-expect-error - getMessagesMetadata may not be in type definition
  const meta = message ? thread.getMessagesMetadata?.(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  // To get state BEFORE AI message for regeneration, we need messages up to (but not including) current AI message
  // Find the index of current message in thread.messages and get all messages before it
  const currentMessageIndex = message ? thread.messages.findIndex((m) => m.id === message.id) : -1;
  const messagesBeforeCurrent =
    currentMessageIndex > 0 ? thread.messages.slice(0, currentMessageIndex) : [];
  const parentValues =
    messagesBeforeCurrent.length > 0 ? { messages: messagesBeforeCurrent } : undefined;
  const allToolCalls = message && "tool_calls" in message ? message.tool_calls : undefined;

  // Separate supervisor agent calls from regular tool calls
  const isSupervisorDelegating = hasSupervisorAgentCalls(allToolCalls);
  const isToolResult = message?.type === "tool";

  if (isToolResult && hideToolCalls) {
    return null;
  }

  // Hide AI messages that ONLY contain parse_user_intent (internal routing step)
  // These produce no visible UI and would show an orphaned avatar
  const onlyHasHiddenTools =
    allToolCalls &&
    allToolCalls.length > 0 &&
    allToolCalls.every((tc) => tc.name === "parse_user_intent") &&
    contentString.length === 0;
  if (onlyHasHiddenTools && !isLoading) {
    return null;
  }

  // Whether this message has tool calls that produce UI
  const hasToolCalls = !!(allToolCalls && allToolCalls.length > 0);

  return (
    <div className="group mr-auto flex w-full items-start gap-3 overflow-hidden">
      <div className="w-10 shrink-0">{!hideAvatar && <AgentAvatar />}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {isToolResult ? (
          <>
            <ToolResult message={message} />
            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
          </>
        ) : (
          <>
            {/* Show "Thinking..." if loading and no content/tool calls yet */}
            {isNewMessageLoading && !hasToolCalls && contentString.length === 0 && !hasReasoning && (() => {
              // Don't show "Thinking..." if an earlier AI message in this turn already has tool calls
              const prevHasToolCalls = currentIdx > 0 && thread.messages
                .slice(0, currentIdx)
                .some((m) => m.type === "ai" && "tool_calls" in m && (m as any).tool_calls?.length > 0);
              return !prevHasToolCalls;
            })() && (
              <div className="flex items-center gap-2 py-1.5">
                <Loader size={16} className="text-muted-foreground" />
                <Shimmer className="font-medium text-sm" duration={2}>
                  Thinking...
                </Shimmer>
              </div>
            )}

            {/* 1. Reasoning extracted from message content */}
            {hasReasoning && (
              <AIReasoning isStreaming={isReasoningStreaming}>{reasoningContent}</AIReasoning>
            )}

            {/* 2. AI Text Response - Show BEFORE tool calls (text streams first, then tool is called) */}
            {contentString.length > 0 && (
              <div className="fade-in animate-in py-1 duration-200">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {/* 3. Tool calls: status indicator + data cards (frontend-driven, no backend UI state needed) */}
            {hasToolCalls && message && (
              <CopilotKitToolCallRenderer
                message={message}
                messages={allMessages ?? thread.messages}
              />
            )}

            {/* 4. Supervisor coordination indicator (only for supervisor agent calls without sub-cards) */}
            {isSupervisorDelegating && !hasToolCalls && (
              <div className="flex items-center gap-2 py-1.5 text-sm">
                <svg
                  className="h-4 w-4 text-muted-foreground"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 2l1.5 3.5L13 7l-3.5 1.5L8 12l-1.5-3.5L3 7l3.5-1.5L8 2z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-medium text-muted-foreground text-sm">
                  Coordinated agents
                </span>
              </div>
            )}

            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />

            {/* Command bar */}
            {!hasToolCalls && !isIntermediateAiMessage && !isLoading && !isNewMessageLoading && (contentString.length > 0 || isLastMessage) && (
              <div className="mr-auto flex items-center gap-2">
                <BranchSwitcher
                  branch={meta?.branch}
                  branchOptions={meta?.branchOptions}
                  // @ts-ignore - setBranch may not be in type definition
                  onSelect={(branch) => thread.setBranch?.(branch)}
                  isLoading={isLoading}
                />
                <CommandBar
                  content={contentString}
                  isLoading={isLoading}
                  isAiMessage={true}
                  handleRegenerate={() =>
                    handleRegenerate(
                      parentCheckpoint,
                      parentValues as { messages: Message[] } | undefined
                    )
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading({ hideAvatar = false }: { hideAvatar?: boolean }) {
  return (
    <div className="mr-auto flex items-start gap-3">
      {!hideAvatar && <AgentAvatar />}
      <div className="flex items-center gap-2 py-1.5">
        <Loader size={16} className="text-muted-foreground" />
        <Shimmer className="font-medium text-sm" duration={2}>
          Thinking...
        </Shimmer>
      </div>
    </div>
  );
}
