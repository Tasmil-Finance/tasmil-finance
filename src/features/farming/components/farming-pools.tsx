"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { Skeleton } from "@/shared/ui/skeleton";
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
  if (score <= 3) return { label: "Low", className: "bg-primary/10 text-primary" };
  if (score <= 6) return { label: "Medium", className: "bg-muted/30 text-muted-foreground" };
  if (score <= 8) return { label: "High", className: "bg-destructive/10 text-destructive" };
  return { label: "Critical", className: "bg-destructive/15 text-destructive" };
}

const TYPE_BADGE: Record<string, string> = {
  lending: "bg-primary/10 text-primary",
  backstop: "bg-muted/30 text-muted-foreground",
  lp: "bg-primary/10 text-primary",
};

const POOLS_GRID = "grid grid-cols-[2fr_1fr_1fr_1fr_80px] items-center gap-x-4";

interface FarmingPoolsProps {
  pools: DiscoveredPool[];
  isLoading: boolean;
  assetFilter?: "USDC" | "XLM";
}

export function FarmingPools({ pools, isLoading, assetFilter }: FarmingPoolsProps) {
  const depositable = pools.filter((p) => !!p.strategyContractAddress);
  const filtered = assetFilter
    ? depositable.filter((p) => p.assetSymbol === assetFilter)
    : depositable;
  const sorted = [...filtered].sort((a, b) => b.currentApy - a.currentApy);

  if (isLoading) {
    return (
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
              data-pools-row="true"
              className={`${POOLS_GRID} border-t border-border px-6 py-3.5`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
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
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-medium text-foreground">
            Available · {sorted.length} pool{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-px bg-border" />

        {/* Column headers */}
        <div data-pools-row="false" className={`${POOLS_GRID} px-6 py-2.5`}>
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
              data-pools-row="true"
              className={`${POOLS_GRID} border-t border-border px-6 py-3.5 transition-colors hover:bg-muted/20`}
            >
              {/* Pool name + token pair images */}
              <div className="flex items-center gap-3">
                <div className="relative flex shrink-0">
                  <TokenImage alt={pool.assetSymbol} className="h-7 w-7 rounded-full" />
                  {pool.pairedAssetSymbol && (
                    <TokenImage
                      alt={pool.pairedAssetSymbol}
                      className="-ml-2 h-7 w-7 rounded-full ring-2 ring-card"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {pool.assetSymbol}
                    {pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""}
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">{pool.protocol}</span>
                </div>
              </div>

              {/* Type badge */}
              <div>
                <span
                  className={cn(
                    "inline-block rounded-md px-2 py-0.5 text-sm font-medium uppercase",
                    typeCn
                  )}
                >
                  {pool.poolType}
                </span>
              </div>

              {/* APY */}
              <span className="text-sm font-medium text-primary">
                {formatApyPercent(pool.currentApy)}
              </span>

              {/* TVL */}
              <span className="text-right text-sm text-foreground">
                {formatCompactUsd(pool.tvlUsd)}
              </span>

              {/* Risk */}
              <div className="flex justify-end">
                <span
                  className={cn("rounded-md px-1.5 py-0.5 text-xs font-medium", risk.className)}
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
