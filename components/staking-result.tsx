"use client";

import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Package,
  Percent,
  TrendingUp,
  Unlock,
  User,
  Users,
  Wallet,
} from "lucide-react";
import CountUp from "@/components/ui/count-up";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface StakingResultProps {
  result: any;
  toolType: string;
}

// Validator interface for table data
interface ValidatorTableData {
  id: string;
  validatorId: string;
  hash: string;
  auth: string;
  selfStaked: string;
  delegatedAmount: string;
  totalStakedAmount: string;
  createdTime: string;
  createdEpoch: string;
  active: boolean;
  online: boolean;
  downTime: string;
  lockedUntil: string;
  lockDays: string;
  totalClaimedRewards: string;
  totalDelegator: string;
  selfStakedFormatted?: string;
  delegatedAmountFormatted?: string;
  totalStakedAmountFormatted?: string;
  totalClaimedRewardsFormatted?: string;
}

export function StakingResult({ result, toolType }: StakingResultProps) {
  if (!result) {
    return null;
  }

  // Handle error
  if (!result.success) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-red-500/20 p-4">
        <div className="flex flex-row items-center gap-3">
          <div className="flex items-center justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-300" />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Typography
              className="font-semibold text-red-300 text-sm"
              variant="h4"
              weight="semibold"
            >
              Error
            </Typography>
            <Typography className="text-red-300 text-sm" variant="small">
              {result.error}
            </Typography>
          </div>
        </div>
      </div>
    );
  }

  // Format based on tool type
  switch (toolType) {
    case "tool-getAccountBalance":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Account Balance
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                U2U Wallet Balance
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Address
              </Typography>
              <Typography className="font-mono" variant="small">
                {result.walletAddress}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Balance
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={8}
                  duration={1.5}
                  value={Number.parseFloat(result.balance)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getCurrentEpoch":
      return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Current Epoch
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Network Staking Period
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Epoch Number
              </Typography>
              <CountUp
                abbreviate={false}
                className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                decimals={0}
                duration={1.5}
                value={Number.parseInt(result.currentEpoch)}
                variant="h2"
              />
            </div>
          </div>
        </div>
      );

    case "tool-getTotalStake":
      return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Total Stake
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Network Total Staked
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Total Staked Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={2}
                  duration={2}
                  value={Number.parseFloat(result.totalStake)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getTotalActiveStake":
      return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Active Stake
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Currently Active Staking
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Active Staked Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={2}
                  duration={2}
                  value={Number.parseFloat(result.totalActiveStake)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getValidatorID":
      return (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Validator ID
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Validator Lookup
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Auth Address
              </Typography>
              <Typography className="font-mono" variant="small">
                {result.authAddress}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Validator ID
              </Typography>
              <CountUp
                abbreviate={false}
                className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                decimals={0}
                duration={1.5}
                value={Number.parseInt(result.validatorID)}
                variant="h2"
              />
            </div>
          </div>
        </div>
      );

    case "tool-getValidatorInfo":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Validator Info
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Validator {result.validatorID} Details
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Status
              </Typography>
              <Typography className="text-sm" variant="h4" weight="semibold">
                {result.status}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Created Epoch
              </Typography>
              <Typography className="text-sm" variant="h4" weight="semibold">
                {result.createdEpoch}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Auth Address
              </Typography>
              <Typography className="font-mono" variant="small">
                {result.auth}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Created Time
              </Typography>
              <Typography className="text-sm" variant="h4" weight="semibold">
                {new Date(
                  Number(result.createdTime) * 1000
                ).toLocaleDateString()}
              </Typography>
            </div>
          </div>
        </div>
      );

    case "tool-getSelfStake":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Self Stake
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Validator {result.validatorID} Self-Stake
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Self-Staked Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={8}
                  duration={2}
                  value={Number.parseFloat(result.selfStake)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getStake":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Delegated Stake
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Stake to Validator {result.validatorID}
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Delegator
              </Typography>
              <Typography className="font-mono" variant="small">
                {result.delegatorID}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Staked Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={8}
                  duration={2}
                  value={Number.parseFloat(result.stake)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getUnlockedStake":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Unlock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Unlocked Stake
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Available for Withdrawal
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Unlocked Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={8}
                  duration={2}
                  value={Number.parseFloat(result.unlockedStake)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getPendingRewards":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Pending Rewards
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Unclaimed Earnings
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Unclaimed Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={8}
                  duration={2}
                  value={Number.parseFloat(result.pendingRewards)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getRewardsStash":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Rewards Stash
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Stored Rewards
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Stashed Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                  decimals={8}
                  duration={2}
                  value={Number.parseFloat(result.rewardsStash)}
                  variant="h2"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getLockupInfo":
      return (
        <div className="rounded-lg border border-border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Lockup Info
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Validator {result.validatorID} Lock Details
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Locked Stake
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-sm text-transparent"
                  decimals={8}
                  duration={2}
                  value={Number.parseFloat(result.lockedStake)}
                  variant="h4"
                />
                <Typography
                  className="text-muted-foreground text-xs"
                  variant="small"
                >
                  {result.unit}
                </Typography>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                From Epoch
              </Typography>
              <CountUp
                abbreviate={false}
                className="font-semibold text-sm"
                decimals={0}
                duration={1.5}
                value={Number.parseInt(result.fromEpoch)}
                variant="h4"
              />
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                End Date
              </Typography>
              <Typography className="text-sm" variant="small" weight="semibold">
                {new Date(result.endDate).toLocaleDateString()}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Duration
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={false}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-sm text-transparent"
                  decimals={0}
                  duration={2}
                  value={Number.parseInt(result.durationDays)}
                  variant="h4"
                />
                <Typography
                  className="text-muted-foreground text-xs"
                  variant="small"
                >
                  days
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    case "tool-getStakingAPR":
      return (
        <div className="rounded-lg border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Staking APR
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Annual Percentage Rate for Validator {result.validatorID}
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Validator ID
              </Typography>
              <Typography variant="small" weight="semibold">
                {result.validatorID}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Staking Amount
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="font-semibold text-sm"
                  decimals={2}
                  duration={1.5}
                  value={Number.parseFloat(result.amount)}
                  variant="h4"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                APR
              </Typography>
              <CountUp
                abbreviate={false}
                className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-base text-transparent"
                decimals={2}
                duration={2}
                suffix="%"
                value={Number.parseFloat(result.apr)}
                variant="h2"
              />
            </div>
          </div>
        </div>
      );

    case "tool-getValidatorsInfo": {
      // Helper function to get max APR based on validator ID
      const getMaxApr = (validatorId: string): string => {
        const maxAprs: { [key: string]: string } = {
          "1": "15.17",
          "2": "15.17",
          "3": "15.17",
          "4": "15.17",
          "5": "15.17",
          "6": "15.17",
          "7": "15.17",
          "8": "15.17",
          "9": "19.07",
          "10": "15.17",
          "11": "7.87",
          "12": "19.15",
          "13": "15.17",
          "14": "19.18",
          "15": "15.17",
          "16": "10.19",
          "17": "17.23",
          "18": "10.34",
          "19": "5.77",
          "21": "9.97",
        };
        return maxAprs[validatorId] || "15.17";
      };

      // Helper function to get max lock days based on validator ID
      const getMaxLockDays = (validatorId: string): string => {
        const maxLockDays: { [key: string]: string } = {
          "1": "255",
          "2": "255",
          "3": "255",
          "4": "255",
          "5": "255",
          "6": "255",
          "7": "255",
          "8": "255",
          "9": "361",
          "10": "255",
          "11": "57",
          "12": "363",
          "13": "255",
          "14": "364",
          "15": "255",
          "16": "120",
          "17": "311",
          "18": "124",
          "19": "0",
          "21": "114",
        };
        return maxLockDays[validatorId] || "255";
      };

      // Calculate total network stake for voting power
      const totalNetworkStake =
        result.validators?.reduce(
          (sum: number, v: any) =>
            sum + Number.parseFloat(v.totalStakedAmountFormatted || "0"),
          0
        ) || 1;

      return (
        <div className="rounded-lg border border-border bg-card/40 p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Validators Information
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                {result.totalValidators} Active Validators
              </Typography>
            </div>
          </div>

          <div className="max-h-96 space-y-4 overflow-y-auto">
            {result.validators?.map(
              (validator: ValidatorTableData, index: number) => {
                const votingPower =
                  (Number.parseFloat(
                    validator.totalStakedAmountFormatted || "0"
                  ) /
                    totalNetworkStake) *
                  100;

                return (
                  <div
                    className="rounded-lg border bg-background/50 p-4 transition-colors hover:bg-background/70"
                    key={validator.id}
                  >
                    {/* Header with Validator info and Status */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <Typography className="text-base" weight="semibold">
                            Validator {validator.validatorId}
                          </Typography>
                          <Typography className="font-mono text-muted-foreground text-sm">
                            {validator.auth.slice(0, 6)}...
                            {validator.auth.slice(-4)}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <Typography className="font-medium text-green-600 text-sm">
                          Active
                        </Typography>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left Column */}
                      <div className="space-y-3">
                        <div>
                          <Typography className="text-muted-foreground text-sm">
                            Staked (U2U)
                          </Typography>
                          <CountUp
                            abbreviate={false}
                            className="font-bold text-lg"
                            decimals={0}
                            duration={1}
                            value={Number.parseFloat(
                              validator.totalStakedAmountFormatted || "0"
                            )}
                          />
                        </div>

                        <div>
                          <Typography className="text-muted-foreground text-sm">
                            Min.Apr(%)
                          </Typography>
                          <Typography className="font-semibold text-base">
                            5.77
                          </Typography>
                        </div>

                        <div>
                          <Typography className="text-muted-foreground text-sm">
                            Delegators
                          </Typography>
                          <CountUp
                            abbreviate={false}
                            className="font-semibold text-base"
                            decimals={0}
                            duration={1}
                            value={Number.parseInt(validator.totalDelegator)}
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-3 text-right">
                        <div>
                          <Typography className="text-muted-foreground text-sm">
                            Max Lock (Days)
                          </Typography>
                          <Typography className="font-semibold text-base">
                            {getMaxLockDays(validator.validatorId)}
                          </Typography>
                        </div>

                        <div>
                          <Typography className="text-muted-foreground text-sm">
                            Max.Apr(%)
                          </Typography>
                          <Typography className="font-semibold text-base text-green-600">
                            {getMaxApr(validator.validatorId)}
                          </Typography>
                        </div>

                        <div>
                          <Typography className="text-muted-foreground text-sm">
                            VP (%)
                          </Typography>
                          <CountUp
                            abbreviate={false}
                            className="font-semibold text-base"
                            decimals={2}
                            duration={1}
                            value={votingPower}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      );
    }

    case "tool-getStakingStats":
      return (
        <div className="rounded-lg border border-border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Network Staking Statistics
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Overall Network Staking Overview
              </Typography>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Total Staked
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] bg-clip-text font-bold text-sm text-transparent"
                  decimals={2}
                  duration={2}
                  value={Number.parseFloat(result.totalStaked)}
                  variant="h4"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Total Delegated
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="font-semibold text-sm"
                  decimals={2}
                  duration={2}
                  value={Number.parseFloat(result.totalDelegated)}
                  variant="h4"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Typography className="text-sm" color="foreground">
                Total Self Staked
              </Typography>
              <div className="flex items-center gap-2">
                <CountUp
                  abbreviate={true}
                  className="font-semibold text-sm"
                  decimals={2}
                  duration={2}
                  value={Number.parseFloat(result.totalSelfStaked)}
                  variant="h4"
                />
                <Typography className="text-muted-foreground" variant="small">
                  {result.unit}
                </Typography>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded bg-muted/30 p-3 text-center">
                <CountUp
                  abbreviate={false}
                  className="font-bold text-base text-primary"
                  decimals={0}
                  duration={1.5}
                  value={result.totalValidator}
                  variant="h3"
                />
                <Typography
                  className="mt-1 text-muted-foreground text-xs"
                  variant="small"
                >
                  Total Validators
                </Typography>
              </div>
              <div className="rounded bg-muted/30 p-3 text-center">
                <CountUp
                  abbreviate={true}
                  className="font-bold text-base text-primary"
                  decimals={0}
                  duration={1.5}
                  value={result.totalDelegator}
                  variant="h3"
                />
                <Typography
                  className="mt-1 text-muted-foreground text-xs"
                  variant="small"
                >
                  Total Delegators
                </Typography>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      // Fallback: Display raw JSON
      return (
        <div className="rounded-lg border border-border bg-card/40 p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <Typography className="text-base" variant="h3" weight="semibold">
                Raw Data
              </Typography>
              <Typography
                className="text-muted-foreground text-sm"
                variant="small"
              >
                Unformatted Result
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

