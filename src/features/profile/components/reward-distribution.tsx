"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ChevronDown, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityItem, PerPoolReward } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { useAccountActivityInfinite } from "../hooks/use-account-activity-infinite";
import { useDefiPositions } from "../hooks/use-defi-positions";
import { ActivityRow } from "./activity-row";
import { KpiGrid } from "./kpi-grid";
import { SectionHeader } from "./section-header";

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface RewardDistributionProps {
  walletAddress: string;
}

export function RewardDistribution({ walletAddress }: RewardDistributionProps) {
  const { activities, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } =
    useAccountActivityInfinite(walletAddress, "reward");
  const { groups, isLoading: positionsLoading } = useDefiPositions(walletAddress);

  const summary = useMemo(() => {
    let lifetimeUsd = 0;
    let lastHarvestAt: Date | null = null;
    const byToken = new Map<string, number>();
    for (const a of activities) {
      if (a.amountUsd) lifetimeUsd += a.amountUsd;
      const ts = new Date(a.createdAt);
      if (!lastHarvestAt || ts > lastHarvestAt) lastHarvestAt = ts;
      for (const p of a.metadata?.perPool ?? []) {
        byToken.set(p.token, (byToken.get(p.token) ?? 0) + p.amount);
      }
    }
    return {
      lifetimeUsd,
      lastHarvestAt,
      byToken,
      count: activities.length,
    };
  }, [activities]);

  const pending = useMemo(() => {
    const byToken = new Map<string, number>();
    for (const g of groups) {
      if (g.rewards && g.rewards.amount > 0) {
        byToken.set(g.rewards.token, (byToken.get(g.rewards.token) ?? 0) + g.rewards.amount);
      }
    }
    if (byToken.size === 0) return null;
    const sorted = Array.from(byToken.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? { token: sorted[0][0], amount: sorted[0][1] } : null;
  }, [groups]);

  const tokenChips = useMemo(
    () => Array.from(summary.byToken.entries()).sort((a, b) => b[1] - a[1]),
    [summary.byToken],
  );

  const avgPerHarvest = summary.count > 0 ? summary.lifetimeUsd / summary.count : 0;

  const kpiCells = [
    {
      label: "Pending",
      value: pending
        ? `${pending.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${pending.token}`
        : "—",
      sub: pending ? "claimable" : undefined,
      loading: positionsLoading && groups.length === 0,
    },
    {
      label: "Lifetime",
      value: USD_FORMATTER.format(summary.lifetimeUsd),
      sub: "claimed",
      loading: isLoading,
    },
    {
      label: "Harvests",
      value: String(summary.count),
      sub: summary.count > 0 ? `avg ${USD_FORMATTER.format(avgPerHarvest)}` : "—",
      loading: isLoading,
    },
    {
      label: "Last harvest",
      value: summary.lastHarvestAt
        ? `${formatDistanceToNowStrict(summary.lastHarvestAt)} ago`
        : "—",
      sub: summary.lastHarvestAt
        ? summary.lastHarvestAt.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
      loading: isLoading,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <SectionHeader
          title="Reward Distribution"
          subtitle="Auto-harvested every 4h · BLND emissions from Blend lending positions"
        />
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          Could not load rewards: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader
        title="Reward Distribution"
        subtitle="Auto-harvested every 4h · BLND emissions from Blend lending positions"
      />

      <KpiGrid cells={kpiCells} />

      {tokenChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-muted-foreground text-xs">By token:</span>
          {tokenChips.map(([token, amount]) => (
            <span
              key={token}
              className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-300 text-xs tabular-nums"
            >
              {amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {token}
            </span>
          ))}
        </div>
      )}

      {isLoading && activities.length === 0 ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : activities.length === 0 ? (
        <EmptyRewards />
      ) : (
        <div className="flex flex-col gap-2">
          {activities.map((a) => (
            <HarvestRow key={a.id} activity={a} />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
          className="self-center rounded-full border border-border bg-card px-4 py-1.5 font-medium text-muted-foreground text-xs hover:bg-muted/30 disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

function HarvestRow({ activity }: { activity: ActivityItem }) {
  const [open, setOpen] = useState(false);
  const perPool = activity.metadata?.perPool ?? [];
  const hasBreakdown = perPool.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <ActivityRow activity={activity} />
      {hasBreakdown && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Harvest details"
            aria-expanded={open}
            className="flex w-full items-center justify-center gap-1 border-border border-t px-3 py-1.5 text-muted-foreground text-xs hover:bg-muted/30"
          >
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
            {open
              ? "Hide breakdown"
              : `Show ${perPool.length} pool${perPool.length === 1 ? "" : "s"}`}
          </button>
          {open && <PerPoolTable rows={perPool} />}
        </>
      )}
    </div>
  );
}

function PerPoolTable({ rows }: { rows: PerPoolReward[] }) {
  return (
    <div className="border-border border-t">
      {rows.map((r, i) => (
        <div
          key={`${r.poolId}-${i}`}
          className="flex items-center justify-between px-5 py-2 text-muted-foreground text-xs"
        >
          <span className="capitalize">{r.protocol}</span>
          <span className="text-emerald-400 tabular-nums">
            +{r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {r.token}
            {r.amountUsd != null && (
              <span className="ml-2 text-muted-foreground">
                (${r.amountUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })})
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyRewards() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
      <Clock className="h-8 w-8 opacity-40" />
      <p className="text-sm">No rewards harvested yet — auto-harvest runs every 4 h.</p>
    </div>
  );
}
