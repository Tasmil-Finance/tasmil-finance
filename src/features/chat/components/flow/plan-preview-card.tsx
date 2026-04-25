"use client";

import type { Plan, SimulationReport } from "@/features/chat/types/flow-messages";

interface PlanPreviewCardProps {
  plan: Plan;
  simulationReport: SimulationReport;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

function bpsToPercent(bps: number): string {
  return (bps / 100).toFixed(1);
}

export function PlanPreviewCard({
  plan,
  simulationReport,
  onConfirm,
  onCancel,
  disabled,
}: PlanPreviewCardProps) {
  const isFailed = simulationReport.status === "fail";
  const isDisabled = disabled || isFailed;

  const failedErrors = simulationReport.steps
    .filter((s) => s.status === "fail" && s.error)
    .map((s) => s.error!);

  const asset = plan.steps[0]?.asset ?? "";

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#131715] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-[#f0f2f1]">Plan Preview</span>
        <div data-testid="weighted-apy" className="font-mono text-sm font-medium text-[#00C278]">
          {bpsToPercent(plan.weighted_apy_bps)}%
        </div>
      </div>

      {/* Allocations */}
      <div className="mb-3 space-y-1.5">
        {plan.steps.map((step) => (
          <div key={step.index} className="text-xs text-[#f0f2f1]">
            {plan.steps.length === 1 ? (
              <span>
                {step.amount} {step.asset} &rarr; {step.protocol}{" "}
                <span className="text-[#00C278]">
                  ({bpsToPercent(step.expected_apy_bps ?? 0)}%)
                </span>
              </span>
            ) : (
              <span>
                {step.amount} {step.asset} &rarr; {step.protocol} (
                {bpsToPercent(step.expected_apy_bps ?? 0)}%)
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Idle amount */}
      {plan.idle_amount != null && plan.idle_amount > 0 && (
        <div className="mb-3 text-xs text-[#9aada4]">
          {plan.idle_amount} {asset} idle
        </div>
      )}

      {/* Gas */}
      <div className="mb-3 font-mono text-xs text-[#9aada4]">
        ~{plan.total_gas_xlm.toFixed(2)} XLM
      </div>

      {/* Warnings */}
      {simulationReport.warnings.length > 0 && (
        <div className="mb-3 space-y-1">
          {simulationReport.warnings.map((warning) => (
            <div
              key={warning}
              data-testid="warning-item"
              className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-400"
            >
              {warning}
            </div>
          ))}
        </div>
      )}

      {/* Errors from failed simulation */}
      {failedErrors.length > 0 && (
        <div className="mb-3 space-y-1">
          {failedErrors.map((error) => (
            <div key={error} className="text-xs text-[#f87171]">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* CTAs */}
      <div className="flex gap-2">
        <button
          type="button"
          aria-label="Confirm & Sign"
          disabled={isDisabled}
          onClick={onConfirm}
          className="rounded-lg bg-[#00C278] px-4 py-2.5 text-sm font-medium text-[#0d0f0e] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirm &amp; Sign
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className="rounded-lg border border-white/10 bg-[#181c1a] px-4 py-2.5 text-sm font-medium text-[#9aada4]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
