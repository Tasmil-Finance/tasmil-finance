"use client";

/**
 * Staking Operation Card Component
 * 
 * Renders UI for staking operations (delegate, undelegate, claim, etc.)
 * Follows the pattern from langgraphjs-gen-ui-examples/buy-stock:
 * 1. Check for persisted result in thread.messages (tool response)
 * 2. If found → show result UI
 * 3. If not → show form UI with sign button
 * 4. On sign → execute wallet tx → submit result to thread
 */

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Coins,
  Loader2,
  Lock,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Button } from "@/shared/ui/button";
import { useStreamContext } from "@/providers/stream";
import {
  useClaimRewards,
  useDelegateStake,
  useLockStake,
  useRestakeRewards,
  useUndelegateStake,
} from "@/features/staking";

type StakingOperation =
  | "delegate"
  | "undelegate"
  | "claim_rewards"
  | "restake_rewards"
  | "lock_stake";

interface StakingOperationCardProps {
  // From HITL interrupt or UI message
  operation: StakingOperation;
  args: Record<string, unknown>;
  toolCallId?: string; // Tool call ID for persisting result
  result?: StakingResult | null; // Result from backend (persisted state)
  // Callback to resume HITL (optional - for HITL flow)
  onComplete?: (result: StakingResult) => void;
}

