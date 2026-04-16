"use client";

import type { Message } from "@langchain/langgraph-sdk";
import { useMemo } from "react";
import { ToolStatusDispatcher } from "@/shared/components/tool-status-dispatcher";
import { SupervisorAgentCallCard } from "@/features/chat/actions/components/stellar/supervisor-agent-call-card";
import {
  INFO_TOOL_RENDERERS,
  OPERATION_TOOL_RENDERERS,
  SUPERVISOR_AGENTS,
} from "@/features/chat/hooks/use-defi-tool-renderers";

interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

function getCardRenderer(toolName: string) {
  const info = INFO_TOOL_RENDERERS.find((r) => r.toolName === toolName);
  if (info) return { component: info.component, label: info.type, kind: "info" as const };

  const op = OPERATION_TOOL_RENDERERS.find((r) => r.toolName === toolName);
  if (op) return { component: op.component, label: op.operation, kind: "operation" as const };

  return null;
}

function parseResult(content: string | unknown): unknown {
  // MCP tools return content as an array of blocks: [{type:"text", text:"..."}]
  // Extract the text from the first text block before JSON parsing
  if (Array.isArray(content)) {
    const textBlock = (content as any[]).find((b) => b?.type === "text" && typeof b?.text === "string");
    if (textBlock) {
      try {
        return JSON.parse(textBlock.text);
      } catch {
        return textBlock.text;
      }
    }
    return content;
  }
  if (typeof content !== "string") return content;
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

export function CopilotKitToolCallRenderer({
  message,
  messages,
}: {
  message: Message;
  messages: Message[];
}) {
  const toolCalls: ToolCallData[] =
    message && "tool_calls" in message ? (message.tool_calls as ToolCallData[]) ?? [] : [];

  // Build map of tool_call_id -> result from subsequent tool messages
  const resultMap = useMemo(() => {
    const map = new Map<string, { content: unknown; hasError: boolean }>();
    const msgIdx = messages.findIndex((m) => m.id === message?.id);
    if (msgIdx === -1) return map;

    for (let i = msgIdx + 1; i < messages.length; i++) {
      const m = messages[i] as any;
      if (m.type === "tool" && m.tool_call_id) {
        const parsed = parseResult(m.content);
        const hasError =
          typeof parsed === "object" &&
          parsed !== null &&
          ("error" in parsed || (parsed as any).success === false);
        map.set(m.tool_call_id, { content: parsed, hasError });
      }
      if (m.type === "human" || (m.type === "ai" && i !== msgIdx)) break;
    }

    // DEBUG: log what resultMap found
    if (map.size > 0) {
      console.log("[CK-ToolRenderer] resultMap for", message?.id?.toString().slice(0, 12), ":",
        Array.from(map.entries()).map(([k, v]) => ({
          tcId: k.slice(0, 12),
          contentType: typeof v.content,
          contentLen: typeof v.content === 'string' ? v.content.length : JSON.stringify(v.content ?? '').length,
          hasData: v.content != null && v.content !== '',
        }))
      );
    }

    return map;
  }, [messages, message?.id]);

  if (toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc) => {
        const result = resultMap.get(tc.id);
        const isComplete = !!result;

        // Supervisor agent call
        if (tc.name.startsWith("call_") && tc.name.endsWith("_agent")) {
          const agentName = tc.name.replace("call_", "").replace("_agent", "");
          if (SUPERVISOR_AGENTS.includes(agentName)) {
            return (
              <SupervisorAgentCallCard
                key={tc.id}
                agent={agentName}
                message={(tc.args as Record<string, string>)?.message}
                status={isComplete ? "complete" : "calling"}
              />
            );
          }
        }

        const cardRenderer = isComplete ? getCardRenderer(tc.name) : null;
        const status = result?.hasError ? "error" : isComplete ? "complete" : "calling";

        return (
          <div key={tc.id} className="flex flex-col gap-1">
            {/* Tool status: spinner/check + "Tool Name" + chevron (old style) */}
            <ToolStatusDispatcher
              toolName={tc.name}
              args={tc.args as Record<string, any>}
              status={status as "calling" | "complete" | "error"}
              toolCallId={tc.id}
            />

            {/* Data card when tool call is complete */}
            {isComplete && cardRenderer && (
              <cardRenderer.component
                type={cardRenderer.kind === "info" ? cardRenderer.label : undefined}
                operation={cardRenderer.kind === "operation" ? cardRenderer.label : undefined}
                toolName={tc.name}
                args={tc.args}
                result={result?.content}
                status="complete"
                toolCallId={tc.id}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
