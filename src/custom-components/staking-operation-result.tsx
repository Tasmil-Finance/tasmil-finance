"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Coins,
} from "lucide-react";
import { StakingOperation } from "./staking-operation";

interface StakingOperationResultProps {
  result: any;
  toolType: string;
  toolCallId?: string;
  onTransactionSuccess?: (
    hash: string,
    operation: string,
    toolCallId?: string
  ) => void;
}

const ErrorResult = ({ error }: { error: string }) => (
  <div className="rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/5 via-destructive/10 to-destructive/5 p-5 shadow-sm">
    <div className="flex flex-row items-start gap-4">
      <div className="flex items-center justify-center mt-0.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 ring-2 ring-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </span>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-destructive text-base font-semibold">
            Transaction Failed
          </span>
        </div>
        <p className="text-destructive/90 text-sm leading-relaxed break-words">
          {error || "An unknown error occurred. Please try again."}
        </p>
        <div className="mt-2 pt-3 border-t border-destructive/20">
          <p className="text-destructive/70 text-xs flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3" />
            <span>Please check your wallet connection and try again</span>
          </p>
        </div>
      </div>
    </div>
  </div>
);

const TransactionCompletedResult = ({ result }: { result: any }) => {
  const truncatedHash = result.hash 
    ? `${result.hash.slice(0, 6)}...${result.hash.slice(-4)}`
    : "N/A";
  const explorerUrl = result.hash ? `https://u2uscan.xyz/tx/${result.hash}` : "#";

  return (
    <div className="rounded-lg bg-card/40 border p-6 shadow-sm w-full">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Transaction Completed</h3>
          <p className="text-muted-foreground text-sm">
            Your staking operation was successful
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Transaction Hash</span>
          <div className="flex items-center gap-2">
            <span className="text-xs underline transition-colors hover:text-foreground font-semibold">
              {truncatedHash}
            </span>
            {result.hash && (
              <a
                className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
                href={explorerUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="View on U2U Explorer"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
        <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
          <p className="text-green-700 dark:text-green-300 text-sm">
            {result.message?.split("\n\n")[0] || "Transaction completed successfully"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function StakingOperationResult({
  result,
  toolType,
  toolCallId,
  onTransactionSuccess,
}: StakingOperationResultProps) {
  if (!result) return null;

  // Handle error
  if (!result.success) {
    return (
        <ErrorResult error={result.error} />
    );
  }

  // Handle transaction completed
  if (result.transactionCompleted && result.hash) {
    return (
        <TransactionCompletedResult result={result} />
    );
  }

  // Handle transaction success callback
  const handleTransactionSuccess = (transactionResult: {
    hash: string;
    success: boolean;
    message: string;
  }) => {
    if (transactionResult.success && transactionResult.hash) {
      onTransactionSuccess?.(
        transactionResult.hash,
        result.action || toolType,
        toolCallId
      );
    }
  };

  // Render StakingOperation component for all staking operations
  // Support both naming conventions: tool-delegateStake and tool-u2u_staking_delegate
  const stakingOperations = [
    "tool-delegateStake",
    "tool-undelegateStake", 
    "tool-claimRewards",
    "tool-restakeRewards",
    "tool-lockStake",
    // U2U staking tool names
    "tool-u2u_staking_delegate",
    "tool-u2u_staking_undelegate",
    "tool-u2u_staking_claim_rewards",
    "tool-u2u_staking_restake_rewards",
    "tool-u2u_staking_lock_stake",
  ];

  // Check if this is a staking operation that requires wallet interaction
  if (stakingOperations.includes(toolType) || result.requiresWallet) {
    return (
        <StakingOperation
          toolCallId={toolCallId}
          onSuccess={handleTransactionSuccess}
          operation={result}
        />
    );
  }

  // Fallback: Display raw JSON
  return (
    <div className="rounded-lg border p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Coins className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Staking Operation</h3>
          <p className="text-muted-foreground text-sm">Operation Result</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="rounded-md bg-muted/50 p-4">
          <pre className="overflow-x-auto text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
