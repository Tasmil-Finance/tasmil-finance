"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  Tractor,
  TrendingUp,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { useWalletStore } from "@/store/use-wallet";

import { useActivity, usePosition } from "@/features/account/hooks/use-account-api";
import type { ActivityItem } from "@/features/account/types";
import { usePools, useRebalanceStatus } from "../hooks/use-farming-api";
import type { DiscoveredPool } from "../types";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatCompactUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return formatUsd(value);
}

const ACTIVITY_LABEL: Record<string, string> = {
  DEPLOY: "Account Created",
  FUND: "Deposit",
  REBALANCE: "Rebalance",
  HARVEST: "Harvest",
  DEPOSIT: "Deposit",
  WITHDRAW: "Withdrawal",
  HALT: "Bot Halted",
  RESUME: "Bot Resumed",
  PRESET_CHANGE: "Strategy Changed",
  REVOKE: "Bot Revoked",
  BACKSTOP_QUEUE: "Backstop Queued",
  BACKSTOP_EXIT: "Backstop Exit",
};

const POOL_TYPE_COLOR: Record<string, string> = {
  lending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  backstop: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  lp: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

function riskLabel(score: number): { label: string; color: string } {
  if (score <= 3) return { label: "Low", color: "text-emerald-400" };
  if (score <= 6) return { label: "Medium", color: "text-yellow-400" };
  if (score <= 8) return { label: "High", color: "text-orange-400" };
  return { label: "Critical", color: "text-red-400" };
}

export function FarmingPage() {
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const { data: position, isLoading: positionLoading } = usePosition(publicKey);
  const { data: status, isLoading: statusLoading } = useRebalanceStatus();
  const { data: pools, isLoading: poolsLoading } = usePools(
    "USDC",
    position?.preset?.toUpperCase() ?? "BALANCED",
  );
  const { data: activities, isLoading: activitiesLoading } = useActivity(publicKey);

  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to view the farming agent.
        </p>
      </div>
    );
  }

  if (statusLoading || poolsLoading || positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No managed account yet — prompt to set up
  if (!position) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Tractor className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">No Farming Account</h2>
        <p className="mb-6 text-muted-foreground">
          Set up a managed smart account to start automated yield farming.
        </p>
        <Button variant="gradient" size="lg" asChild>
          <Link href="/account">Get Started</Link>
        </Button>
      </div>
    );
  }

  const eligiblePools = pools ?? [];
  const totalTvl = eligiblePools.reduce((sum, p) => sum + p.tvlUsd, 0);
  const profitPositive = position.profitUsd >= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
            <Tractor className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-bold text-3xl text-foreground">Farming Agent</h1>
            <p className="text-muted-foreground text-sm">
              Automated yield farming powered by AI rebalancing.
            </p>
          </div>
        </div>
      </div>

      {/* Bot Status Banner */}
      <BotStatusBanner status={status} />

      {/* Account Summary */}
      <Card className="mb-8 border-border bg-muted/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-5">
            <div>
              <span className="text-muted-foreground text-xs">Total Value</span>
              <p className="font-bold font-mono text-2xl text-foreground">
                {formatUsd(position.totalValueUsd)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Amount Funded</span>
              <p className="font-mono font-semibold text-foreground text-lg">
                {formatUsd(position.totalDepositedUsd)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Profit / Loss</span>
              <div className="flex items-center gap-1.5">
                {profitPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-400" />
                )}
                <p
                  className={cn(
                    "font-mono font-semibold text-lg",
                    profitPositive ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  {formatUsd(Math.abs(position.profitUsd))}
                </p>
                <span
                  className={cn(
                    "text-xs",
                    profitPositive ? "text-emerald-400/70" : "text-red-400/70",
                  )}
                >
                  ({profitPositive ? "+" : "-"}
                  {Math.abs(position.profitPercent).toFixed(2)}%)
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Current APY</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="font-mono font-semibold text-emerald-400 text-lg">
                  {position.currentApy.toFixed(2)}%
                </p>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Strategy</span>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-lg">{position.preset}</p>
                <Link
                  href="/account"
                  className="text-primary text-xs underline underline-offset-2 hover:text-primary/80"
                >
                  Change
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocol Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          label="Tracked Pools"
          value={String(eligiblePools.length)}
          icon={<Activity className="h-4 w-4 text-blue-400" />}
        />
        <StatCard
          label="Protocol TVL"
          value={formatCompactUsd(totalTvl)}
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
        />
        <StatCard
          label="Gas Reserve"
          value={formatUsd(position.gasReserveUsd)}
          icon={<Zap className="h-4 w-4 text-yellow-400" />}
        />
      </div>

      {/* Current Allocation */}
      {position.positions.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 font-semibold text-foreground text-lg">Current Allocation</h2>
          <AllocationTable positions={position.positions} />
        </div>
      )}

      <Separator className="mb-8" />

      {/* Pool Registry */}
      <div className="mb-8">
        <h2 className="mb-4 font-semibold text-foreground text-lg">Pool Registry</h2>
        {eligiblePools.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No pools discovered yet. The agent scans every 10 minutes.
          </p>
        ) : (
          <PoolTable pools={eligiblePools} />
        )}
      </div>

      <Separator className="mb-8" />

      {/* Agent Activity */}
      <div className="mb-8">
        <h2 className="mb-4 font-semibold text-foreground text-lg">Agent Activity</h2>
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            No activity yet.
          </p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 20).map((activity) => (
              <FarmingActivityRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="gradient" size="lg" className="h-12 flex-1" asChild>
          <Link href="/account">Deposit More</Link>
        </Button>
        <Button variant="outline" size="lg" className="h-12 flex-1" asChild>
          <Link href="/account/settings">Withdraw</Link>
        </Button>
      </div>
    </div>
  );
}