interface StakingResult {
  success: boolean;
  hash?: string;
  error?: string;
  operation: string;
  validatorID?: string;
  amount?: string;
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
    buttonText: "Sign & Stake",
    icon: Coins,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
  undelegate: {
    title: "Undelegate Stake",
    buttonText: "Sign & Unstake",
    icon: TrendingUp,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  claim_rewards: {
    title: "Claim Rewards",
    buttonText: "Sign & Claim",
    icon: CheckCircle,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  restake_rewards: {
    title: "Restake Rewards",
    buttonText: "Sign & Restake",
    icon: TrendingUp,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  lock_stake: {
    title: "Lock Stake",
    buttonText: "Sign & Lock",
    icon: Lock,
    iconColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
};

/**
 * Format amount to human readable U2U
 * Handles both:
 * - U2U amount (e.g., "2", "100.5") - display as-is
 * - Wei amount (e.g., "2000000000000000000") - convert to U2U
 */
function formatAmount(amount: string | number | undefined): string {
  if (!amount) return "";
  
  const amountStr = String(amount);
  
  try {
    // Check if it's a small number (likely U2U, not wei)
    // Wei amounts are typically 18+ digits
    const num = parseFloat(amountStr);
    
    if (amountStr.length < 15 && !amountStr.includes('e')) {
      // Small number - treat as U2U directly
      if (num === 0) return "0";
      return num.toLocaleString(undefined, { maximumFractionDigits: 4 });
    }
    
    // Large number - treat as wei, convert to U2U
    const wei = BigInt(amountStr);
    const formatted = formatEther(wei);
    const ethNum = parseFloat(formatted);
    if (ethNum === 0) return "0";
    if (ethNum < 0.0001) return "<0.0001";
    return ethNum.toLocaleString(undefined, { maximumFractionDigits: 4 });
  } catch {
    return amountStr;
  }
}

/**
 * Get tool response from thread messages (for persisted state)
 */
function getToolResponse(
  toolCallId: string | undefined,
  messages: any[]
): StakingResult | null {
  console.log("[getToolResponse] Looking for toolCallId:", toolCallId);
  console.log("[getToolResponse] All tool messages:", messages.filter(m => m.type === "tool").map(m => ({
    id: m.id,
    tool_call_id: m.tool_call_id,
    name: m.name,
    content: m.content?.substring?.(0, 100) || m.content,
  })));
  
  if (!toolCallId) {
    console.log("[getToolResponse] No toolCallId provided");
    return null;
  }
  
  const toolMessage = messages.findLast(
    (msg) => msg.type === "tool" && msg.tool_call_id === toolCallId
  );
  
  console.log("[getToolResponse] Found tool message:", toolMessage ? {
    id: toolMessage.id,
    tool_call_id: toolMessage.tool_call_id,
    name: toolMessage.name,
    content: toolMessage.content,
  } : null);
  
  if (!toolMessage) return null;
  
  try {
    const content = typeof toolMessage.content === "string"
      ? JSON.parse(toolMessage.content)
      : toolMessage.content;
    
    console.log("[getToolResponse] Parsed content:", content);
    
    if (content && typeof content === "object" && "success" in content) {
      return content as StakingResult;
    }
  } catch (e) {
    console.log("[getToolResponse] Parse error:", e);
  }
  
  return null;
}

// ============ Sub-components ============

function SuccessResult({ result, config }: { result: StakingResult; config: typeof OPERATION_CONFIG[StakingOperation] }) {
  const hash = result.hash || "";
  const truncatedHash = hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";
  const explorerUrl = hash ? `https://u2uscan.xyz/tx/${hash}` : "";

  return (
    <div className="w-fit min-w-[280px] rounded-lg border bg-card/40 p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold">Transaction Completed</h3>
          <p className="text-muted-foreground text-sm">{config.title} was successful</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {result.validatorID && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Validator ID</span>
            <span className="font-semibold">{result.validatorID}</span>
          </div>
        )}
        {result.amount && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{result.amount}</span>
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
          Transaction completed successfully!
        </p>
      </div>
    </div>
  );
}

function FailedResult({ result, config }: { result: StakingResult; config: typeof OPERATION_CONFIG[StakingOperation] }) {
  return (
    <div className="w-fit min-w-[280px] rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold">Transaction Failed</h3>
          <p className="text-muted-foreground text-sm">{config.title}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {result.validatorID && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Validator ID</span>
            <span className="font-semibold">{result.validatorID}</span>
          </div>
        )}
        {result.amount && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">{result.amount}</span>
          </div>
        )}
      </div>

      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
        <p className="text-destructive text-sm">{result.error || "Transaction failed"}</p>
      </div>
    </div>
  );
}

// ============ Main Component ============

export function StakingOperationCard({
  operation,
  args,
  toolCallId,
  result: propsResult,
  onComplete,
}: StakingOperationCardProps) {
  const { isConnected } = useAccount();
  const thread = useStreamContext();
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [localResult, setLocalResult] = useState<StakingResult | null>(null);

  // Staking hooks
  const delegateStake = useDelegateStake();
  const undelegateStake = useUndelegateStake();
  const claimRewards = useClaimRewards();
  const restakeRewards = useRestakeRewards();
  const lockStake = useLockStake();

  const config = OPERATION_CONFIG[operation];
  const Icon = config.icon;

  // Extract operation details from args
  const validatorID = args["validatorID"];
  const amountWei = args["amount"];
  const wrID = args["wrID"];
  const lockupDuration = args["lockupDuration"];

  // Format amount
  const amountFormatted = amountWei ? `${formatAmount(amountWei as string)} U2U` : undefined;

  // Check for persisted result in thread messages
  const persistedResult = getToolResponse(toolCallId, thread.messages);
  
  // Priority: propsResult (from backend UI message) > persistedResult (from messages) > localResult
  const result = propsResult || persistedResult || localResult;

  // DEBUG: Log component state
  console.log("[StakingOperationCard] Render:", {
    operation,
    toolCallId,
    propsResult,
    persistedResult,
    localResult,
    finalResult: result,
    args,
    messagesCount: thread.messages.length,
  });

  // Check if any hook is pending
  const isPending =
    delegateStake.isPending ||
    undelegateStake.isPending ||
    claimRewards.isPending ||
    restakeRewards.isPending ||
    lockStake.isPending;

  // Handle wallet transaction
  const handleSign = async () => {
    if (!isConnected) {
      const errorResult: StakingResult = {
        success: false,
        error: "Wallet not connected",
        operation,
        validatorID: validatorID ? String(validatorID) : undefined,
        amount: amountFormatted,
      };
      setLocalResult(errorResult);
      onComplete?.(errorResult);
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

        case "undelegate": {
          if (!amountWei) throw new Error("Amount is required for undelegation");
          const effectiveWrID = wrID ? Number(wrID) : Math.floor(Math.random() * 1_000_000);
          walletResult = await undelegateStake.undelegateStake(validatorNum, effectiveWrID, amountStr);
          break;
        }

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
          walletResult = await lockStake.lockStake(validatorNum, Number(lockupDuration), amountStr);
          break;

        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      const successResult: StakingResult = {
        success: true,
        hash: walletResult.hash,
        operation,
        validatorID: validatorID ? String(validatorID) : undefined,
        amount: amountFormatted,
      };

      // Set local result to show UI
      setLocalResult(successResult);
      // Call onComplete to persist result
      onComplete?.(successResult);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";
      const errorResult: StakingResult = {
        success: false,
        error: errorMessage,
        operation,
        validatorID: validatorID ? String(validatorID) : undefined,
        amount: amountFormatted,
      };

      // Set local result to show UI
      setLocalResult(errorResult);
      // Call onComplete to persist result
      onComplete?.(errorResult);
    } finally {
      setIsExecuting(false);
    }
  };

  // Show result UI if we have a result
  if (result) {
    if (result.success) {
      return <SuccessResult result={result} config={config} />;
    } else {
      return <FailedResult result={result} config={config} />;
    }
  }

  // Show form UI
  return (
    <div className="w-fit min-w-[280px] rounded-lg border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-semibold">{config.title}</h3>
          <p className="text-muted-foreground text-sm">
            Review and sign the transaction
          </p>
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

        {lockupDuration != null && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lockup Duration</span>
            <span className="font-semibold">{Math.floor(Number(lockupDuration) / 86400)} days</span>
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

      {/* Sign Button */}
      <Button
        onClick={handleSign}
        disabled={!isConnected || isExecuting || isPending}
        className="w-full h-10 rounded-lg"
        variant="default"
      >
        {isExecuting || isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing...
          </>
        ) : (
          config.buttonText
        )}
      </Button>
    </div>
  );
}
