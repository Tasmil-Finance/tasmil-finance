"use client";

import type { Message } from "@langchain/langgraph-sdk";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { SupervisorAgentCallCard } from "@/features/chat/actions/components/stellar/supervisor-agent-call-card";
import { useStreamContext } from "@/features/chat/hooks";
import {
  BLEND_SHARED_INFO,
  BLEND_SHARED_OPERATIONS,
  FLOW_TOOL_RENDERERS,
  INFO_TOOL_RENDERERS,
  OPERATION_TOOL_RENDERERS,
  SUPERVISOR_AGENTS,
} from "@/features/chat/hooks/use-defi-tool-renderers";
import { ToolStatusDispatcher } from "@/shared/components/tool-status-dispatcher";

interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

type SharedRenderProps = {
  status: "inProgress" | "executing" | "complete";
  args: Record<string, unknown>;
  result: unknown;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
};

type CardRendererResult =
  | { kind: "info"; component: React.ComponentType<any>; label: string }
  | { kind: "operation"; component: React.ComponentType<any>; label: string }
  | { kind: "shared"; render: (props: SharedRenderProps) => React.ReactElement }
  | { kind: "shared-op"; render: (props: SharedRenderProps) => React.ReactElement }
  | null;

function getCardRenderer(toolName: string): CardRendererResult {
  // Check shared Blend cards first (they have custom render functions with normalizers)
  const sharedInfo = BLEND_SHARED_INFO.find((r) => r.toolName === toolName);
  if (sharedInfo) return { kind: "shared", render: sharedInfo.render };

  // Blend operations — tagged as "shared-op" so we can inject respond callback
  const sharedOp = BLEND_SHARED_OPERATIONS.find((r) => r.toolName === toolName);
  if (sharedOp) return { kind: "shared-op", render: sharedOp.render };

  // Check flow tool renderers — "shared" kind (no BlendOpWithRespond wrapper)
  const flowTool = FLOW_TOOL_RENDERERS.find((r) => r.toolName === toolName);
  if (flowTool) return { kind: "shared", render: flowTool.render };

  // Generic info/operation cards
  const info = INFO_TOOL_RENDERERS.find((r) => r.toolName === toolName);
  if (info) return { component: info.component, label: info.type, kind: "info" };

  const op = OPERATION_TOOL_RENDERERS.find((r) => r.toolName === toolName);
  if (op) return { component: op.component, label: op.operation, kind: "operation" };

  return null;
}

