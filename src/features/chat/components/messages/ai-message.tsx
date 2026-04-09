import type { MessageContentComplex } from '@langchain/core/messages';
import { parsePartialJson } from '@langchain/core/output_parsers';
import type { AIMessage, Checkpoint, Message } from '@langchain/langgraph-sdk';
import { LoadExternalComponent } from '@langchain/langgraph-sdk/react-ui';
import Image from 'next/image';
import { Fragment } from 'react/jsx-runtime';
import { ThreadView } from '@/features/chat/thread/agent-inbox';
import { useArtifact } from '@/features/chat/thread/components/artifact';
import { MarkdownText } from '@/features/chat/thread/components/markdown-text';
import { getContentString } from '@/features/chat/lib/thread-utils';
import { isAgentInboxInterruptSchema } from '@/lib/agent-inbox-interrupt';
import { useChatState, useStreamContext } from '@/features/chat/hooks';
import ComponentMap from '@/shared/components';
import { GenericInterruptView } from './generic-interrupt';
import { BranchSwitcher, CommandBar } from './shared';
import { ToolCalls, ToolResult } from './tool-calls';

function AgentAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
      <Image
        src="/images/logo.png"
        alt="AI Assistant"
        width={32}
        height={32}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const artifact = useArtifact();
  const { values } = useStreamContext();
  // @ts-ignore - ui may not be in type definition
  const allUIForMessage = values?.ui?.filter(
    (ui: any) => ui.metadata?.message_id === message.id
  );

  // Deduplicate UI items: keep only the LATEST version of each tool call
  // Group by tool_call_id (from props.toolCallId), then keep the last one
  const customComponents = allUIForMessage?.reduce((acc: any[], ui: any) => {
    const toolCallId = ui.props?.toolCallId;
    if (!toolCallId) {
      // No toolCallId, just add it
      acc.push(ui);
      return acc;
    }

    // Find existing UI with same toolCallId
    const existingIndex = acc.findIndex(
      (item: any) => item.props?.toolCallId === toolCallId
    );

    if (existingIndex >= 0) {
      // Replace with newer version (prefer "complete" over "executing")
      const existing = acc[existingIndex];
      const existingStatus = existing?.props?.status;
      const newStatus = ui.props?.status;

      // Replace if new status is "complete" or if both have same status (keep latest)
      if (newStatus === 'complete' || existingStatus === newStatus) {
        acc[existingIndex] = ui;
      }
      // Otherwise keep existing (e.g., don't replace "complete" with "executing")
    } else {
      // New toolCallId, add it
      acc.push(ui);
    }

    return acc;
  }, []);

  if (!customComponents?.length) return null;
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

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[]
): AIMessage['tool_calls'] {
  const toolCallContents = content.filter(
    (c) => c.type === 'tool_use' && c['id']
  );

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.['input']) {
      try {
        json = parsePartialJson(toolCall['input']) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall['name'] ?? '',
      id: toolCall['id'] ?? '',
      args: json,
      type: 'tool_call',
    };
  });
}

interface InterruptProps {
  interrupt?: unknown;
  isLastMessage: boolean;
  hasNoAIOrToolMessages: boolean;
}

function Interrupt({
  interrupt,
  isLastMessage,
  hasNoAIOrToolMessages,
}: InterruptProps) {
  const fallbackValue = Array.isArray(interrupt)
    ? (interrupt as Record<string, any>[])
    : (((interrupt as { value?: unknown } | undefined)?.value ??
        interrupt) as Record<string, any>);

  return (
    <>
      {isAgentInboxInterruptSchema(interrupt) &&
        (isLastMessage || hasNoAIOrToolMessages) && (
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
}: {
  message: Message | undefined;
  isLoading: boolean;
  handleRegenerate: (
    parentCheckpoint: Checkpoint | null | undefined,
    parentValues?: { messages: Message[] }
  ) => void;
}) {
  const content = message?.content ?? [];
  const contentString = getContentString(content);
  const { hideToolCalls } = useChatState();

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages[thread.messages.length - 1]!.id === message?.id;
  const hasNoAIOrToolMessages = !thread.messages.find(
    (m) => m.type === 'ai' || m.type === 'tool'
  );
  // @ts-ignore - getMessagesMetadata may not be in type definition
  const meta = message ? thread.getMessagesMetadata?.(message) : undefined;
  const threadInterrupt = thread.interrupt;

  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;
  // To get state BEFORE AI message for regeneration, we need messages up to (but not including) current AI message
  // Find the index of current message in thread.messages and get all messages before it
  const currentMessageIndex = message
    ? thread.messages.findIndex((m) => m.id === message.id)
    : -1;
  const messagesBeforeCurrent =
    currentMessageIndex > 0
      ? thread.messages.slice(0, currentMessageIndex)
      : [];
  const parentValues =
    messagesBeforeCurrent.length > 0
      ? { messages: messagesBeforeCurrent }
      : undefined;
  const anthropicStreamedToolCalls = Array.isArray(content)
    ? parseAnthropicStreamedToolCalls(content)
    : undefined;

  const hasToolCalls =
    message &&
    'tool_calls' in message &&
    message.tool_calls &&
    message.tool_calls.length > 0;
  const toolCallsHaveContents =
    hasToolCalls &&
    message.tool_calls?.some(
      (tc) => tc.args && Object.keys(tc.args).length > 0
    );
  const hasAnthropicToolCalls = !!anthropicStreamedToolCalls?.length;
  const isToolResult = message?.type === 'tool';

  if (isToolResult && hideToolCalls) {
    return null;
  }

  return (
    <div className="group mr-auto flex w-full items-start gap-3">
      <AgentAvatar />
      <div className="flex w-full flex-col gap-2 min-w-0">
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
            {/* 1. Tool Calls (Running state) - Can be hidden */}
            {!hideToolCalls && (
              <>
                {(hasToolCalls && toolCallsHaveContents && (
                  <ToolCalls toolCalls={message.tool_calls} />
                )) ||
                  (hasAnthropicToolCalls && (
                    <ToolCalls toolCalls={anthropicStreamedToolCalls} />
                  )) ||
                  (hasToolCalls && (
                    <ToolCalls toolCalls={message.tool_calls} />
                  ))}
              </>
            )}

            {/* 2. AI Text Response */}
            {contentString.length > 0 && (
              <div className="py-1 animate-in fade-in duration-200">
                <MarkdownText>{contentString}</MarkdownText>
              </div>
            )}

            {/* 3. Custom UI Component (e.g., Staking card) - NEVER hidden by hideToolCalls */}
            {message && <CustomComponent message={message} thread={thread} />}

            <Interrupt
              interrupt={threadInterrupt}
              isLastMessage={isLastMessage}
              hasNoAIOrToolMessages={hasNoAIOrToolMessages}
            />
            {/* Only show command bar if there's text content or it's the last message */}
            {(contentString.length > 0 || isLastMessage) && (
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

export function AssistantMessageLoading() {
  return (
    <div className="mr-auto flex items-start gap-3">
      <AgentAvatar />
      <div className="bg-muted flex h-8 items-center gap-1 rounded-2xl px-4 py-2">
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_0.5s_infinite] rounded-full"></div>
        <div className="bg-foreground/50 h-1.5 w-1.5 animate-[pulse_1.5s_ease-in-out_1s_infinite] rounded-full"></div>
      </div>
    </div>
  );
}
