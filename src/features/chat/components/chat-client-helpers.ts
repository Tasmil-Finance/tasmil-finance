import type { Message } from '@langchain/langgraph-sdk';

export const DO_NOT_RENDER_PREFIXES = ['__do_not_render__', '__hidden__'];

export const getContentLength = (content: any): number => {
  if (typeof content === 'string') return content.length;
  if (Array.isArray(content)) return content.length;
  return 0;
};

export const shouldFilterMessage = (
  message: Message,
  index: number,
  allMessages: Message[],
  uiComponents: any[],
  fullMessages?: Message[],
): boolean => {
  // Keep non-AI messages
  if (message.type !== 'ai') return false;

  // Keep messages with UI attached
  const hasUIAttached = uiComponents.some((ui: any) => ui.metadata?.message_id === message.id);
  if (hasUIAttached) return false;

  // Keep last AI message
  const isLastAiMessage = index === allMessages.length - 1;
  if (isLastAiMessage) return false;

  // Filter intermediate tool-only messages, BUT keep them if a tool result
  // exists in the messages (so the CopilotKitToolCallRenderer can show cards).
  const aiMsg = message as any;
  const hasToolCalls = aiMsg.tool_calls?.length > 0;
  const content = typeof aiMsg.content === 'string'
    ? aiMsg.content.trim()
    : Array.isArray(aiMsg.content)
      ? aiMsg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text?.trim()).join('')
      : '';

  if (hasToolCalls && !content) {
    // Check if any tool result exists for these tool calls — if so, keep for card rendering.
    // Use fullMessages (includes tool-type messages) since allMessages has them filtered out.
    const searchIn = fullMessages ?? allMessages;
    const toolCallIds = new Set(
      aiMsg.tool_calls.map((tc: any) => tc.id).filter(Boolean)
    );
    const hasToolResult = searchIn.some(
      (m: any) => m.type === 'tool' && toolCallIds.has(m.tool_call_id)
    );

    if (hasToolResult) return false; // Keep — tool UI needs this message

    // Only filter supervisor-internal tool calls (call_*_agent) without results
    const allAreSupervisorCalls = aiMsg.tool_calls.every(
      (tc: any) => tc.name?.startsWith('call_') && tc.name?.endsWith('_agent')
    );
    // Filter non-supervisor tool-only messages without results (still loading)
    return !allAreSupervisorCalls;
  }

  return false;
};

export const mergeMessagesWithCache = (
  cached: Message[],
  incoming: Message[]
): Message[] => {
  if (!cached.length) return incoming;

  const merged = [...cached];
  incoming.forEach((newMsg) => {
    const idx = merged.findIndex((m) => m.id === newMsg.id);
    if (idx >= 0) {
      const cachedMsg = merged[idx]!;
      const newContentLength = getContentLength(newMsg.content);
      const cachedContentLength = getContentLength(cachedMsg.content);

      // Never replace non-empty content with empty content (prevents loss during new stream)
      if (newContentLength === 0 && cachedContentLength > 0) {
        return;
      }

      if (newContentLength >= cachedContentLength || cachedContentLength === 0) {
        // Preserve tool_calls from cached message if incoming message lost them.
        // AG-UI may update an AI message's content while dropping tool_calls,
        // which causes the tool UI to disappear mid-stream.
        const cachedToolCalls = (cachedMsg as any).tool_calls;
        const newToolCalls = (newMsg as any).tool_calls;
        if (cachedToolCalls?.length > 0 && (!newToolCalls || newToolCalls.length === 0)) {
          (newMsg as any).tool_calls = cachedToolCalls;
        }
        merged[idx] = newMsg;
      }
    } else {
      merged.push(newMsg);
    }
  });

  return merged;
};
