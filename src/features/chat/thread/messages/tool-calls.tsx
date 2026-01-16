import type { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { ToolCall as ToolCallUI, type ToolState } from "@/features/chat/components/tool-call";
import { useStreamContext } from "@/providers/stream";

export function ToolCalls({ toolCalls }: { toolCalls: AIMessage["tool_calls"] }) {
  const { messages } = useStreamContext();

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, unknown>;
        const hasArgs = Object.keys(args).length > 0;

        // Find corresponding tool result message
        const toolResult = messages.find(
          (m) => m.type === "tool" && (m as ToolMessage).tool_call_id === tc.id
        ) as ToolMessage | undefined;

        // Determine state: Running → Completed (but only show input params)
        let state: ToolState;

        if (toolResult) {
          // Check if error
          let hasError = false;
          try {
            const content =
              typeof toolResult.content === "string"
                ? JSON.parse(toolResult.content)
                : toolResult.content;
            hasError =
              typeof content === "object" && content !== null
                ? "error" in content || content.success === false
                : false;
          } catch {
            // ignore
          }
          state = hasError ? "output-error" : "output-available";
        } else {
          state = hasArgs ? "input-available" : "input-streaming";
        }

        const toolCallProps: any = {
          key: tc.id || idx,
          type: tc.name || "unknown",
          state: state,
          defaultOpen: false,
        };

        if (hasArgs) {
          toolCallProps.input = args;
        }

        return <ToolCallUI {...toolCallProps} />;
      })}
    </div>
  );
}

export function ToolResult({ message }: { message: ToolMessage }) {
  let parsedContent: Record<string, unknown> | string | unknown[];
  let hasError = false;

  try {
    if (typeof message.content === "string") {
      parsedContent = JSON.parse(message.content);
    } else if (Array.isArray(message.content)) {
      parsedContent = message.content;
    } else {
      parsedContent = String(message.content);
    }
  } catch {
    // Content is not JSON, use as string
    parsedContent = String(message.content);
  }

  // Check if content indicates an error
  if (
    typeof parsedContent === "object" &&
    parsedContent !== null &&
    !Array.isArray(parsedContent)
  ) {
    hasError = "error" in parsedContent || "Error" in parsedContent;
  } else if (typeof parsedContent === "string") {
    hasError = parsedContent.toLowerCase().includes("error");
  }

  const state: ToolState = hasError ? "output-error" : "output-available";

  // Convert to format expected by ToolCallUI
  const output =
    typeof parsedContent === "string" ? parsedContent : (parsedContent as Record<string, unknown>);

  const toolResultProps: any = {
    type: message.name || "tool-result",
    state: state,
    output: output,
    defaultOpen: false,
  };

  if (hasError && typeof parsedContent === "string") {
    toolResultProps.errorText = parsedContent;
  }

  return <ToolCallUI {...toolResultProps} />;
}
