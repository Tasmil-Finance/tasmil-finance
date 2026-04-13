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
  cachedUI,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
  filterType?: 'reasoning' | 'other' | 'tool-status';
  cachedUI?: any[];
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  
  // Use cached UI if provided, otherwise fall back to stream values
  // @ts-ignore - ui may not be in type definition
  const allUI = cachedUI || (values?.['ui'] as any[] | undefined) || [];
  
  // For tool-status UI: Show on the LATEST AI message that comes after the tool-calling message
  // This ensures tool status persists even when new AI responses appear (e.g., after rejection)
  const allUIForMessage = allUI.filter((ui: any) => {
    const uiMessageId = ui.metadata?.message_id;
    const isToolStatus = ui.name?.includes('-tool-status') || ui.metadata?.ui_type === 'tool_status';
    
    if (isToolStatus && filterType === 'tool-status') {
      // For tool-status: show on current message if it's the latest AI message after the tool-calling message
      const messages = thread.messages || [];
      const currentIdx = message ? messages.findIndex((m) => m.id === message.id) : -1;
      
      if (currentIdx === -1) return false;
      
      // Find the tool-calling message (the one with message_id matching the UI)
      const toolCallingIdx = messages.findIndex((m) => m.id === uiMessageId);
      
      if (toolCallingIdx === -1) return false;
      
      // Check if current message is after the tool-calling message
      if (currentIdx <= toolCallingIdx) return false;
      
      // Check if there's a newer AI message after current message
      const hasNewerAI = messages
        .slice(currentIdx + 1)
        .some((m) => m.type === 'ai');
      
      // Show tool status on current message if it's the latest AI message after tool call
      return !hasNewerAI;
    }
    
    // For non-tool-status UI: only show on matching message_id
    return uiMessageId === message?.id;
  });

  // Filter by type if specified
  let filteredUI = allUIForMessage;
  if (filterType === "reasoning") {
    // Only reasoning UI components
    filteredUI = allUIForMessage?.filter(
      (ui: any) => ui.name?.endsWith("-reasoning") || ui.metadata?.ui_type === "reasoning"
    );
  } else if (filterType === "tool-status") {
    // Only tool-status UI components
    filteredUI = allUIForMessage?.filter(
      (ui: any) => ui.name?.includes('-tool-status') || ui.metadata?.ui_type === 'tool_status'
    );
    
    // GLOBAL deduplication for tool-status: Only show the LATEST status across ALL messages
    // This prevents showing both "calling" and "complete" for the same tool
    if (filteredUI && filteredUI.length > 0) {
      const globalToolStatusMap = new Map<string, any>();
      
      // Get ALL tool-status UI from ALL messages (not just current message)
      // @ts-ignore
      const allToolStatusUI = values?.['ui']?.filter(
        (ui: any) => ui.name?.includes('-tool-status') || ui.metadata?.ui_type === 'tool_status'
      ) || [];
      
      // Build map of latest status for each toolCallId
      allToolStatusUI.forEach((ui: any) => {
        const toolCallId = ui.props?.toolCallId;
        if (!toolCallId) return;
        
        const existing = globalToolStatusMap.get(toolCallId);
        if (!existing) {
          globalToolStatusMap.set(toolCallId, ui);
          return;
        }
        
        // Compare priority
        const statusPriority: Record<string, number> = {
          complete: 3,
          error: 2,
          calling: 1,
        };
        
        const newPriority = statusPriority[ui.props?.status] || 0;
        const existingPriority = statusPriority[existing.props?.status] || 0;
        
        if (newPriority > existingPriority) {
          globalToolStatusMap.set(toolCallId, ui);
        }
      });
      
      // Only keep tool-status UI from current message if it's the latest globally
      filteredUI = filteredUI.filter((ui: any) => {
        const toolCallId = ui.props?.toolCallId;
        if (!toolCallId) return true;
        
        const latestGlobal = globalToolStatusMap.get(toolCallId);
        return latestGlobal?.id === ui.id;
      });
    }
  } else if (filterType === 'other') {
    // Everything except reasoning and tool-status
    filteredUI = allUIForMessage?.filter(
      (ui: any) =>
        !ui.name?.endsWith('-reasoning') && 
        ui.metadata?.ui_type !== 'reasoning' &&
        !ui.name?.includes('-tool-status') &&
        ui.metadata?.ui_type !== 'tool_status'
    );
  }

  // Deduplicate UI components by toolCallId
  // For tool-status: Only show the LATEST status (prefer complete > error > calling)
  // For other UI: Keep only the latest version
  const customComponents = filteredUI?.reduce((acc: any[], ui: any) => {
    const toolCallId = ui.props?.toolCallId;
    const uiName = ui.name;
    
    // For tool-status UI, only keep the most recent/complete status
    if (uiName?.includes('-tool-status') && toolCallId) {
      const newStatus = ui.props?.status;
      
      const existingIndex = acc.findIndex(
        (item: any) => 
          item.name?.includes('-tool-status') && 
          item.props?.toolCallId === toolCallId
      );
      
      if (existingIndex >= 0) {
        const existingStatus = acc[existingIndex]?.props?.status;
        
        // Status priority: complete > error > calling
        const statusPriority: Record<string, number> = {
          complete: 3,
          error: 2,
          calling: 1,
        };
        
        const newPriority = statusPriority[newStatus] || 0;
        const existingPriority = statusPriority[existingStatus] || 0;
        
        // Replace if new status has higher or equal priority
        if (newPriority >= existingPriority) {
          acc[existingIndex] = ui;
        }
      } else {
        // New tool call, add it
        acc.push(ui);
      }
      return acc;
    }
    
    if (!toolCallId) {
      // No toolCallId, just add it
      acc.push(ui);
      return acc;
    }

    // For non-tool-status UI with toolCallId, keep only latest
    const existingIndex = acc.findIndex(
      (item: any) => item.props?.toolCallId === toolCallId
    );

    if (existingIndex >= 0) {
      const newStatus = ui.props?.status;
      // Replace if new status is "complete" or "error"
      if (newStatus === 'complete' || newStatus === 'error') {
        acc[existingIndex] = ui;
      }
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
  cachedUI,
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

  // Check if this message has any UI components (tool-status or other)
  // Use cached UI if provided, otherwise fall back to stream values
  const allUI = cachedUI || (thread.values?.['ui'] as any[] | undefined) || [];
  
  // For tool-status UI: Show on the LATEST AI message that comes after the tool-calling message
  // This ensures tool status persists even when new AI responses appear (e.g., after rejection)
  const allUIForMessage = allUI.filter((ui: any) => {
    const uiMessageId = ui.metadata?.message_id;
    const isToolStatus = ui.name?.includes('-tool-status') || ui.metadata?.ui_type === 'tool_status';
    
    if (isToolStatus) {
      // For tool-status: show on current message if it's the latest AI message after the tool-calling message
      const messages = thread.messages || [];
      const currentIdx = message ? messages.findIndex((m) => m.id === message.id) : -1;
      
      if (currentIdx === -1) return false;
      
      // Find the tool-calling message (the one with message_id matching the UI)
      const toolCallingIdx = messages.findIndex((m) => m.id === uiMessageId);
      
      if (toolCallingIdx === -1) return false;
      
      // Check if current message is after the tool-calling message
      if (currentIdx <= toolCallingIdx) return false;
      
      // Check if there's a newer AI message after current message
      const hasNewerAI = messages
        .slice(currentIdx + 1)
        .some((m) => m.type === 'ai');
      
      // Show tool status on current message if it's the latest AI message after tool call
      return !hasNewerAI;
    }
    
    // For non-tool-status UI: only show on matching message_id
    return uiMessageId === message?.id;
  });
  
  const hasAnyUI = allUIForMessage && allUIForMessage.length > 0;
  
  // Check if has tool-status UI specifically
  const hasToolStatusUI = allUIForMessage?.some(
    (ui: any) => ui.name?.includes('-tool-status')
  );

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
            {/* Show "Thinking..." if loading and no content/UI yet */}
            {isNewMessageLoading && !hasToolStatusUI && !hasAnyUI && contentString.length === 0 && !hasReasoning && (
              <div className="flex items-center gap-2 py-1.5">
                <Loader size={16} className="text-muted-foreground" />
                <Shimmer className="font-medium text-sm" duration={2}>
                  Thinking...
                </Shimmer>
              </div>
            )}
          
            {/* 1. Reasoning UI - Show thinking/reasoning FIRST (before text) */}
            {/* 1a. Reasoning from middleware UI messages (preferred) */}
            {message && (
              <CustomComponent
                message={message}
                thread={thread}
                filterType="reasoning"
                cachedUI={cachedUI}
              />
            )}

            {/* 1b. Fallback: Reasoning extracted from message content */}
            {hasReasoning && (
              <AIReasoning isStreaming={isReasoningStreaming}>{reasoningContent}</AIReasoning>
            )}

            {/* 2. Tool Status UI - Show tool calls IMMEDIATELY when called */}
            {hasToolStatusUI && message && (
              <CustomComponent
                message={message}
                thread={thread}
                filterType="tool-status"
                cachedUI={cachedUI}
              />
            )}

            {/* 3. Custom UI Components - Show IMMEDIATELY after tool status (e.g., Staking card, blend-info) */}
            {message && (
              <CustomComponent
                message={message}
                thread={thread}
                filterType="other"
                cachedUI={cachedUI}
              />
            )}

            {/* 4. Supervisor coordination indicator (only for supervisor agent calls) */}
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

            {/* 5. AI Text Response - Show AFTER UI components */}
            {contentString.length > 0 && (
              <div className="fade-in animate-in py-1 duration-200">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            
            {/* Command bar - only show when no custom UI */}
            {!hasAnyUI && !isIntermediateAiMessage && !isLoading && !isNewMessageLoading && (contentString.length > 0 || isLastMessage) && (
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