function BotStatusBanner({
  status,
}: {
  status: { ready: boolean; halted: boolean; haltReason: string | null } | undefined;
}) {
  if (!status) return null;

  const isActive = status.ready && !status.halted;
  const isHalted = status.halted;

  return (
    <Card
      className={cn(
        "mb-8 border",
        isActive
          ? "border-emerald-500/30 bg-emerald-500/5"
          : isHalted
            ? "border-red-500/30 bg-red-500/5"
            : "border-yellow-500/30 bg-yellow-500/5",
      )}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            isActive
              ? "bg-emerald-500/20"
              : isHalted
                ? "bg-red-500/20"
                : "bg-yellow-500/20",
          )}
        >
          {isActive ? (
            <Play className="h-5 w-5 text-emerald-400" />
          ) : isHalted ? (
            <Pause className="h-5 w-5 text-red-400" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {isActive ? "Agent Active" : isHalted ? "Agent Halted" : "Agent Initializing"}
            </span>
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                isActive ? "animate-pulse bg-emerald-400" : isHalted ? "bg-red-400" : "bg-yellow-400",
              )}
            />
          </div>
          <p className="text-muted-foreground text-sm">
            {isActive
              ? "Monitoring pools and rebalancing automatically."
              : isHalted
                ? `Halted: ${status.haltReason ?? "Unknown reason"}`
                : "Waiting for session key initialization."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-muted/10">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
        <p className="font-mono font-semibold text-foreground text-lg">{value}</p>
      </CardContent>
    </Card>
  );
}

