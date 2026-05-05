"use client";

import { TokenImage } from "@/shared/components/token-image";
import { Button } from "@/shared/ui/button-v2";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
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

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatApyPercent(apyDecimal: number): string {
  return `${(apyDecimal * 100).toFixed(2)}%`;
}

function riskLabel(score: number): string {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  if (score <= 8) return "High";
  return "Critical";
}

interface PoolDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pool: DiscoveredPool | null;
  userPositionUsd: number;
  isRevoked: boolean;
  /** pool argument unused by handler today; kept for Phase 2 per-pool routing */
  onDeposit: (pool: DiscoveredPool) => void;
  /** pool argument unused by handler today; kept for Phase 2 per-pool routing */
  onWithdraw: (pool: DiscoveredPool) => void;
}

export function PoolDetailDrawer({
  open,
  onOpenChange,
  pool,
  userPositionUsd,
  isRevoked,
  onDeposit,
  onWithdraw,
}: PoolDetailDrawerProps) {
  if (!pool) return null;

  const pairLabel = `${pool.assetSymbol}${
    pool.pairedAssetSymbol ? `/${pool.pairedAssetSymbol}` : ""
  }`;
  const hasPosition = userPositionUsd > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex shrink-0">
              <TokenImage alt={pool.assetSymbol} className="h-9 w-9 rounded-full" />
              {pool.pairedAssetSymbol && (
                <TokenImage
                  alt={pool.pairedAssetSymbol}
                  className="-ml-2.5 h-9 w-9 rounded-full ring-2 ring-card"
                />
              )}
            </div>
            <div className="flex flex-col text-left">
              <SheetTitle>
                {pairLabel} · <span className="capitalize">{pool.protocol}</span>
              </SheetTitle>
              <SheetDescription className="text-xs uppercase tracking-wider">
                {pool.poolType} · Risk: {riskLabel(pool.riskScore)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">APY</p>
            <p className="mt-1 font-mono font-semibold text-lg text-primary">
              {formatApyPercent(pool.currentApy)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">TVL</p>
            <p className="mt-1 font-mono font-semibold text-foreground text-lg">
              {formatCompactUsd(pool.tvlUsd)}
            </p>
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Type</p>
            <p className="mt-1 font-medium text-foreground text-sm capitalize">{pool.poolType}</p>
          </div>
          <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Asset</p>
            <p className="mt-1 font-medium text-foreground text-sm">{pool.assetSymbol}</p>
          </div>
        </div>

        {hasPosition && (
          <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-widest">
              Your Position
            </p>
            <p className="mt-1 font-bold font-mono text-2xl text-foreground">
              {formatUsd(userPositionUsd)}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="gradient" size="lg" className="w-full" onClick={() => onDeposit(pool)}>
            {isRevoked ? "Reactivate Session" : "Deposit"}
          </Button>
          {hasPosition && !isRevoked && (
            <Button variant="outline" size="lg" className="w-full" onClick={() => onWithdraw(pool)}>
              Withdraw
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
