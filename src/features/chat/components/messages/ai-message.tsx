import type { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { Fragment } from "react/jsx-runtime";
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
import { useArtifact } from "@/features/chat/thread/components/artifact";
import { MarkdownText } from "@/features/chat/thread/components/markdown-text";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import ComponentMap from "@/shared/components";
import { Loader } from "@/shared/ui/loader";
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

function CustomComponent({
  message,
  thread,
  filterType,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
  filterType?: "reasoning" | "other";
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  const uiValues = Array.isArray((values as any)?.ui) ? ((values as any).ui as any[]) : [];

  const allUIForMessage = uiValues.filter((ui: any) => ui.metadata?.message_id === message.id);

  // Filter by type if specified
  let filteredUI = allUIForMessage;
  if (filterType === "reasoning") {
    // Only reasoning UI components
    filteredUI = allUIForMessage?.filter(
      (ui: any) => ui.name?.endsWith("-reasoning") || ui.metadata?.ui_type === "reasoning"
    );
  } else if (filterType === "other") {
    // Everything except reasoning
    filteredUI = allUIForMessage?.filter(
      (ui: any) => !ui.name?.endsWith("-reasoning") && ui.metadata?.ui_type !== "reasoning"
    );
  }

  // Deduplicate UI items: keep only the LATEST version of each tool call
  // Group by tool_call_id (from props.toolCallId), then keep the last one
  const customComponents = filteredUI?.reduce((acc: any[], ui: any) => {
    const toolCallId = ui.props?.toolCallId;
    if (!toolCallId) {
      // No toolCallId, just add it
      acc.push(ui);
      return acc;
    }

    // Find existing UI with same toolCallId
    const existingIndex = acc.findIndex((item: any) => item.props?.toolCallId === toolCallId);

    if (existingIndex >= 0) {
      // Replace with newer version (prefer "complete" over "executing")
      const existing = acc[existingIndex];
      const existingStatus = existing?.props?.status;
      const newStatus = ui.props?.status;

      // Replace if new status is "complete" or if both have same status (keep latest)
      if (newStatus === "complete" || existingStatus === newStatus) {
        acc[existingIndex] = ui;
      }
      // Otherwise keep existing (e.g., don't replace "complete" with "executing")
    } else {
      // New toolCallId, add it
      acc.push(ui);
    }

    return acc;
  }, []);

  if (!customComponents?.length) {
    return null;
  }

  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent: any) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent, artifact }}
          components={ComponentMap as any}
        />
      ))}
    </Fragment>
  );
}

interface InterruptProps {
  interrupt?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({ interrupt, isLastMessage, hasNoAIOrToolMessages }: InterruptProps) {
  const fallbackValue = Array.isArray(interrupt)
    ? (interrupt as Record<string, any>[])
    : (((interrupt as { value?: unknown } | undefined)?.value ?? interrupt) as Record<string, any>);

  return (
    <>
      {isAgentInboxInterruptSchema(interrupt) && (isLastMessage || hasNoAIOrToolMessages) && (
        <ThreadView interrupt={interrupt} />
      )}
      {interrupt &&
      !isAgentInboxInterruptSchema(interrupt) &&
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
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (
    parentCheckpoint: Checkpoint | null | undefined,
    parentValues?: { messages: Message[] }
  ) => void;
  hideAvatar?: boolean;
  isNewMessageLoading?: boolean;
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

  return (
    <div className="group mr-auto flex w-full items-start gap-3">
      {hideAvatar ? <div className="w-8 shrink-0" /> : <AgentAvatar />}
      <div className="flex w-full min-w-0 flex-col gap-2">
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
            {/* 1. Reasoning UI - Show thinking/reasoning FIRST (before text) */}
            {/* 1a. Reasoning from middleware UI messages (preferred) */}
            {message && (
              <CustomComponent message={message} thread={thread} filterType="reasoning" />
            )}

            {/* 1b. Fallback: Reasoning extracted from message content */}
            {hasReasoning && (
              <AIReasoning isStreaming={isReasoningStreaming}>{reasoningContent}</AIReasoning>
            )}

            {/* 2a. Supervisor coordination indicator */}
            {isSupervisorDelegating && (
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

            {/* 2b. Regular Tool Calls (non-supervisor) — Hidden, replaced by custom UI */}
            {/* Tool calls are now shown via custom UI components like "Using Info Agent" */}

            {/* 3. AI Text Response */}
            {contentString.length > 0 && (
              <div className="fade-in animate-in py-1 duration-200">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {/* 4. Custom UI Components (e.g., "Using Yield Agent", Staking card) */}
            {message && <CustomComponent message={message} thread={thread} filterType="other" />}

            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />

            {/* Check if message has custom UI components */}
            {(() => {
              // @ts-expect-error - ui may not be in type definition
              const allUIForMessage = thread.values?.ui?.filter(
                (ui: any) => ui.metadata?.message_id === message?.id
              );
              const hasCustomUI = allUIForMessage && allUIForMessage.length > 0;

              // Only show command bar if:
              // - No custom UI
              // - Not intermediate AI message
              // - Not loading
              // - No new message is loading (hide command bar when new message is being generated)
              return (
                !hasCustomUI &&
                !isIntermediateAiMessage &&
                !isLoading &&
                !isNewMessageLoading &&
                (contentString.length > 0 || isLastMessage) && (
                  <div className="mr-auto flex items-center gap-2">
                    <BranchSwitcher
                      branch={meta?.branch}
                      branchOptions={meta?.branchOptions}
                      // @ts-expect-error - setBranch may not be in type definition
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
                )
              );
            })()}
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
