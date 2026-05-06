"use client";

import type { PositionItem } from "@/features/profile/hooks/use-defi-positions";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";

// ─── Type badge config ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  vault: { label: "Vault", color: "text-violet-400", bg: "bg-violet-400/10" },
  supply: { label: "Supply", color: "text-primary", bg: "bg-primary/10" },
  borrow: { label: "Borrow", color: "text-destructive", bg: "bg-destructive/10" },
  lp: { label: "LP", color: "text-amber-400", bg: "bg-amber-400/10" },
  stake: { label: "Staked", color: "text-violet-400", bg: "bg-violet-400/10" },
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

// ─── Token pair icon ────────────────────────────────────────────────────────

function TokenPairIconSmall({ token0, token1 }: { token0: string; token1: string }) {
  return (
    <div className="relative flex shrink-0" style={{ width: 44, height: 28 }}>
      <TokenImage
        alt={token0}
        className="absolute bottom-0 left-0 h-7 w-7 rounded-full text-[10px] ring-2 ring-sidebar"
      />
      <TokenImage
        alt={token1}
        className="absolute top-0 left-[18px] z-[1] h-7 w-7 rounded-full text-[10px] ring-2 ring-sidebar"
      />
    </div>
  );
}

// ─── Position card ──────────────────────────────────────────────────────────

interface CompactPositionRowProps {
  position: PositionItem;
}

export function CompactPositionRow({ position: pos }: CompactPositionRowProps) {
  const typeConfig = TYPE_CONFIG[pos.type] ?? {
    label: pos.type,
    color: "text-sidebar-foreground/60",
    bg: "bg-sidebar-accent",
  };
  const pair = pos.pair;
  const rewards = pos.rewards;

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-3 transition-colors hover:bg-sidebar-accent/50">
      {/* Top row: icon + name + value */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {pair ? (
            <TokenPairIconSmall token0={pair.token0} token1={pair.token1} />
          ) : (
            <TokenImage alt={pos.asset} className="h-7 w-7 shrink-0 rounded-full text-[10px]" />
          )}
          <div className="min-w-0">
            <span className="font-medium text-sidebar-foreground text-sm">
              {pair ? `${pair.token0}/${pair.token1}` : pos.name}
            </span>
            {(pair?.poolType || pair?.fee) && (
              <span className="ml-1.5 text-sidebar-foreground/40 text-xs">
                {pair.poolType}
                {pair.poolType && pair.fee && " · "}
                {pair.fee}
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 font-semibold text-sidebar-foreground text-sm tabular-nums">
          {formatUsd(pos.valueUsd)}
        </span>
      </div>

      {/* Middle row: type badge + APY + allocation */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "inline-block rounded-md px-2 py-0.5 font-medium text-[11px]",
            typeConfig.color,
            typeConfig.bg
          )}
        >
          {typeConfig.label}
        </span>
        {pos.apy !== undefined && pos.apy > 0 && (
          <span className="font-medium text-[11px] text-emerald-400 tabular-nums">
            {pos.apy.toFixed(2)}% APY
          </span>
        )}
        {pos.allocationPercent !== undefined && pos.allocationPercent > 0 && (
          <span className="text-[11px] text-sidebar-foreground/50 tabular-nums">
            {pos.allocationPercent.toFixed(0)}% alloc
          </span>
        )}
      </div>

      {/* Bottom row: amounts / rewards */}
      {(pair?.pooled0 || pair?.pooled1 || pos.extra || rewards) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-sidebar-foreground/50">
          {pair?.pooled0 && pair?.pooled1 && (
            <>
              <span className="tabular-nums">
                {pair.pooled0} {pair.token0}
              </span>
              <span className="tabular-nums">
                {pair.pooled1} {pair.token1}
              </span>
              {pair.shares && (
                <span className="tabular-nums">
                  {pair.shares} shares ({pair.sharePct}%)
                </span>
              )}
            </>
          )}
          {!pair && pos.extra && <span className="tabular-nums">{pos.extra}</span>}
          {rewards && rewards.amount > 0 && (
            <span className="font-medium text-amber-400 tabular-nums">
              {formatRewardAmount(rewards.amount)} {rewards.token}
              {rewards.daily != null && rewards.daily > 0 && (
                <span className="ml-0.5 font-normal text-sidebar-foreground/50">
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
