"use client";

import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { PositionItem } from "@/features/profile/hooks/use-defi-positions";

// ─── Type badge config (matches portfolio ProtocolPositions) ─────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  vault:  { label: "Vault",   color: "text-violet-400",  bg: "bg-violet-400/10"  },
  supply: { label: "Supply",  color: "text-primary",     bg: "bg-primary/10"     },
  borrow: { label: "Borrow",  color: "text-destructive", bg: "bg-destructive/10" },
  lp:     { label: "LP",      color: "text-amber-400",   bg: "bg-amber-400/10"   },
  stake:  { label: "Staked",  color: "text-violet-400",  bg: "bg-violet-400/10"  },
};

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatRewardAmount(amount: number): string {
  if (amount >= 1) return amount.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return amount.toLocaleString("en-US", { maximumFractionDigits: 7 });
}

// ─── Token pair icon (scaled for sidebar ~320px) ────────────────────────────

function TokenPairIconSmall({
  token0,
  token1,
}: {
  token0: string;
  token1: string;
}) {
  return (
    <div className="relative flex shrink-0" style={{ width: 38, height: 24 }}>
      <TokenImage
        alt={token0}
        className="absolute left-0 bottom-0 h-6 w-6 rounded-full ring-2 ring-card text-[9px]"
      />
      <TokenImage
        alt={token1}
        className="absolute left-[14px] top-0 z-[1] h-6 w-6 rounded-full ring-2 ring-card text-[9px]"
      />
    </div>
  );
}

// ─── Compact position row ───────────────────────────────────────────────────

interface CompactPositionRowProps {
  position: PositionItem;
  isLast?: boolean;
}

export function CompactPositionRow({ position: pos, isLast }: CompactPositionRowProps) {
  const typeConfig = TYPE_CONFIG[pos.type] ?? {
    label: pos.type,
    color: "text-muted-foreground",
    bg: "bg-muted",
  };
  const pair = pos.pair;
  const rewards = pos.rewards;

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted/10",
        !isLast && "border-b border-border/60",
      )}
    >
      {/* Line 1: icon + name + USD value */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {pair ? (
            <TokenPairIconSmall token0={pair.token0} token1={pair.token1} />
          ) : (
            <TokenImage
              alt={pos.asset}
              className="h-6 w-6 shrink-0 rounded-full text-[9px]"
            />
          )}
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground">
              {pair ? `${pair.token0}/${pair.token1}` : pos.name}
            </span>
            {(pair?.poolType || pair?.fee) && (
              <span className="ml-1.5 text-[11px] text-muted-foreground/60">
                {pair.poolType}
                {pair.poolType && pair.fee && " · "}
                {pair.fee}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
          {formatUsd(pos.valueUsd)}
        </span>
      </div>

      {/* Line 2: type badge + APY + allocation */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
            typeConfig.color,
            typeConfig.bg,
          )}
        >
          {typeConfig.label}
        </span>
        {pos.apy !== undefined && pos.apy > 0 && (
          <span className="text-sm font-medium text-emerald-400 tabular-nums">
            {pos.apy.toFixed(2)}% APY
          </span>
        )}
        {pos.allocationPercent !== undefined && pos.allocationPercent > 0 && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {pos.allocationPercent.toFixed(0)}% alloc
          </span>
        )}
      </div>

      {/* Line 3: LP amounts / single asset extra / rewards */}
      {(pair?.pooled0 || pair?.pooled1 || pos.extra || rewards) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {pair?.pooled0 && pair?.pooled1 && (
            <>
              <span className="tabular-nums">{pair.pooled0} {pair.token0}</span>
              <span className="tabular-nums">{pair.pooled1} {pair.token1}</span>
              {pair.shares && (
                <span className="tabular-nums">
                  {pair.shares} shares ({pair.sharePct}%)
                </span>
              )}
            </>
          )}
          {!pair && pos.extra && (
            <span className="tabular-nums">{pos.extra}</span>
          )}
          {rewards && rewards.amount > 0 && (
            <span className="font-medium text-amber-400 tabular-nums">
              {formatRewardAmount(rewards.amount)} {rewards.token}
              {rewards.daily != null && rewards.daily > 0 && (
                <span className="ml-0.5 font-normal text-muted-foreground">
                  (+{formatRewardAmount(rewards.daily)}/day)
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
