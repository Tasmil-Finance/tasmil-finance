"use client";

import type { AssistantFlowMessage } from "@/features/chat/types/flow-messages";
import { ClarifyCard } from "./clarify-card";
import { ExecutionCard } from "./execution-card";
import { PlanPreviewCard } from "./plan-preview-card";

interface FlowMessageRouterProps {
  message: AssistantFlowMessage;
  onSubmit?: (answers: Record<string, unknown>) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
}

function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(1);
}

export function FlowMessageRouter({
  message,
  onSubmit,
  onConfirm,
  onCancel,
  onRetry,
}: FlowMessageRouterProps) {
  switch (message.kind) {
    case "text":
      return <p className="text-sm text-[#f0f2f1]">{message.text}</p>;

    case "clarify":
      return (
        <ClarifyCard
          questions={message.questions}
          onSubmit={onSubmit ?? (() => {})}
        />
      );

    case "plan_preview":
      return (
        <PlanPreviewCard
          plan={message.plan}
          simulationReport={message.simulation_report}
          onConfirm={onConfirm ?? (() => {})}
          onCancel={onCancel ?? (() => {})}
        />
      );

    case "execution_update":
      return (
        <ExecutionCard
          step={message.step}
          totalSteps={message.total_steps}
          status={message.status}
          txHash={message.tx_hash}
          onRetry={onRetry}
        />
      );

    case "position_update":
      return (
        <div className="rounded-xl border border-white/[0.07] bg-[#131715] p-4">
          <span className="mb-3 block text-sm font-medium text-[#f0f2f1]">
            Position Update
          </span>
          <div className="space-y-2">
            {message.positions.map((pos) => (
              <div
                key={pos.tx_hash}
                className="rounded-lg border border-white/[0.07] bg-[#181c1a] px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#f0f2f1]">
                    {pos.deposit} &rarr; {pos.venue}
                  </span>
                  <span className="font-mono text-xs text-[#00C278]">
                    {bpsToPercent(pos.apy_bps)}%
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-[#9aada4]">{pos.protocol}</span>
                  <span className="font-mono text-xs text-[#5e736a]">{pos.tx_hash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "error":
      return (
        <div className="rounded-xl border border-red-500/20 bg-[#131715] p-4">
          <div className="font-mono text-xs text-[#5e736a]">{message.code}</div>
          <div className="mt-1 text-sm text-[#f87171]">{message.message}</div>
          {message.retry_possible && onRetry && (
            <button
              type="button"
              aria-label="Retry"
              onClick={onRetry}
              className="mt-3 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-[#f87171]"
            >
              Retry
            </button>
          )}
        </div>
      );

    default:
      return null;
  }
}
