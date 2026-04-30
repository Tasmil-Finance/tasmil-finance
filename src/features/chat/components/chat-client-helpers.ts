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

  const aiMsg = message as any;
  const hasToolCalls = aiMsg.tool_calls?.length > 0;
  const content = typeof aiMsg.content === 'string'
    ? aiMsg.content.trim()
    : Array.isArray(aiMsg.content)
      ? aiMsg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text?.trim()).join('')
      : '';

  // Always filter parse_user_intent-only messages — they're internal routing
  // steps with no visible UI. Keeping them in the list causes isConsecutiveAi
  // to incorrectly hide avatars on the next real AI message.
  if (hasToolCalls && !content) {
    const allAreParseIntent = aiMsg.tool_calls.every(
      (tc: any) => tc.name === 'parse_user_intent'
    );
    if (allAreParseIntent) return true;
  }

  // Filter intermediate tool-only messages, BUT keep them if a tool result
  // exists in the messages (so the ToolCallRenderer can show cards).
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

    if (hasToolResult) {
      // Even with a result, filter if this is a duplicate tool call — an earlier
      // AI message already called the same tool(s) with results.  DeepSeek
      // sometimes re-calls parse_user_intent in the same turn; the backend
      // returns _duplicate:true but both AI messages survive to the frontend.
      const myToolNames = new Set(aiMsg.tool_calls.map((tc: any) => tc.name));
      for (let i = 0; i < index; i++) {
        const earlier = allMessages[i] as any;
        if (earlier.type !== 'ai' || !earlier.tool_calls?.length) continue;
        const earlierNames = new Set(earlier.tool_calls.map((tc: any) => tc.name));
        // If all my tool names already appear in an earlier AI message, I'm a duplicate
        if ([...myToolNames].every((n) => earlierNames.has(n))) {
          // Verify the earlier message's tool calls also have results
          const earlierIds = new Set(earlier.tool_calls.map((tc: any) => tc.id).filter(Boolean));
          const earlierHasResults = searchIn.some(
            (m: any) => m.type === 'tool' && earlierIds.has(m.tool_call_id)
          );
          if (earlierHasResults) return true; // Filter — earlier message already shows this tool
        }
      }
      return false; // Keep — tool UI needs this message
    }

    // Only filter supervisor-internal tool calls (call_*_agent) without results
    const allAreSupervisorCalls = aiMsg.tool_calls.every(
      (tc: any) => tc.name?.startsWith('call_') && tc.name?.endsWith('_agent')
    );
    // Filter non-supervisor tool-only messages without results (still loading)
    return !allAreSupervisorCalls;
  }

  // Filter duplicate supervisor agent calls — when the supervisor calls the same agent
  // with the same arguments as a previous message, hide the duplicate.
  if (hasToolCalls) {
    const supervisorCalls = aiMsg.tool_calls.filter(
      (tc: any) => tc.name?.startsWith('call_') && tc.name?.endsWith('_agent')
    );
    if (supervisorCalls.length > 0 && supervisorCalls.length === aiMsg.tool_calls.length) {
      for (let i = 0; i < index; i++) {
        const prev = allMessages[i] as any;
        if (prev.type !== 'ai' || !prev.tool_calls?.length) continue;
        const isDuplicate = supervisorCalls.every((sc: any) =>
          prev.tool_calls.some(
            (pc: any) => pc.name === sc.name && JSON.stringify(pc.args) === JSON.stringify(sc.args)
          )
        );
        if (isDuplicate) return true;
      }
    }
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
