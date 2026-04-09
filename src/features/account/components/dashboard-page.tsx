"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Loader2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { useWalletStore } from "@/store/use-wallet";

import { useActivity, usePosition } from "../hooks/use-account-api";
import type { ActivityItem } from "../types";
import { PositionList } from "./position-list";

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

const ACTIVITY_LABEL: Record<string, string> = {
  DEPLOY: "Account Created",
  FUND: "Deposit",
  REBALANCE: "Rebalance",
  HARVEST: "Harvest",
  REVOKE: "Bot Revoked",
  WITHDRAW: "Withdrawal",
  PRESET_CHANGE: "Strategy Changed",
  HALT: "Bot Halted",
  RESUME: "Bot Resumed",
};

export function DashboardPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? undefined;

  const { data: position, isLoading: positionLoading } = usePosition(publicKey);
  const { data: activities, isLoading: activitiesLoading } = useActivity(publicKey);

  // Redirect to onboarding if no position data after loading
  useEffect(() => {
    if (!positionLoading && !position && publicKey) {
      router.replace("/account");
    }
  }, [positionLoading, position, publicKey, router]);

  // Not connected
  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to view your portfolio.
        </p>
      </div>
    );
  }

  // Loading
  if (positionLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No position data -- redirect handled by useEffect
  if (!position) {
    return null;
  }

  const profitPositive = position.profitUsd >= 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-1 font-bold text-3xl text-foreground">Portfolio</h1>
        <p className="text-muted-foreground text-sm">Your managed account overview.</p>
      </div>

      {/* Summary card */}
      <Card className="mb-8 border-border bg-muted/10">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {/* Total value */}
            <div>
              <span className="text-muted-foreground text-xs">Total Value</span>
              <p className="font-bold font-mono text-2xl text-foreground">
                {formatUsd(position.totalValueUsd)}
              </p>
            </div>

            {/* Profit / Loss */}
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

            {/* Current APY */}
            <div>
              <span className="text-muted-foreground text-xs">Current APY</span>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <p className="font-mono font-semibold text-emerald-400 text-lg">
                  {position.currentApy.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Preset */}
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

      {/* Positions */}
      <div className="mb-8">
        <h2 className="mb-4 font-semibold text-foreground text-lg">Positions</h2>
        <PositionList positions={position.positions} />
        {position.gasReserveUsd > 0 && (
          <p className="mt-2 text-muted-foreground text-xs">
            Gas reserve: {formatUsd(position.gasReserveUsd)}
          </p>
        )}
      </div>

      <Separator className="mb-8" />

      {/* Activity */}
      <div className="mb-8">
        <h2 className="mb-4 font-semibold text-foreground text-lg">Recent Activity</h2>
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 10).map((activity) => (
              <ActivityRow key={activity.id} activity={activity} />
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

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const label = ACTIVITY_LABEL[activity.type] ?? activity.type;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-4 py-3">
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
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
      <span className="shrink-0 text-muted-foreground text-xs">
        {formatTimestamp(activity.createdAt)}
      </span>
    </div>
  );
}
