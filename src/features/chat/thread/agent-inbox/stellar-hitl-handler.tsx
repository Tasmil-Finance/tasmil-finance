"use client";

/**
 * Stellar HITL Handler
 *
 * Handles Human-in-the-Loop interrupts for ALL Stellar DeFi operations
 * (swap, bridge, vault, staking). The execute tool returns unsigned XDR
 * which the user signs with their Stellar wallet.
 *
 * Flow:
 * 1. Agent calls execute tool → HITL interrupt
 * 2. This handler renders StellarExecuteCard
 * 3. User clicks Sign → wallet signs XDR → respond callback
 * 4. Handler submits result using command.update to add tool message
 * 5. Agent receives signed XDR and calls submit_transaction
 */

import type { Interrupt } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { StellarExecuteCard } from "../../actions/components/stellar/execute-card";
import { useStreamContext } from "../../hooks";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import type { HITLRequest } from "./types";

const DO_NOT_RENDER_ID_PREFIX = "__do_not_render__";

interface StellarHITLHandlerProps {
  interrupt: Interrupt<HITLRequest>;
  operation: string;
}

interface ExecuteResult {
  success: boolean;
  hash?: string;
  error?: string;
}

function getToolCallId(messages: any[], toolName: string): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === "ai" && msg.tool_calls?.length > 0) {
      const toolCall = msg.tool_calls.find((tc: any) => tc.name === toolName);
      if (toolCall) return toolCall.id;
    }
  }
  return undefined;
}

export function StellarHITLHandler({ interrupt, operation }: StellarHITLHandlerProps) {
  const stream = useStreamContext();
  const [localResult, setLocalResult] = useState<ExecuteResult | null>(null);

  const actionRequest = interrupt.value?.action_requests?.[0];
  const toolName = actionRequest?.name ?? "";
  const toolCallId = getToolCallId(stream.messages, toolName);

  // Get the execute result (contains unsigned XDR)
  const toolMessage = stream.messages.findLast(
    (msg: any) => msg.type === "tool" && msg.name === toolName
  );

  let mcpResponse: Record<string, any> | null = null;
  if (toolMessage) {
    try {
      const content =
        typeof toolMessage.content === "string"
          ? JSON.parse(toolMessage.content)
          : toolMessage.content;
      mcpResponse = content;
    } catch {
      /* ignore */
    }
  }

  // Restore persisted result on mount
  useEffect(() => {
    if (!toolCallId || localResult) return;
    const toolResponse = stream.messages.findLast(
      (msg: any) => msg.type === "tool" && msg.tool_call_id === toolCallId
    );
    if (toolResponse) {
      try {
        const content =
          typeof toolResponse.content === "string"
            ? JSON.parse(toolResponse.content)
            : toolResponse.content;
        if (content && typeof content === "object" && "success" in content) {
          setLocalResult(content as ExecuteResult);
        }
      } catch {
        /* ignore */
      }
    }
  }, [toolCallId, stream.messages, localResult]);

  const handleRespond = useCallback(
    async (result: Record<string, unknown>) => {
      const execResult = result as unknown as ExecuteResult;
      setLocalResult(execResult);

      try {
        await stream.submit(
          {},
          {
            command: {
              update: {
                messages: [
                  {
                    type: "tool",
                    tool_call_id: toolCallId ?? uuidv4(),
                    id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
                    name: toolName,
                    content: JSON.stringify(result),
                  },
                ],
              },
              resume: {
                decisions: [{ type: execResult.success ? "approve" : "reject" }],
              },
            },
          }
        );

        if (execResult.success) {
          toast.success("Transaction signed", {
            description: "Submitting to Stellar network...",
          });
        } else {
          toast.error("Transaction failed", {
            description: execResult.error ?? "Unknown error",
          });
        }
      } catch (error) {
        console.error("[StellarHITLHandler] Error:", error);
        toast.error("Failed to submit response");
      }
    },
    [stream, toolCallId, toolName]
  );

  if (!actionRequest) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">Invalid HITL request format</p>
      </div>
    );
  }

  return (
    <StellarExecuteCard
      operation={operation}
      args={mcpResponse ?? actionRequest.args}
      result={localResult}
      status={localResult ? "complete" : "executing"}
      respond={handleRespond}
    />
  );
}
