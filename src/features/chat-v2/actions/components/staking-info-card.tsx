"use client";

// 🎨 Staking info card component for displaying staking data

import { Coins, DollarSign, Lock, Wallet, Loader2, AlertCircle } from "lucide-react";

type StakingInfoType = 
  | "user_stake" 
  | "pending_rewards" 
  | "unlocked_stake" 
  | "lockup_info" 
  | "rewards_stash";

interface StakingInfoCardProps {
  type: StakingInfoType;
  args: Record<string, unknown>;
  result: unknown;
  status: "pending" | "executing" | "complete" | "error" | "inProgress";
}

const formatNumber = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "N/A";
  const numValue = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(numValue)) return "N/A";
  if (numValue >= 1e9) return `${(numValue / 1e9).toFixed(2)}B`;
  if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(2)}M`;
  if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(2)}K`;
  return numValue.toFixed(4);
};

const getFormattedValue = (data: Record<string, unknown>, key: string): string => {
  const value = data[key];
  if (!value) return "N/A";
  if (typeof value === "object" && value !== null && "formatted" in value) {
    return (value as { formatted: string }).formatted;
  }
  return formatNumber(value as number | string);
};

const CONFIG: Record<StakingInfoType, {
  title: string;
  description: string;
  icon: typeof Coins;
  iconColor: string;
  bgColor: string;
  valueKey: string;
  valueLabel: string;
}> = {
  user_stake: {
    title: "Staked Amount",
    description: "Your delegation to validator",
    icon: Coins,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
    valueKey: "stake",
    valueLabel: "Total Staked",
  },
  pending_rewards: {
    title: "Pending Rewards",
    description: "Unclaimed staking rewards",
    icon: DollarSign,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10",
    valueKey: "pendingRewards",
    valueLabel: "Unclaimed Rewards",
  },
  unlocked_stake: {
    title: "Unlocked Stake",
    description: "Available to withdraw",
    icon: Wallet,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
    valueKey: "unlockedStake",
    valueLabel: "Unlocked Amount",
  },
  lockup_info: {
    title: "Lockup Info",
    description: "Stake lock details",
    icon: Lock,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
    valueKey: "lockedStake",
    valueLabel: "Locked Stake",
  },
  rewards_stash: {
    title: "Rewards Stash",
    description: "Accumulated rewards",
    icon: DollarSign,
    iconColor: "text-green-500",
    bgColor: "bg-green-500/10",
    valueKey: "rewardsStash",
    valueLabel: "Stashed Rewards",
  },
};

export function StakingInfoCard({ type, args, result, status }: StakingInfoCardProps) {
  const config = CONFIG[type];
  const Icon = config.icon;

  // Loading state
  if (status === "pending" || status === "executing") {
    return (
      <div className="max-w-sm rounded-lg border bg-card/40 p-6 shadow-sm mt-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}>
            <Loader2 className={`h-5 w-5 ${config.iconColor} animate-spin`} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">{config.title}</h3>
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error" || (result && typeof result === "object" && "error" in result)) {
    const errorMsg = result && typeof result === "object" && "error" in result 
      ? (result as { error: string }).error 
      : "Failed to fetch data";
    
    return (
      <div className="max-w-sm rounded-lg border border-destructive/30 bg-destructive/5 p-6 shadow-sm mt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-destructive">Error</h3>
            <p className="text-destructive/80 text-sm">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  const data = (result as Record<string, unknown>) || {};
  const validatorID = args['validator_id'] || args['validatorID'] || data['validatorID'];
  const delegatorAddress = args['delegator_address'] || data['delegatorAddress'];

  return (
    <div className="max-w-sm rounded-lg border bg-card/40 p-6 shadow-sm mt-4">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}>
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{config.title}</h3>
          <p className="text-muted-foreground text-sm">{config.description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {validatorID != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Validator ID</span>
            <span className="font-medium">{String(validatorID)}</span>
          </div>
        )}
        
        {delegatorAddress != null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delegator</span>
            <span className="font-mono text-xs" title={String(delegatorAddress)}>
              {`${String(delegatorAddress).slice(0, 6)}...${String(delegatorAddress).slice(-4)}`}
            </span>
          </div>
        )}

        {/* Lockup specific fields */}
        {type === "lockup_info" && (
          <>
            {data['lockupDuration'] != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{String(data['lockupDuration'])}</span>
              </div>
            )}
            {data['endTime'] != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-medium">{String(data['endTime'])}</span>
              </div>
            )}
          </>
        )}

        {/* Main value display */}
        <div className={`rounded-md border ${
          type === "pending_rewards" || type === "rewards_stash" 
            ? "border-green-500/30 bg-green-500/10" 
            : "border-primary/30 bg-primary/10"
        } p-3 text-center`}>
          <div className="text-muted-foreground text-xs mb-1">{config.valueLabel}</div>
          <div className={`text-xl font-bold ${
            type === "pending_rewards" || type === "rewards_stash" 
              ? "text-green-500" 
              : "text-primary"
          }`}>
            {getFormattedValue(data, config.valueKey)}
          </div>
        </div>
      </div>
    </div>
  );
}
