"use client";

/**
 * Staking HITL Handler
 * 
 * Handles Human-in-the-Loop interrupts for staking operations.
 * 
 * Flow (following buy-stock pattern):
 * 1. Agent calls staking tool → HITL interrupt
 * 2. This handler renders StakingOperationCard
 * 3. User clicks Sign → wallet signs → onComplete callback
 * 4. Handler submits result using command.update to add tool message
 * 5. Result is persisted in messages and UI shows success/failed state
 */

import { Interrupt } from "@langchain/langgraph-sdk";
import { v4 as uuidv4 } from "uuid";
import { StakingOperationCard } from "@/features/chat/actions/components";
import { useStreamContext } from "@/providers/stream";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import type { HITLRequest } from "./types";

// Prefix for messages that should not be rendered as separate messages
const DO_NOT_RENDER_ID_PREFIX = "__do_not_render__";

interface StakingHITLHandlerProps {
  interrupt: Interrupt<HITLRequest>;
}

/**
 * Maps tool names to staking operations
 */
const TOOL_TO_OPERATION: Record<string, string> = {
  u2u_staking_delegate: "delegate",
  u2u_staking_undelegate: "undelegate",
  u2u_staking_claim_rewards: "claim_rewards",
  u2u_staking_restake_rewards: "restake_rewards",
  u2u_staking_lock_stake: "lock_stake",
};

interface StakingResult {
  success: boolean;
  hash?: string;
  error?: string;
  operation: string;
  validatorID?: string;
  amount?: string;
}

/**
 * Get tool call ID from the last AI message's tool calls
 */
function getToolCallId(messages: any[], toolName: string): string | undefined {
  // Find the last AI message with tool calls
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.type === "ai" && msg.tool_calls?.length > 0) {
      const toolCall = msg.tool_calls.find((tc: any) => tc.name === toolName);
      if (toolCall) {
        return toolCall.id;
      }
    }
  }
  return undefined;
}

export function StakingHITLHandler({ interrupt }: StakingHITLHandlerProps) {
  const stream = useStreamContext();
  const [localResult, setLocalResult] = useState<StakingResult | null>(null);

  const actionRequest = interrupt.value?.action_requests?.[0];
  const reviewConfig = interrupt.value?.review_configs?.[0];
  const toolName = actionRequest?.name || "";
  
  // Get tool call ID from messages
  const toolCallId = getToolCallId(stream.messages, toolName);

  // DEBUG: Log handler state
  console.log("[StakingHITLHandler] Render:", {
    toolName,
    toolCallId,
    localResult,
    messagesCount: stream.messages.length,
    actionRequest: actionRequest?.args,
  });

  // Check if there's already a tool response (persisted state)
  useEffect(() => {
    if (!toolCallId || localResult) return;
    
    const toolResponse = stream.messages.findLast(
      (msg: any) => msg.type === "tool" && msg.tool_call_id === toolCallId
    );
    
    if (toolResponse) {
      try {
        const content = typeof toolResponse.content === "string"
          ? JSON.parse(toolResponse.content)
          : toolResponse.content;
        
        if (content && typeof content === "object" && "success" in content) {
          setLocalResult(content as StakingResult);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [toolCallId, stream.messages, localResult]);

  // Handle completion from StakingOperationCard
  const handleComplete = useCallback(async (result: StakingResult) => {
    // Set local result immediately to show UI
    setLocalResult(result);

    console.log("[StakingHITLHandler] handleComplete called:", {
      result,
      toolCallId,
      toolName,
    });

    try {
      const submitPayload = {
        command: {
          update: {
            messages: [
              {
                type: "tool",
                tool_call_id: toolCallId || uuidv4(),
                id: `${DO_NOT_RENDER_ID_PREFIX}${uuidv4()}`,
                name: toolName,
                content: JSON.stringify(result),
              },
            ],
            // Also emit UI message with result for persistence
            ui: [
              {
                name: "staking-operation",
                props: {
                  operation: TOOL_TO_OPERATION[toolName],
                  args: actionRequest?.args || {},
                  result: result,
                  toolCallId: toolCallId,
                },
                metadata: {
                  message_id: stream.messages.findLast((m: any) => m.type === "ai")?.id,
                  operation: TOOL_TO_OPERATION[toolName],
                },
              },
            ],
          },
          // Resume the agent after updating messages
          resume: { decisions: [{ type: result.success ? "approve" : "reject" }] },
        },
      };
      
      console.log("[StakingHITLHandler] Submitting:", JSON.stringify(submitPayload, null, 2));
      
      // Submit using command.update to add tool message (like buy-stock pattern)
      // This persists the result in messages
      await stream.submit({}, submitPayload);

      console.log("[StakingHITLHandler] Submit successful");

      if (result.success) {
        toast.success("Transaction completed", {
          description: `Hash: ${result.hash?.slice(0, 10)}...`,
        });
      } else {
        toast.error("Transaction failed", {
          description: result.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("[StakingHITLHandler] Error submitting HITL response:", error);
      toast.error("Failed to submit response", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [stream, toolCallId, toolName, actionRequest]);

  if (!actionRequest || !reviewConfig) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Invalid HITL request format
        </p>
      </div>
    );
  }

  const operation = TOOL_TO_OPERATION[toolName];

  if (!operation) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          Unsupported staking operation: {toolName}
        </p>
      </div>
    );
  }

  return (
    <StakingOperationCard
      operation={operation as any}
      args={actionRequest.args}
      toolCallId={toolCallId}
      result={localResult}
      onComplete={handleComplete}
    />
  );
}
