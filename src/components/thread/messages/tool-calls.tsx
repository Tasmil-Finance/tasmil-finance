import { AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { ToolCall as ToolCallUI, ToolState } from "@/components/chat/tool-call";

export function ToolCalls({
  toolCalls,
}: {
  toolCalls: AIMessage["tool_calls"];
}) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc, idx) => {
        const args = tc.args as Record<string, unknown>;
        const hasArgs = Object.keys(args).length > 0;
        
        // Determine state based on tool call status
        const state: ToolState = hasArgs ? "input-available" : "input-streaming";
        
        return (
          <ToolCallUI
            key={tc.id || idx}
            type={tc.name || "unknown"}
            state={state}
            input={hasArgs ? args : undefined}
            defaultOpen={false}
          />
        );
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
  if (typeof parsedContent === "object" && parsedContent !== null && !Array.isArray(parsedContent)) {
    hasError = "error" in parsedContent || "Error" in parsedContent;
  } else if (typeof parsedContent === "string") {
    hasError = parsedContent.toLowerCase().includes("error");
  }

  const state: ToolState = hasError ? "output-error" : "output-available";

  // Convert to format expected by ToolCallUI
  const output = typeof parsedContent === "string" 
    ? parsedContent 
    : parsedContent as Record<string, unknown>;

  return (
    <ToolCallUI
      type={message.name || "tool-result"}
      state={state}
      output={output}
      errorText={hasError && typeof parsedContent === "string" ? parsedContent : undefined}
      defaultOpen={false}
    />
  );
}
