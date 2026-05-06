import type { Message } from "@langchain/langgraph-sdk";

export const DO_NOT_RENDER_PREFIXES = ["__do_not_render__", "__hidden__"];

export const getContentLength = (content: any): number => {
  if (typeof content === "string") return content.length;
  if (Array.isArray(content)) return content.length;
  return 0;
};

export const shouldFilterMessage = (
  message: Message,
  index: number,
  allMessages: Message[],
  uiComponents: any[],
  fullMessages?: Message[]
): boolean => {
  // Keep non-AI messages
  if (message.type !== "ai") return false;

  // Keep messages with UI attached
  const hasUIAttached = uiComponents.some((ui: any) => ui.metadata?.message_id === message.id);
  if (hasUIAttached) return false;

  // Keep last AI message
  const isLastAiMessage = index === allMessages.length - 1;
  if (isLastAiMessage) return false;

  const aiMsg = message as any;
  const hasToolCalls = aiMsg.tool_calls?.length > 0;
  const content =
    typeof aiMsg.content === "string"
      ? aiMsg.content.trim()
      : Array.isArray(aiMsg.content)
        ? aiMsg.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text?.trim())
            .join("")
        : "";

  // parse_user_intent is now shown as a visible step (like demo-ai)

  // Filter intermediate tool-only messages, BUT keep them if a tool result
  // exists in the messages (so the ToolCallRenderer can show cards).
  if (hasToolCalls && !content) {
    // Check if any tool result exists for these tool calls — if so, keep for card rendering.
    // Use fullMessages (includes tool-type messages) since allMessages has them filtered out.
    const searchIn = fullMessages ?? allMessages;
    const toolCallIds = new Set(aiMsg.tool_calls.map((tc: any) => tc.id).filter(Boolean));
    const hasToolResult = searchIn.some(
      (m: any) => m.type === "tool" && toolCallIds.has(m.tool_call_id)
    );

    if (hasToolResult) {
      // Even with a result, filter if this is a duplicate tool call — an earlier
      // AI message already called the same tool(s) with results.  DeepSeek
      // sometimes re-calls parse_user_intent in the same turn; the backend
      // returns _duplicate:true but both AI messages survive to the frontend.
      const myToolNames = new Set(aiMsg.tool_calls.map((tc: any) => tc.name));
      for (let i = 0; i < index; i++) {
        const earlier = allMessages[i] as any;
        if (earlier.type !== "ai" || !earlier.tool_calls?.length) continue;
        const earlierNames = new Set(earlier.tool_calls.map((tc: any) => tc.name));
        // If all my tool names already appear in an earlier AI message, I'm a duplicate
        if ([...myToolNames].every((n) => earlierNames.has(n))) {
          // Verify the earlier message's tool calls also have results
          const earlierIds = new Set(earlier.tool_calls.map((tc: any) => tc.id).filter(Boolean));
          const earlierHasResults = searchIn.some(
            (m: any) => m.type === "tool" && earlierIds.has(m.tool_call_id)
          );
          if (earlierHasResults) return true; // Filter — earlier message already shows this tool
        }
      }
      return false; // Keep — tool UI needs this message
    }

    // Only filter supervisor-internal tool calls (call_*_agent) without results
    const allAreSupervisorCalls = aiMsg.tool_calls.every(
      (tc: any) => tc.name?.startsWith("call_") && tc.name?.endsWith("_agent")
    );
    // Filter non-supervisor tool-only messages without results (still loading)
    return !allAreSupervisorCalls;
  }

  // Filter duplicate AI messages with identical tool_calls — when a graph retry
  // or double-POST creates multiple AI messages calling the same tools with the
  // same args, keep only the LAST one (which has the most recent result).
  // BUT: prefer the message that actually has tool results.  If the later
  // message has no matching tool messages (middleware stripped execution),
  // keep the earlier one that does have results instead.
  if (hasToolCalls) {
    const toolCallKey = (tc: any) => `${tc.name}:${JSON.stringify(tc.args)}`;
    const myKeys = new Set(aiMsg.tool_calls.map(toolCallKey));
    const searchIn = fullMessages ?? allMessages;
    const myToolCallIds = new Set(aiMsg.tool_calls.map((tc: any) => tc.id).filter(Boolean));
    const iHaveResults = searchIn.some(
      (m: any) => m.type === "tool" && myToolCallIds.has(m.tool_call_id)
    );

    for (let i = index + 1; i < allMessages.length; i++) {
      const later = allMessages[i] as any;
      if (later.type !== "ai" || !later.tool_calls?.length) continue;
      const laterKeys = new Set(later.tool_calls.map(toolCallKey));
      // If all my tool calls appear in a later AI message, I'm the earlier duplicate
      if ([...myKeys].every((k) => laterKeys.has(k))) {
        // But if I have tool results and the later message doesn't, keep me.
        // This can happen when middleware strips execution of the duplicate call
        // but the original AI message remains in thread state.
        const laterToolCallIds = new Set(later.tool_calls.map((tc: any) => tc.id).filter(Boolean));
        const laterHasResults = searchIn.some(
          (m: any) => m.type === "tool" && laterToolCallIds.has(m.tool_call_id)
        );
        if (iHaveResults && !laterHasResults) return false;
        return true;
      }
    }
  }

  return false;
};

export const mergeMessagesWithCache = (cached: Message[], incoming: Message[]): Message[] => {
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
        // Preserve tool_calls from cached message if incoming message lost them
        // due to AG-UI streaming (content extended but tool_calls array dropped).
        // Only do this when the new content is an extension of the cached content
        // (streaming).  When the backend middleware intentionally replaces a
        // message (e.g. stripping unexecuted tool_calls after flow_clarify),
        // the new content is completely different — in that case DONʼT restore.
        const cachedToolCalls = (cachedMsg as any).tool_calls;
        const newToolCalls = (newMsg as any).tool_calls;
        if (cachedToolCalls?.length > 0 && (!newToolCalls || newToolCalls.length === 0)) {
          const cachedContentStr =
            typeof cachedMsg.content === "string"
              ? cachedMsg.content
              : Array.isArray(cachedMsg.content)
                ? cachedMsg.content
                    .filter((c: any) => c.type === "text")
                    .map((c: any) => c.text ?? "")
                    .join("")
                : "";
          const newContentStr =
            typeof newMsg.content === "string"
              ? newMsg.content
              : Array.isArray(newMsg.content)
                ? newMsg.content
                    .filter((c: any) => c.type === "text")
                    .map((c: any) => c.text ?? "")
                    .join("")
                : "";
          // Only restore tool_calls when the new content is an extension of
          // the cached content (prefix match = streaming append).  If the
          // content was completely replaced, the backend middleware
          // intentionally stripped the tool_calls.
          if (cachedContentStr && newContentStr.startsWith(cachedContentStr)) {
            (newMsg as any).tool_calls = cachedToolCalls;
          }
        }
        merged[idx] = newMsg;
      }
    } else {
      merged.push(newMsg);
    }
  });

  return merged;
};