function parseResult(content: string | unknown): unknown {
  // MCP tools return content as an array of blocks: [{type:"text", text:"..."}]
  // Extract the text from the first text block before JSON parsing
  if (Array.isArray(content)) {
    const textBlock = (content as any[]).find(
      (b) => b?.type === "text" && typeof b?.text === "string"
    );
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

// Module-level guard: prevents duplicate respond submissions across remounts
const respondedToolCalls = new Set<string>();

/**
 * Wrapper that injects a stream-based `respond` callback into shared
 * operation/flow cards rendered from message history.
 *
 * Two paths:
 * - **Interrupted graph** (HITL): resumes the interrupt with approve/reject.
 * - **Completed tool call** (no interrupt): sends a human message so the
 *   agent starts a new turn and can acknowledge the cancel/confirm.
 */
function BlendOpWithRespond({
  toolCallId,
  toolName,
  renderProps,
  renderFn,
}: {
  toolCallId: string;
  toolName: string;
  renderProps: SharedRenderProps;
  renderFn: (props: SharedRenderProps) => React.ReactElement;
}) {
  const stream = useStreamContext();

  const respond = useCallback(
    async (result: Record<string, unknown>) => {
      if (respondedToolCalls.has(toolCallId)) return;
      respondedToolCalls.add(toolCallId);
      const success = Boolean(result.success);
      try {
        // Check if the graph is currently interrupted — if so, resume via
        // HITL command. Otherwise the tool call already completed and there
        // is nothing to resume; send a human message instead so the agent
        // starts a new turn.
        if (stream.interrupt) {
          await stream.submit(
            {},
            {
              command: {
                update: {
                  messages: [
                    {
                      type: "tool",
                      tool_call_id: toolCallId,
                      id: `__do_not_render__${uuidv4()}`,
                      name: toolName,
                      content: JSON.stringify(result),
                    },
                  ],
                },
                resume: {
                  decisions: [{ type: success ? "approve" : "reject" }],
                },
              },
            }
          );
        } else {
          // No interrupt — send as a human message (same pattern as flow cards)
          const msg = success
            ? `Transaction confirmed for ${toolName}`
            : result.reason
              ? String(result.reason)
              : "I want to cancel this transaction";
          await stream.submit({
            messages: [
              {
                type: "human" as const,
                content: msg,
                id: `__hidden__respond-${uuidv4()}`,
              },
            ],
          });
        }

        if (!success) {
          toast.info("Transaction cancelled");
        }
      } catch (error) {
        console.error("[BlendOpWithRespond] Error resuming graph:", error);
      }
    },
    [stream, toolCallId, toolName]
  );

  // Pass respond through renderProps so the card receives it
  return renderFn({ ...renderProps, respond });
}

export function CopilotKitToolCallRenderer({
  message,
  messages,
}: {
  message: Message;
  messages: Message[];
}) {
  const toolCalls: ToolCallData[] =
    message && "tool_calls" in message ? ((message.tool_calls as ToolCallData[]) ?? []) : [];

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
      // Keep scanning across AI follow-up messages because HITL updates
      // (approve/reject/cancel tool payloads) can arrive later in the same turn.
      if (m.type === "human") break;
    }

    return map;
  }, [messages, message?.id]);

  // Build set of supervisor agent calls that already appeared in earlier messages
  // so we can skip rendering duplicates (e.g. supervisor retrying the same agent).
  const duplicateSupervisorCalls = useMemo(() => {
    const dupes = new Set<string>();
    const msgIdx = messages.findIndex((m) => m.id === message?.id);
    if (msgIdx <= 0) return dupes;

    for (const tc of toolCalls) {
      if (!tc.name.startsWith("call_") || !tc.name.endsWith("_agent")) continue;
      const argsKey = JSON.stringify(tc.args);
      for (let i = 0; i < msgIdx; i++) {
        const prev = messages[i] as any;
        if (prev.type !== "ai" || !prev.tool_calls?.length) continue;
        const hasSameCall = prev.tool_calls.some(
          (pc: any) => pc.name === tc.name && JSON.stringify(pc.args) === argsKey
        );
        if (hasSameCall) {
          dupes.add(tc.id);
          break;
        }
      }
    }
    return dupes;
  }, [messages, message?.id, toolCalls]);

  if (toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc) => {
        const result = resultMap.get(tc.id);
        const isComplete = !!result;

        // Supervisor agent call
        if (tc.name.startsWith("call_") && tc.name.endsWith("_agent")) {
          // Skip duplicate supervisor calls that already appeared in earlier messages
          if (duplicateSupervisorCalls.has(tc.id)) return null;

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

        // Hide parse_user_intent entirely — it's an internal routing step
        if (tc.name === "parse_user_intent" && isComplete) {
          return null;
        }

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
            {isComplete &&
              cardRenderer &&
              (cardRenderer.kind === "shared-op" ? (
                <div className="max-w-[360px]">
                  <BlendOpWithRespond
                    toolCallId={tc.id}
                    toolName={tc.name}
                    renderProps={{
                      status: "complete",
                      args: tc.args as Record<string, unknown>,
                      result: result?.content,
                      toolCallId: tc.id,
                    }}
                    renderFn={cardRenderer.render}
                  />
                </div>
              ) : cardRenderer.kind === "shared" ? (
                <div className="max-w-[360px]">
                  <BlendOpWithRespond
                    toolCallId={tc.id}
                    toolName={tc.name}
                    renderProps={{
                      status: "complete",
                      args: tc.args as Record<string, unknown>,
                      result: result?.content,
                      toolCallId: tc.id,
                    }}
                    renderFn={cardRenderer.render}
                  />
                </div>
              ) : (
                <cardRenderer.component
                  type={cardRenderer.kind === "info" ? cardRenderer.label : undefined}
                  operation={cardRenderer.kind === "operation" ? cardRenderer.label : undefined}
                  toolName={tc.name}
                  args={tc.args}
                  result={result?.content}
                  status="complete"
                  toolCallId={tc.id}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
