"use client";

import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import type { DiscoveredPool } from "../types";

function formatCompactUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatApyPercent(apyDecimal: number): string {
  return `${(apyDecimal * 100).toFixed(2)}%`;
}

function riskBadge(score: number): { label: string; className: string } {
  if (score <= 3) return { label: "Low", className: "bg-emerald-500/10 text-emerald-400" };
  if (score <= 6) return { label: "Medium", className: "bg-yellow-500/10 text-yellow-400" };
  if (score <= 8) return { label: "High", className: "bg-orange-500/10 text-orange-400" };
  return { label: "Critical", className: "bg-red-500/10 text-red-400" };
}

const TYPE_BADGE: Record<string, string> = {
  lending: "bg-blue-500/10 text-blue-400",
  backstop: "bg-purple-500/10 text-purple-400",
  lp: "bg-teal-500/10 text-teal-400",
};

const ROW_GRID = "grid grid-cols-[2fr_1fr_1.2fr_1fr_20px] items-center gap-x-4";

interface FarmingPoolsProps {
  pools: DiscoveredPool[];
  isLoading: boolean;
}

export function FarmingPools({ pools, isLoading }: FarmingPoolsProps) {
  const depositable = pools.filter((p) => !!p.strategyContractAddress);
  const sorted = [...depositable].sort((a, b) => b.currentApy - a.currentApy);

  if (isLoading) {
    return (
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-xl font-semibold text-foreground">Pools</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 px-6 py-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="h-px bg-border" />
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className={`${ROW_GRID} border-t border-border px-6 py-3.5`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-4 w-14" />
              <div />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">Pools</h2>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
          <p className="text-sm">No depositable pools available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-foreground">Pools</h2>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Summary header — like TokenList's "Wallet · $3,556.77 10 assets" */}
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-base font-medium text-foreground">
            Available · {sorted.length} pool{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-px bg-border" />

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center gap-x-4 px-6 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pool
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Type
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            APY
          </span>
          <span className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            TVL
          </span>
          <span className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Risk
          </span>
        </div>

        {/* Pool rows */}
        {sorted.map((pool, idx) => {
          const risk = riskBadge(pool.riskScore);
          const typeCn = TYPE_BADGE[pool.poolType] ?? "bg-muted text-muted-foreground";

          return (
            <div
              key={`${pool.id}-${idx}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center gap-x-4 border-t border-border px-6 py-3.5 transition-colors hover:bg-muted/20"
            >
              {/* Pool name + protocol */}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {pool.assetSymbol}
                  {pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""}
                </span>
                <span className="text-sm capitalize text-muted-foreground">{pool.protocol}</span>
              </div>

              {/* Type badge */}
              <div>
                <span
                  className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-sm font-medium uppercase",
                    typeCn,
                  )}
                >
                  {pool.poolType}
                </span>
              </div>

              {/* APY */}
              <span className="text-sm font-medium text-emerald-400">
                {formatApyPercent(pool.currentApy)}
              </span>

              {/* TVL */}
              <span className="text-right text-sm text-foreground">
                {formatCompactUsd(pool.tvlUsd)}
              </span>

              {/* Risk */}
              <div className="flex justify-end">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs font-medium",
                    risk.className,
                  )}
                >
                  {risk.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
