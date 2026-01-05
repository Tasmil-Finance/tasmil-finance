"use client";

import { Wallet, Clock, TrendingUp, Users, AlertCircle, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface StakingResultProps {
  result: any;
  toolType: string;
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

const AccountBalanceResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <Wallet className="h-5 w-5 text-primary" />
      <span className="font-semibold">Account Balance</span>
    </div>
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Address</span>
        <span className="font-mono text-xs">{data.walletAddress}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Balance</span>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">{formatNumber(data.balance)}</span>
          <span className="text-muted-foreground text-sm">{data.unit}</span>
        </div>
      </div>
    </div>
  </div>
);

const CurrentEpochResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <Clock className="h-5 w-5 text-primary" />
      <span className="font-semibold">Current Epoch</span>
    </div>
    <div className="bg-muted/30 rounded-lg p-4 text-center">
      <div className="text-muted-foreground text-sm mb-1">Epoch Number</div>
      <div className="text-3xl font-bold text-primary">{data.currentEpoch}</div>
    </div>
  </div>
);

const TotalStakeResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <TrendingUp className="h-5 w-5 text-primary" />
      <span className="font-semibold">Total Stake</span>
    </div>
    <div className="bg-muted/30 rounded-lg p-4 text-center">
      <div className="text-muted-foreground text-sm mb-1">Total Staked Amount</div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-bold text-primary">{formatNumber(data.totalStake)}</span>
        <span className="text-muted-foreground">{data.unit}</span>
      </div>
    </div>
  </div>
);

const ValidatorInfoResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <Users className="h-5 w-5 text-primary" />
      <span className="font-semibold">Validator Info</span>
    </div>
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Validator ID</span>
        <span className="font-medium">{data.validatorID}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Status</span>
        <span className="font-medium">{data.status}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Created Epoch</span>
        <span className="font-medium">{data.createdEpoch}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Auth Address</span>
        <span className="font-mono text-xs">{data.auth}</span>
      </div>
    </div>
  </div>
);

const PendingRewardsResult = ({ data }: { data: any }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 mb-2">
      <DollarSign className="h-5 w-5 text-primary" />
      <span className="font-semibold">Pending Rewards</span>
    </div>
    <div className="bg-muted/30 rounded-lg p-4 text-center">
      <div className="text-muted-foreground text-sm mb-1">Unclaimed Amount</div>
      <div className="flex items-center justify-center gap-2">
        <span className="text-2xl font-bold text-primary">{formatNumber(data.pendingRewards)}</span>
        <span className="text-muted-foreground">{data.unit}</span>
      </div>
    </div>
  </div>
);

const ErrorResult = ({ error }: { error: string }) => (
  <div className="flex items-center gap-2 text-red-500">
    <AlertCircle className="h-4 w-4" />
    <span>{error}</span>
  </div>
);

export default function StakingResult({ result, toolType }: StakingResultProps) {
  if (!result) return null;
  
  if (!result.success) {
    return (
      <div className="p-4">
        <ErrorResult error={result.error || "Operation failed"} />
      </div>
    );
  }
  
  switch (toolType) {
    case "tool-getAccountBalance":
      return (
        <div className="p-4">
          <AccountBalanceResult data={result} />
        </div>
      );
    
    case "tool-getCurrentEpoch":
      return (
        <div className="p-4">
          <CurrentEpochResult data={result} />
        </div>
      );
    
    case "tool-getTotalStake":
    case "tool-getTotalActiveStake":
      return (
        <div className="p-4">
          <TotalStakeResult data={result} />
        </div>
      );
    
    case "tool-getValidatorInfo":
      return (
        <div className="p-4">
          <ValidatorInfoResult data={result} />
        </div>
      );
    
    case "tool-getPendingRewards":
      return (
        <div className="p-4">
          <PendingRewardsResult data={result} />
        </div>
      );
    
    default:
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Staking data received. Check AI response for details.
        </div>
      );
  }
}
