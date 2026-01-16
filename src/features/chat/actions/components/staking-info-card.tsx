"use client";

/**
 * Staking Info UI Component
 * 
 * Renders read-only staking information from backend tools.
 * Used with LoadExternalComponent pattern.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";

interface StakingInfoProps {
  type: "user_stake" | "pending_rewards" | "unlocked_stake" | "lockup_info" | "rewards_stash";
  args: Record<string, unknown>;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
  };
  toolName: string;
}

const TITLE_MAP = {
  user_stake: "Your Stake",
  pending_rewards: "Pending Rewards",
  unlocked_stake: "Unlocked Stake",
  lockup_info: "Lockup Information",
  rewards_stash: "Rewards Stash",
};

export function StakingInfoCard({ type, args, result, toolName }: StakingInfoProps) {
  const title = TITLE_MAP[type] || "Staking Info";
  const isLoading = !result;
  const hasError = result && !result.success;

  console.log("[StakingInfoCard] Render:", {
    type,
    args,
    result,
    toolName,
    isLoading,
    hasError,
  });

  // Extract data from result - handle both formats
  const data = result?.data || result; // Support both result.data and direct result

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {hasError && (
          <div className="text-sm text-destructive">
            {result.error || "Failed to load data"}
          </div>
        )}

        {result && result.success && (
          <div className="space-y-2">
            {/* Validator ID */}
            {(args["validatorID"] || data?.validatorID) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validator:</span>
                <span className="font-medium">#{args["validatorID"] || data?.validatorID}</span>
              </div>
            )}

            {/* Display data based on type */}
            {type === "user_stake" && data?.stake && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Staked Amount:</span>
                <span className="font-medium">{data.stake.formatted || data.stake.raw}</span>
              </div>
            )}

            {type === "pending_rewards" && data?.pendingRewards && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rewards:</span>
                <span className="font-medium text-green-600">
                  {data.pendingRewards.formatted || data.pendingRewards.raw}
                </span>
              </div>
            )}

            {type === "unlocked_stake" && data?.unlockedStake && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unlocked:</span>
                <span className="font-medium">{data.unlockedStake.formatted || data.unlockedStake.raw}</span>
              </div>
            )}

            {type === "lockup_info" && data?.lockupInfo && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Locked Amount:</span>
                  <span className="font-medium">
                    {data.lockupInfo.lockedAmount?.formatted || data.lockupInfo.lockedAmount?.raw || "0 U2U"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">End Time:</span>
                  <span className="font-medium">
                    {data.lockupInfo.endTime ? new Date(Number(data.lockupInfo.endTime) * 1000).toLocaleString() : "N/A"}
                  </span>
                </div>
              </>
            )}

            {type === "rewards_stash" && data?.rewardsStash && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Stashed Rewards:</span>
                <span className="font-medium text-green-600">
                  {data.rewardsStash.formatted || data.rewardsStash.raw}
                </span>
              </div>
            )}

            {/* Raw data fallback for debugging */}
            {!["user_stake", "pending_rewards", "unlocked_stake", "lockup_info", "rewards_stash"].includes(type) && data && (
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

