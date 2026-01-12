"use client";

// 🎨 Staking operation card component for wallet interactions
// Uses HITL pattern: when user signs transaction, result is sent back to agent via respond()
// This ensures transaction results are persisted in thread messages

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import {
  Coins,
  TrendingUp,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  useDelegateStake,
  useUndelegateStake,
  useClaimRewards,
  useRestakeRewards,
  useLockStake,
} from "../../hooks/use-staking-operations";

type StakingOperation =
  | "delegate"
  | "undelegate"
  | "claim_rewards"
  | "restake_rewards"
  | "lock_stake";

interface StakingOperationCardProps {
  operation: StakingOperation;
  args: Record<string, unknown>;
  result: unknown;
  status: "pending" | "executing" | "complete" | "error" | "inProgress";
  // respond from useHumanInTheLoop - sends result back to agent
  respond?: (result: Record<string, unknown>) => void;
}

const OPERATION_CONFIG: Record<
  StakingOperation,
  {
    title: string;
    buttonText: string;
    icon: typeof Coins;
    iconColor: string;
    bgColor: string;
  }
> = {
  delegate: {
    title: "Delegate Stake",
    buttonText: "Stake U2U",
    icon: Coins,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  undelegate: {
    title: "Undelegate Stake",
    buttonText: "Unstake U2U",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  claim_rewards: {
    title: "Claim Rewards",
    buttonText: "Claim Rewards",
    icon: CheckCircle,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  restake_rewards: {
    title: "Restake Rewards",
    buttonText: "Restake Rewards",
    icon: TrendingUp,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  lock_stake: {
    title: "Lock Stake",
    buttonText: "Lock Stake",
    icon: Lock,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

/**
 * Format wei amount to human readable U2U
 */
function formatAmount(weiAmount: string | number | undefined): string {
  if (!weiAmount) return "";
  try {
    const wei = BigInt(String(weiAmount));
    const formatted = formatEther(wei);
    const num = parseFloat(formatted);
    if (num === 0) return "0";
    if (num < 0.0001) return "<0.0001";
    return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return String(weiAmount);
  }
}

export function StakingOperationCard({
  operation,
  args,
  result,
  status,
  respond,
}: StakingOperationCardProps) {
  const { address, isConnected } = useAccount();
  const [isExecuting, setIsExecuting] = useState(false);
  const [txResult, setTxResult] = useState<{
    success: boolean;
    hash?: string;
    message: string;
  } | null>(null);

  // Staking hooks
  const delegateStake = useDelegateStake();
  const undelegateStake = useUndelegateStake();
  const claimRewards = useClaimRewards();
  const restakeRewards = useRestakeRewards();
  const lockStake = useLockStake();

  const config = OPERATION_CONFIG[operation];
  const Icon = config.icon;

  // Extract operation details from args or result
  const data = (result as Record<string, unknown>) || {};
  const validatorID = args["validatorID"] || data["validatorID"];
  const amountWei = args["amount"] || data["amount"];
  const wrID = args["wrID"] || data["wrID"];
  const lockupDuration = args["lockupDuration"] || data["lockupDuration"];
  const lockupDurationDays = data["lockupDurationDays"];

  // Format amount from wei to U2U
  const amountFormatted: string | undefined = amountWei 
    ? `${formatAmount(amountWei as string)} U2U` 
    : undefined;

  // Use result from CopilotKit (persisted) or local txResult
  // This ensures state persists across page reloads
  const persistedResult = result as Record<string, unknown> | undefined;
  const hasPersistedResult = persistedResult && persistedResult["success"] !== undefined;
  
  // Debug: log what we receive from CopilotKit
  console.log('[StakingOperationCard] Debug:', {
    operation,
    status,
    result,
    persistedResult,
    hasPersistedResult,
    args,
  });
  
  const effectiveResult = txResult || (hasPersistedResult ? {
    success: Boolean(persistedResult["success"]),
    hash: persistedResult["hash"] as string | undefined,
    message: String(persistedResult["message"] || (persistedResult["success"] ? "Transaction successful!" : "Transaction failed")),
  } : null);
  
  console.log('[StakingOperationCard] effectiveResult:', effectiveResult);

  // Check if any hook is pending
  const isPending =
    delegateStake.isPending ||
    undelegateStake.isPending ||
    claimRewards.isPending ||
    restakeRewards.isPending ||
    lockStake.isPending;

  // Handle wallet transaction
  const handleExecute = async () => {
    if (!isConnected || !address) {
      setTxResult({
        success: false,
        message: "Wallet not connected",
      });
      // Send result back to agent - agent will generate the response message
      respond?.({
        success: false,
        error: "Wallet not connected",
      });
      return;
    }

    setIsExecuting(true);

    try {
      let walletResult;
      const validatorNum = Number(validatorID);
      const amountStr = String(amountWei || "0");

      switch (operation) {
        case "delegate":
          if (!amountWei) throw new Error("Amount is required for delegation");
          walletResult = await delegateStake.delegateStake(validatorNum, amountStr);
          break;

        case "undelegate":
          if (!amountWei || !wrID) {
            throw new Error("Amount and withdrawal request ID are required");
          }
          walletResult = await undelegateStake.undelegateStake(
            validatorNum,
            Number(wrID),
            amountStr
          );
          break;

        case "claim_rewards":
          walletResult = await claimRewards.claimRewards(validatorNum);
          break;

        case "restake_rewards":
          walletResult = await restakeRewards.restakeRewards(validatorNum);
          break;

        case "lock_stake":
          if (!amountWei || !lockupDuration) {
            throw new Error("Amount and lockup duration are required");
          }
          walletResult = await lockStake.lockStake(
            validatorNum,
            Number(lockupDuration),
            amountStr
          );
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      setTxResult({
        success: true,
        hash: walletResult.hash,
        message: "Transaction successful!",
      });

      // Send result back to agent - agent will generate the response message
      respond?.({
        success: true,
        hash: walletResult.hash,
        operation,
        validatorID: String(validatorID),
        amount: amountFormatted,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      
      setTxResult({
        success: false,
        message: errorMessage,
      });

      // Send result back to agent - agent will generate the response message
      respond?.({
        success: false,
        error: errorMessage,
        operation,
        validatorID: String(validatorID),
        amount: amountFormatted,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Show completed transaction UI (status === "complete" means respond was called)
  // Use effectiveResult which combines local state and persisted result from CopilotKit
  // Check success status first - if failed, show failed UI even if status is complete
  const isSuccess = effectiveResult?.success === true && effectiveResult?.hash;
  const isFailed = effectiveResult?.success === false;
  
  if (isSuccess || (status === "complete" && !isFailed && effectiveResult?.hash)) {
    const hash = effectiveResult?.hash;
    const truncatedHash = hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";
    const explorerUrl = hash ? `https://u2uscan.xyz/tx/${hash}` : "";

    return (
      <div className="max-w-sm rounded-lg border bg-card/40 p-6 shadow-sm mt-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold">Transaction Completed</h3>
            <p className="text-muted-foreground text-sm">
              {config.title} was successful
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {validatorID != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Validator ID</span>
              <span className="font-semibold">{String(validatorID)}</span>
            </div>
          )}
          {amountFormatted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{amountFormatted}</span>
            </div>
          )}
          {hash && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs">{truncatedHash}</span>
                <a
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-background/30 transition-colors hover:text-foreground"
                  href={explorerUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  title="View on U2U Explorer"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border border-green-500/30 bg-green-500/20 p-3">
          <p className="text-green-700 dark:text-green-300 text-sm">
            {effectiveResult?.message || "Transaction completed successfully!"}
          </p>
        </div>
      </div>
    );
  }

  // Show failed transaction UI - check this BEFORE showing success
  if (isFailed || (status === "complete" && effectiveResult?.success === false)) {
    const errorMessage = effectiveResult?.message || "Transaction failed";
    
    return (
      <div className="max-w-sm rounded-lg border bg-card p-6 shadow-sm mt-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-base font-semibold">Transaction Failed</h3>
            <p className="text-muted-foreground text-sm">{config.title}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {validatorID != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Validator ID</span>
              <span className="font-semibold">{String(validatorID)}</span>
            </div>
          )}
          {amountFormatted && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{amountFormatted}</span>
            </div>
          )}
        </div>

        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-destructive text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Loading state - only show when status is "pending" (before tool is called)
  // When status is "executing" with respond function, we should show the form for user to sign
  if (status === "pending") {
    return (
      <div className="max-w-sm rounded-lg border bg-card/40 p-6 shadow-sm mt-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}
          >
            <Loader2 className={`h-5 w-5 ${config.iconColor} animate-spin`} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{config.title}</h3>
            <p className="text-muted-foreground text-sm">
              Preparing transaction...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show pending operation UI (ready for wallet interaction)
  return (
    <div className="max-w-sm rounded-lg border bg-card p-6 shadow-sm mt-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
        >
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold">{config.title}</h3>
          <p className="text-muted-foreground text-sm">Click the button below to sign the transaction</p>
        </div>
      </div>

      {/* Operation Details */}
      <div className="space-y-2 mb-4">
        {validatorID != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Validator ID</span>
            <span className="font-semibold">{String(validatorID)}</span>
          </div>
        )}

        {amountFormatted && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{amountFormatted}</span>
          </div>
        )}

        {wrID != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Withdrawal Request ID</span>
            <span className="font-semibold">{String(wrID)}</span>
          </div>
        )}

        {(lockupDurationDays != null || lockupDuration != null) && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lockup Duration</span>
            <span className="font-semibold">
              {lockupDurationDays != null
                ? `${String(lockupDurationDays)} days`
                : `${Math.floor(Number(lockupDuration) / 86400)} days`}
            </span>
          </div>
        )}
      </div>

      {/* Wallet Connection Warning */}
      {!isConnected && (
        <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Please connect your wallet to proceed.</span>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={!isConnected || isExecuting || isPending}
        className="w-full h-10 rounded-lg"
        variant="default"
      >
        {isExecuting || isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          config.buttonText
        )}
      </Button>
    </div>
  );
}