function AllocationTable({
  positions,
}: {
  positions: {
    poolName: string;
    poolType: string;
    protocol: string;
    allocationPercent: number;
    valueUsd: number;
    apy: number;
    q4wExpiresAt?: string;
  }[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="px-4 py-3 text-left text-muted-foreground text-xs font-medium">Pool</th>
            <th className="px-4 py-3 text-left text-muted-foreground text-xs font-medium">Type</th>
            <th className="px-4 py-3 text-right text-muted-foreground text-xs font-medium">Weight</th>
            <th className="px-4 py-3 text-right text-muted-foreground text-xs font-medium">Value</th>
            <th className="px-4 py-3 text-right text-muted-foreground text-xs font-medium">APY</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr
              key={`${pos.poolName}-${pos.protocol}`}
              className="border-b border-border/50 last:border-0"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">{pos.poolName}</span>
                  <span className="text-muted-foreground text-xs">{pos.protocol}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge
                  className={cn(
                    "text-[10px]",
                    POOL_TYPE_COLOR[pos.poolType] ?? "bg-muted text-muted-foreground",
                  )}
                >
                  {pos.poolType}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted/30 sm:block">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${Math.min(pos.allocationPercent, 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-foreground text-sm">
                    {pos.allocationPercent.toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-foreground text-sm">
                  {formatUsd(pos.valueUsd)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <span className="font-mono text-emerald-400 text-sm">
                  {pos.apy.toFixed(2)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PoolTable({ pools }: { pools: DiscoveredPool[] }) {
  const sorted = [...pools].sort((a, b) => b.currentApy - a.currentApy);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            <th className="px-4 py-3 text-left text-muted-foreground text-xs font-medium">Pool</th>
            <th className="px-4 py-3 text-left text-muted-foreground text-xs font-medium">Protocol</th>
            <th className="px-4 py-3 text-left text-muted-foreground text-xs font-medium">Type</th>
            <th className="px-4 py-3 text-right text-muted-foreground text-xs font-medium">APY</th>
            <th className="px-4 py-3 text-right text-muted-foreground text-xs font-medium">TVL</th>
            <th className="hidden px-4 py-3 text-right text-muted-foreground text-xs font-medium sm:table-cell">
              Risk
            </th>
            <th className="hidden px-4 py-3 text-right text-muted-foreground text-xs font-medium md:table-cell">
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((pool) => {
            const risk = riskLabel(pool.riskScore);
            return (
              <tr
                key={pool.id}
                className="border-b border-border/50 last:border-0"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground text-sm">
                    {pool.assetSymbol}
                    {pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-muted-foreground text-sm capitalize">{pool.protocol}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={cn(
                      "text-[10px]",
                      POOL_TYPE_COLOR[pool.poolType] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {pool.poolType}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-emerald-400 text-sm">
                    {pool.currentApy.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-foreground text-sm">
                    {formatCompactUsd(pool.tvlUsd)}
                  </span>
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={cn("font-mono text-sm", risk.color)}>
                      {pool.riskScore}
                    </span>
                    <span className={cn("text-xs", risk.color)}>{risk.label}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-right md:table-cell">
                  <span className="text-muted-foreground text-xs">
                    {formatTimestamp(pool.lastUpdated)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FarmingActivityRow({ activity }: { activity: ActivityItem }) {
  const label = ACTIVITY_LABEL[activity.type] ?? activity.type;

  const icon =
    activity.type === "REBALANCE" ? (
      <ArrowUpRight className="h-4 w-4 text-blue-400" />
    ) : activity.type === "HARVEST" ? (
      <Zap className="h-4 w-4 text-yellow-400" />
    ) : activity.type === "HALT" ? (
      <XCircle className="h-4 w-4 text-red-400" />
    ) : activity.type === "RESUME" ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    ) : (
      <Clock className="h-4 w-4 text-muted-foreground" />
    );

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm">{label}</span>
          {activity.amount != null && activity.token && (
            <Badge variant="secondary" className="text-[10px]">
              {activity.amount} {activity.token}
            </Badge>
          )}
        </div>
        {activity.detail && (
          <span className="text-muted-foreground text-xs">{activity.detail}</span>
        )}
      </div>
      {activity.txHash && (
        <a
          href={`https://stellar.expert/explorer/testnet/tx/${activity.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary text-xs hover:underline"
        >
          TX
        </a>
      )}
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatTimestamp(activity.createdAt)}
      </span>
    </div>
  );
}
