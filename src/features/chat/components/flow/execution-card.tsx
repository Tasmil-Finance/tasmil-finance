"use client";

import type { TxStatus } from "@/features/chat/types/flow-messages";

interface ExecutionCardProps {
  step: number;
  totalSteps: number;
  status: TxStatus;
  txHash?: string;
  description?: string;
  error?: string;
  onRetry?: () => void;
}

function truncateHash(hash: string): string {
  if (hash.length <= 8) return hash;
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}

export function ExecutionCard({
  step,
  totalSteps,
  status,
  txHash,
  description,
  error,
  onRetry,
}: ExecutionCardProps) {
  const isLastStep = step === totalSteps;
  const isDone = status === "confirmed" && isLastStep;
  const previousStepsConfirmed = step > 1;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#131715] p-4">
      {/* Previous steps confirmed */}
      {previousStepsConfirmed && (
        <div className="mb-2 text-xs text-[#9aada4]">
          Step {step - 1} confirmed.
        </div>
      )}

      {/* Current status */}
      {status === "submitting" && (
        <div className="text-xs text-[#f0f2f1]">
          Submitting step {step} of {totalSteps}: {description}...
        </div>
      )}

      {status === "confirmed" && (
        <div className="space-y-2">
          {isDone ? (
            <div className="text-sm font-medium text-[#00C278]">
              Done. Position opened.
            </div>
          ) : (
            <div className="text-xs text-[#9aada4]">
              Step {step} confirmed.
            </div>
          )}

          {txHash && (
            <div className="font-mono text-xs">
              <a
                href={`https://stellar.expert/explorer/public/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9aada4] underline hover:text-[#f0f2f1]"
              >
                {truncateHash(txHash)}
              </a>
            </div>
          )}
        </div>
      )}

      {status === "failed" && (
        <div className="space-y-2">
          {error && (
            <div className="text-xs text-[#f87171]">{error}</div>
          )}
          {onRetry && (
            <button
              type="button"
              aria-label="Try again"
              onClick={onRetry}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#f87171] hover:bg-[#f87171]/10"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
