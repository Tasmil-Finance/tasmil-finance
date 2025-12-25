"use client";

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Coins,
  DollarSign,
  Lock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
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

export function StakingOperationResult({
  result,
  toolType,
  toolCallId,
  onTransactionSuccess,
}: StakingOperationResultProps) {
  if (!result) {
    return null;
  }

  // Handle error
  if (!result.success) {
    return (
      <div className="group relative overflow-hidden rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/5 via-destructive/10 to-destructive/5 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-destructive/40">
        {/* Subtle animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-destructive/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex flex-row items-start gap-4">
          {/* Icon with subtle pulse animation */}
          <div className="flex items-center justify-center mt-0.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 ring-2 ring-destructive/20 group-hover:ring-destructive/30 transition-all duration-300">
              <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Typography
                variant="h4"
                weight="semibold"
                className="text-destructive text-base font-semibold"
              >
                Transaction Failed
              </Typography>
              <span className="flex h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
            </div>

            {/* Error message with better typography */}
            <Typography
              variant="small"
              className="text-destructive/90 text-sm leading-relaxed break-words"
            >
              {result.error || "An unknown error occurred. Please try again."}
            </Typography>

            {/* Optional: Add helpful hint */}
            <div className="mt-2 pt-3 border-t border-destructive/20">
              <Typography
                variant="small"
                className="text-destructive/70 text-xs flex items-center gap-1.5"
              >
                <AlertCircle className="h-3 w-3" />
                <span>Please check your wallet connection and try again</span>
              </Typography>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle transaction completed
  if (result.transactionCompleted && result.hash) {
    // Truncate hash: first 6 + last 4 characters
    const truncatedHash = `${result.hash.slice(0, 6)}...${result.hash.slice(
      -4
    )}`;
    const explorerUrl = `https://u2uscan.xyz/tx/${result.hash}`;

    return (
      <div className="rounded-lg bg-card/40 border p-6 shadow-sm w-full">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <Typography className="text-base" variant="h3" weight="semibold">
              Transaction Completed
            </Typography>
            <Typography
              className="text-muted-foreground text-sm"
              variant="small"
            >
              Your staking operation was successful
            </Typography>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Typography className="text-sm" color="foreground">
              Transaction Hash
            </Typography>
            <div className="flex items-center gap-2">
              <Typography
                className="text-xs underline transition-colors hover:text-foreground"
                variant="small"
                weight="semibold"
              >
                {truncatedHash}
              </Typography>
              <a
                className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
                href={explorerUrl}
                rel="noopener noreferrer"
                target="_blank"
                title="View on U2U Explorer"
              >
                <ArrowUpRight className="h-4 w-4 text-emerald" />
              </a>
            </div>
          </div>
          <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
            <Typography className="text-green-300" variant="small">
              {result.message.split("\n\n")[0]}{" "}
              {/* Only show first line without hash */}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Handle transaction success
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

  // Format based on tool type
  switch (toolType) {
    case "tool-delegateStake":
      return (
        <StakingOperation
          onSuccess={handleTransactionSuccess}
          operation={result}
        />
      );

    case "tool-undelegateStake":
      return (
        <StakingOperation
          onSuccess={handleTransactionSuccess}
          operation={result}
        />
      );

    case "tool-claimRewards":
      return (
        <StakingOperation
          onSuccess={handleTransactionSuccess}
          operation={result}
        />
      );

    case "tool-restakeRewards":
      return (
        <StakingOperation
          onSuccess={handleTransactionSuccess}
          operation={result}
        />
      );

    case "tool-lockStake":
      return (
        <StakingOperation
          onSuccess={handleTransactionSuccess}
          operation={result}
        />
      );

    default:
      // Fallback: Display raw JSON
      return (
        <div className="rounded-lg border p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Coins className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Staking Operation
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Operation Result
              </Typography>
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
}

