"use client";

import { AIReasoning } from "@/features/chat/components/ai/ai-reasoning";
import { AITask } from "@/features/chat/components/ai/ai-task";

/**
 * Dispatcher for reasoning UI messages from LangGraph.
 * LoadExternalComponent passes message.props directly to this component.
 */
export function ReasoningDispatcher({
  content,
  duration,
  isStreaming,
}: {
  content?: string;
  duration?: number;
  isStreaming?: boolean;
}) {
  return (
    <AIReasoning duration={duration} isStreaming={isStreaming ?? false}>
      {content || "Thinking..."}
    </AIReasoning>
  );
}

/**
 * Dispatcher for task UI messages from LangGraph.
 *
 * Renders the AITask component based on UI message props.
 * Props shape:
 * - title: string (task title)
 * - status: "pending" | "in_progress" | "completed" | "failed"
 * - toolName?: string (tool being executed)
 * - toolId?: string (unique tool execution ID)
 */
export function TaskDispatcher({
  props,
  meta: _meta,
}: {
  props?: {
    title?: string;
    status?: "pending" | "in_progress" | "completed" | "failed";
    toolName?: string;
    toolId?: string;
  };
  meta?: any;
}) {
  const title = props?.title || "Processing...";
  const status = props?.status || "pending";
  const toolName = props?.toolName;

  return (
    <AITask title={title} status={status} defaultOpen={status !== "pending"}>
      {toolName && (
        <div className="text-muted-foreground text-sm">
          Executing: <code>{toolName}</code>
        </div>
      )}
    </AITask>
  );
}
