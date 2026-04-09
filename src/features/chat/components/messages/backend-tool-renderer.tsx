"use client";

/**
 * Backend Tool Renderer
 *
 * Renders UI for tool calls made by LangGraph backend agents.
 * This bridges the gap between backend tool results (JSON) and frontend UI components.
 */

import type { Message } from "@langchain/langgraph-sdk";
import { useMemo } from "react";

// Map of backend tool names to their renderers
const BACKEND_TOOL_RENDERERS: Record<
  string,
  (toolCall: any, result: any, status: "pending" | "executing" | "complete") => React.ReactNode
> = {
  // Add Stellar/keeper-wallet tool renderers here as needed
};

interface BackendToolRendererProps {
  messages: Message[];
  currentMessage: Message;
}

/**
 * Renders backend tool calls with custom UI components
 * Matches tool calls with their results from subsequent tool messages
 */
export function BackendToolRenderer({ messages, currentMessage }: BackendToolRendererProps) {
  // Only render for AI messages with tool calls
  if (
    currentMessage.type !== "ai" ||
    !("tool_calls" in currentMessage) ||
    !currentMessage.tool_calls?.length
  ) {
    return null;
  }

  const toolCalls = currentMessage.tool_calls;

  // Find the index of current message
  const currentIndex = messages.findIndex((m) => m.id === currentMessage.id);

  // Build a map of tool_call_id -> tool result
  const toolResults = useMemo(() => {
    const resultsMap = new Map<string, any>();

    // Look for tool messages after the current AI message
    for (let i = currentIndex + 1; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg) continue;

      if (msg.type === "tool" && "tool_call_id" in msg) {
        const toolCallId = (msg as any).tool_call_id as string | undefined;
        if (toolCallId && typeof toolCallId === "string") {
          const content = parseToolResult(msg.content);
          resultsMap.set(toolCallId, content);
        }
      }
    }

    return resultsMap;
  }, [messages, currentIndex]);

  return (
    <div className="flex flex-col gap-2 w-full">
      {toolCalls.map((toolCall) => {
        const toolCallId = toolCall.id;
        if (!toolCallId) return null;

        const renderer = BACKEND_TOOL_RENDERERS[toolCall.name];
        if (!renderer) return null;

        const result = toolResults.get(toolCallId);
        const status = result ? "complete" : "executing";

        return (
          <div key={toolCallId} className="w-full">
            {renderer(toolCall, result, status)}
          </div>
        );
      })}
    </div>
  );
}

// Helper to parse tool result content
function parseToolResult(content: any): any {
  if (!content) return null;

  if (Array.isArray(content)) {
    const textContent = content.find((c) => c.type === "text");
    if (textContent?.text) {
      try {
        return JSON.parse(textContent.text);
      } catch {
        return textContent.text;
      }
    }
  }

  if (typeof content === "string") {
    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  return content;
}
