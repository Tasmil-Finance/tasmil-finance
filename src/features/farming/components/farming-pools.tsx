"use client";

import { motion } from "framer-motion";
import { ChevronRight, TrendingUp } from "lucide-react";
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

const POOLS_GRID = "grid grid-cols-[2fr_1fr_1fr_1fr_80px_24px] items-center gap-x-4";

interface FarmingPoolsProps {
  pools: DiscoveredPool[];
  isLoading: boolean;
  assetFilter?: "USDC" | "XLM";
  /**
   * FRAGILE: keys built as `${protocol.toLowerCase()}:${assetSymbol}${pair}` — the
   * SAME shape backend uses for Position.poolName + protocol. Match relies on this
   * derivation parity. Backend follow-up: add poolAddress to PositionResponse for
   * type-safe match.
   */
  inPositionKeys?: Set<string>;
  onSelectPool?: (pool: DiscoveredPool) => void;
}

export function FarmingPools({
  pools,
  isLoading,
  assetFilter,
  inPositionKeys,
  onSelectPool,
}: FarmingPoolsProps) {
  const depositable = pools.filter((p) => !!p.strategyContractAddress);
  const filtered = assetFilter
    ? depositable.filter((p) => p.assetSymbol === assetFilter)
    : depositable;
  const sorted = [...filtered].sort((a, b) => b.currentApy - a.currentApy);

  if (isLoading) {
    return (
      <motion.div className="flex flex-col gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-semibold text-foreground text-xl">Pools</h2>
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
              className={`${POOLS_GRID} border-border border-t px-6 py-3.5`}
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
        <h2 className="font-semibold text-foreground text-xl">Pools</h2>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
          <p className="text-sm">No depositable pools available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-foreground text-xl">Pools</h2>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* Summary header — like TokenList's "Wallet · $3,556.77 10 assets" */}
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium text-base text-foreground">
            Available · {sorted.length} pool{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="h-px bg-border" />

        {/* Column headers */}
        <div data-pools-row="false" className={`${POOLS_GRID} px-6 py-2.5`}>
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Pool
          </span>
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Type
          </span>
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            APY
          </span>
          <span className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            TVL
          </span>
          <span className="text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Risk
          </span>
          <span />
        </div>

        {/* Pool rows */}
        {sorted.map((pool, idx) => {
          const risk = riskBadge(pool.riskScore);
          const typeCn = TYPE_BADGE[pool.poolType] ?? "bg-muted text-muted-foreground";

          return (
            <div
              key={`${pool.id}-${idx}`}
              data-pools-row="true"
              role={onSelectPool ? "button" : undefined}
              tabIndex={onSelectPool ? 0 : undefined}
              onClick={onSelectPool ? () => onSelectPool(pool) : undefined}
              onKeyDown={
                onSelectPool
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectPool(pool);
                      }
                    }
                  : undefined
              }
              className={cn(
                `${POOLS_GRID} border-border border-t px-6 py-3.5 transition-colors hover:bg-muted/20`,
                onSelectPool && "cursor-pointer"
              )}
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">
                      {pool.assetSymbol}
                      {pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""}
                    </span>
                    {inPositionKeys?.has(
                      `${pool.protocol.toLowerCase()}:${pool.assetSymbol}${
                        pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""
                      }`
                    ) && (
                      <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-medium text-[10px] text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs capitalize">{pool.protocol}</span>
                </div>
              </div>

              {/* Type badge */}
              <div>
                <span
                  className={cn(
                    "inline-block rounded-md px-2 py-0.5 font-medium text-sm uppercase",
                    typeCn
                  )}
                >
                  {pool.poolType}
                </span>
              </div>

              {/* APY */}
              <span className="font-medium text-primary text-sm">
                {formatApyPercent(pool.currentApy)}
              </span>

              {/* TVL */}
              <span className="text-right text-foreground text-sm">
                {formatCompactUsd(pool.tvlUsd)}
              </span>

              {/* Risk */}
              <div className="flex justify-end">
                <span
                  className={cn("rounded-md px-1.5 py-0.5 font-medium text-xs", risk.className)}
                >
                  {risk.label}
                </span>
              </div>

              {/* Chevron — affordance for click */}
              <div className="flex justify-end">
                {onSelectPool && <ChevronRight className="h-4 w-4 text-muted-foreground/50" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
