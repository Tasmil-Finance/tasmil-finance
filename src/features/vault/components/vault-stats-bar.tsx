"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

import type { VaultStats } from "../types";

interface VaultStatsBarProps {
  stats?: VaultStats;
  isLoading: boolean;
  className?: string;
}

function formatTvl(raw: string): string {
  const num = Number.parseFloat(raw);
  if (Number.isNaN(num)) return raw;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function VaultStatsBar({ stats, isLoading, className }: VaultStatsBarProps) {
  if (isLoading || !stats) {
    return (
      <div className={cn("flex gap-6 rounded-xl border border-border bg-muted/30 p-4", className)}>
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-wrap gap-6 rounded-xl border border-border bg-muted/30 p-4",
        className,
      )}
    >
      <div>
        <div className="text-muted-foreground text-xs uppercase tracking-wider">APY</div>
        <div className="font-mono font-bold text-green-500 text-lg">
          {stats.currentApy.toFixed(2)}%
        </div>
      </div>
      <div>
        <div className="text-muted-foreground text-xs uppercase tracking-wider">TVL</div>
        <div className="font-mono font-bold text-foreground text-lg">
          {formatTvl(stats.totalTvl)}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground text-xs uppercase tracking-wider">Depositors</div>
        <div className="font-mono font-bold text-foreground text-lg">{stats.totalDepositors}</div>
      </div>
    </div>
  );
}
