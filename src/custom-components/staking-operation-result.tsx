"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Coins,
  TrendingUp,
  Lock,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StakingOperationResultProps {
  result: any;
  toolType: string;
}

const getOperationIcon = (action: string) => {
  switch (action) {
    case "delegate":
      return <Coins className="h-5 w-5 text-primary" />;
    case "undelegate":
      return <TrendingUp className="h-5 w-5 text-orange-500" />;
    case "claimRewards":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "restakeRewards":
      return <TrendingUp className="h-5 w-5 text-blue-500" />;
    case "lockStake":
      return <Lock className="h-5 w-5 text-purple-500" />;
    default:
      return <Coins className="h-5 w-5 text-primary" />;
  }
};

const getOperationTitle = (action: string) => {
  switch (action) {
    case "delegate":
      return "Delegate Stake";
    case "undelegate":
      return "Undelegate Stake";
    case "claimRewards":
      return "Claim Rewards";
    case "restakeRewards":
      return "Restake Rewards";
    case "lockStake":
      return "Lock Stake";
    default:
      return "Staking Operation";
  }
};

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
          <p className="text-green-700 text-sm">
            {result.message?.split("\n\n")[0] || "Transaction completed successfully"}
          </p>
        </div>
      </div>
    </div>
  );
};

const OperationPendingResult = ({ operation }: { operation: any }) => {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm w-full">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          {getOperationIcon(operation.action)}
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{getOperationTitle(operation.action)}</h3>
          <p className="text-muted-foreground text-sm">
            {operation.message || "Ready to execute"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Operation Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Validator ID</span>
            <span className="font-semibold">{operation.validatorID}</span>
          </div>

          {operation.amount && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{operation.amountFormatted || operation.amount}</span>
            </div>
          )}

          {operation.wrID && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Withdrawal Request ID</span>
              <span className="font-semibold">{operation.wrID}</span>
            </div>
          )}

          {operation.lockupDurationDays && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lockup Duration</span>
              <span className="font-semibold">{operation.lockupDurationDays} days</span>
            </div>
          )}
        </div>

        {/* Wallet Connection Notice */}
        {operation.requiresWallet && (
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
            <div className="flex items-center gap-2 text-yellow-700 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Wallet connection required to execute this operation</span>
            </div>
          </div>
        )}

        {/* Confirmation Notice */}
        {operation.requiresConfirmation && (
          <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3">
            <p className="text-blue-700 text-sm">
              Please confirm the transaction in your wallet when prompted.
            </p>
          </div>
        )}

        {/* Action Button (Disabled in chat UI - for display only) */}
        <Button
          className="w-full"
          disabled
          variant="outline"
        >
          Execute in Wallet
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          This operation requires wallet integration
        </p>
      </div>
    </div>
  );
};

export default function StakingOperationResult({
  result,
  toolType,
}: StakingOperationResultProps) {
  if (!result) return null;

  // Handle error
  if (!result.success) {
    return (
      <div className="p-4">
        <ErrorResult error={result.error} />
      </div>
    );
  }

  // Handle transaction completed
  if (result.transactionCompleted && result.hash) {
    return (
      <div className="p-4">
        <TransactionCompletedResult result={result} />
      </div>
    );
  }

  // Handle operation pending (ready to execute)
  return (
    <div className="p-4">
      <OperationPendingResult operation={result} />
    </div>
  );
}
