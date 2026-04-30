"use client";

import { ChevronDown, Layers, Loader2 } from "lucide-react";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { TokenImage } from "@/shared/components/token-image";
import { PROTOCOL_ICONS as CDN_PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";
import { cn } from "@/lib/utils";
import type { ProtocolPositionGroup, PositionItem } from "../hooks/use-defi-positions";

// ─── Protocol icon mapping ───────────────────────────────────────────────────

const PROTOCOL_ICONS: Record<string, string> = {
  "tasmil-vault": CDN_PROTOCOL_ICONS.tasmil!,
  blend:      CDN_PROTOCOL_ICONS.blend!,
  soroswap:   CDN_PROTOCOL_ICONS.soroswap!,
  aquarius:   CDN_PROTOCOL_ICONS.aquarius!,
  phoenix:    CDN_PROTOCOL_ICONS.phoenix!,
  defindex:   CDN_PROTOCOL_ICONS.defindex!,
  sdex:       CDN_PROTOCOL_ICONS.sdex!,
  templar:    CDN_PROTOCOL_ICONS.templar!,
  allbridge:  CDN_PROTOCOL_ICONS.allbridge!,
};

function getProtocolIcon(protocol: string): string | null {
  if (PROTOCOL_ICONS[protocol]) return PROTOCOL_ICONS[protocol]!;
  const prefix = protocol.split("-")[0];
  if (prefix && PROTOCOL_ICONS[prefix]) return PROTOCOL_ICONS[prefix]!;
  return null;
}

/** Small icon shown next to each pool sub-header. */
const POOL_ICONS: Record<string, string> = {
  blend: "/images/common/pool-blend.png",
};

const PROTOCOL_NAMES: Record<string, string> = {
  blend: "Blend Protocol",
  "tasmil-vault": "Tasmil Vault",
  soroswap: "Soroswap",
  aquarius: "Aquarius",
  phoenix: "Phoenix",
};

// ─── Type badge ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  vault:  { label: "Vault",   color: "text-violet-400",  bg: "bg-violet-400/10"  },
  supply: { label: "Supply",  color: "text-primary",     bg: "bg-primary/10"     },
  borrow: { label: "Borrow",  color: "text-destructive", bg: "bg-destructive/10" },
  lp:     { label: "LP",      color: "text-amber-400",   bg: "bg-amber-400/10"   },
  stake:  { label: "Staked",  color: "text-violet-400",  bg: "bg-violet-400/10"  },
};

function TypeBadge({ type }: { type: PositionItem["type"] }) {
  const config = TYPE_CONFIG[type] ?? {
    label: type,
    color: "text-muted-foreground",
    bg: "bg-muted",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 text-xs font-medium",
        config.color,
        config.bg,
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Token pair icon (two overlapping circles for LP) ────────────────────────

function TokenPairIcon({
  token0,
  token1,
  size = "h-7 w-7",
}: {
  token0: string;
  token1: string;
  size?: string;
}) {
  return (
    <div className="relative flex shrink-0" style={{ width: 44, height: 28 }}>
      <TokenImage
        alt={token0}
        className={cn(size, "absolute left-0 bottom-0 rounded-full ring-2 ring-card text-[9px]")}
      />
      <TokenImage
        alt={token1}
        className={cn(size, "absolute left-[18px] top-0 z-[1] rounded-full ring-2 ring-card text-[9px]")}
      />
    </div>
  );
}

// ─── Position row content (handles single token + LP pair) ──────────────────

function PositionAssetCell({ pos }: { pos: PositionItem }) {
  const pair = pos.pair;

  if (pair) {
    return (
      <div className="flex items-center gap-3">
        <TokenPairIcon token0={pair.token0} token1={pair.token1} />
        <div className="flex flex-col">
          <span className="text-base font-medium text-foreground">
            {pair.token0}/{pair.token1}
          </span>
          {(pair.poolType || pair.fee) && (
            <div className="flex items-center gap-1.5">
              {pair.poolType && (
                <span className="text-[11px] font-medium text-muted-foreground/70">
                  {pair.poolType}
                </span>
              )}
              {pair.fee && (
                <span className="text-[11px] text-muted-foreground/50">
                  {pair.fee}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <TokenImage
        alt={pos.asset}
        className="h-7 w-7 shrink-0 rounded-full text-[10px]"
      />
      <span className="text-base font-medium text-foreground">
        {pos.name}
      </span>
    </div>
  );
}

function PositionAmountCell({ pos }: { pos: PositionItem }) {
  const pair = pos.pair;

  if (pair && pair.pooled0 && pair.pooled1) {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-foreground">
          {pair.pooled0} {pair.token0}
        </span>
        <span className="text-sm text-foreground">
          {pair.pooled1} {pair.token1}
        </span>
        {pair.shares && (
          <span className="text-xs text-muted-foreground">
            {pair.shares} shares ({pair.sharePct}%)
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="text-base text-foreground">
      {pos.extra ?? pos.asset}
    </span>
  );
}

// ─── Formatters ──────────────────────────────────────────────────────────────

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

function PositionRewardsCell({ pos, groupRewards }: { pos: PositionItem; groupRewards?: { amount: number; token: string } }) {
  const rewards = pos.rewards ?? groupRewards;
  if (!rewards || rewards.amount <= 0) return <span className="text-sm text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col">
      <span className="text-sm font-medium text-amber-400">
        {formatRewardAmount(rewards.amount)} {rewards.token}
      </span>
      {pos.rewards?.daily != null && pos.rewards.daily > 0 && (
        <span className="text-xs text-muted-foreground">
          +{formatRewardAmount(pos.rewards.daily)}/day
        </span>
      )}
    </div>
  );
}

/** Extract pool name from group displayName: "Blend · TestnetV2" → "TestnetV2" */
function extractPoolName(displayName: string): string {
  const parts = displayName.split(" · ");
  return parts.length > 1 ? parts.slice(1).join(" · ") : displayName;
}

// ─── Pie chart colors ────────────────────────────────────────────────────────

const PIE_COLORS = [
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
];

// ─── Grid layout ─────────────────────────────────────────────────────────────

const POS_GRID = "grid grid-cols-[2fr_80px_80px_1fr_1.2fr_1fr] items-center gap-x-3";

// ─── Group by protocol ───────────────────────────────────────────────────────

interface ProtocolCard {
  protocol: string;
  displayName: string;
  totalPositions: number;
  totalValueUsd: number;
  pools: ProtocolPositionGroup[];
  pnl?: { profitUsd: number; profitPercent: number; currentApy: number };
}

function groupByProtocol(groups: ProtocolPositionGroup[]): ProtocolCard[] {
  const map = new Map<string, ProtocolPositionGroup[]>();
  for (const g of groups) {
    const existing = map.get(g.protocol);
    if (existing) existing.push(g);
    else map.set(g.protocol, [g]);
  }

  return Array.from(map.entries()).map(([protocol, pools]) => ({
    protocol,
    displayName:
      PROTOCOL_NAMES[protocol] ??
      protocol.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    totalPositions: pools.reduce((s, p) => s + p.positions.length, 0),
    totalValueUsd: pools.reduce((s, p) => s + p.totalValueUsd, 0),
    pnl: pools.find((p) => p.pnl)?.pnl,
    pools,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ProtocolPositionsProps {
  groups: ProtocolPositionGroup[];
  isLoading: boolean;
  /** Protocols still being fetched (shown as skeleton cards) */
  loadingProtocols?: string[];
  totalValueUsd: number;
}

export function ProtocolPositions({
  groups,
  isLoading,
  loadingProtocols = [],
  totalValueUsd,
}: ProtocolPositionsProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const cards = groupByProtocol(groups);
  const hasPartialData = cards.length > 0;

  // Pie chart data
  const pieData = cards.map((c, i) => ({
    name: c.displayName,
    value: c.totalValueUsd > 0 ? c.totalValueUsd : c.totalPositions,
    positions: c.totalPositions,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Full skeleton only when ALL protocols are loading and we have no data yet
  if (isLoading && !hasPartialData) {
    return (
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-foreground">
          Protocol Positions
        </h2>
        {/* Skeleton summary */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 px-6 py-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
        {/* Skeleton pie chart + legend */}
        <div className="overflow-hidden rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-8">
            <Skeleton className="h-[140px] w-[140px] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-3 w-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Skeleton protocol cards */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="flex items-center gap-3 px-6 py-4">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
              <div className="ml-auto">
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="border-t border-border px-6 py-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 py-2.5"
                >
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>
    );
  }

  if (groups.length === 0 && loadingProtocols.length === 0) {
    return (
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-semibold text-foreground">
          Protocol Positions
        </h2>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
          <Layers className="h-8 w-8 opacity-40" />
          <p className="text-sm">No protocol positions found</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold text-foreground">
        Protocol Positions
      </h2>

      {/* Summary card with pie chart */}
      <motion.div
        className="overflow-hidden rounded-xl border border-border bg-card"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20">
            <Layers className="h-5 w-5 text-violet-400" />
          </div>
          <span className="text-lg font-medium text-foreground">
            Protocols · {formatUsd(totalValueUsd)}
          </span>
          <span className="text-base text-muted-foreground">
            {cards.length} protocol{cards.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Pie chart + legend */}
        {pieData.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="flex items-center gap-8">
              {/* Donut chart */}
              <div className="h-[140px] w-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      animationBegin={100}
                      animationDuration={800}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload as (typeof pieData)[0];
                        return (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                            <p className="text-sm font-medium text-foreground">
                              {d.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {d.positions} position
                              {d.positions !== 1 ? "s" : ""}
                              {d.value > 0 &&
                                ` · ${formatUsd(d.value)}`}
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-1 flex-col gap-2.5">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.fill }}
                    />
                    <span className="text-base text-foreground">
                      {entry.name}
                    </span>
                    <span className="ml-auto text-base font-medium text-foreground">
                      {entry.value > 0 ? formatUsd(entry.value) : `${entry.positions} pos`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Protocol cards — one card per protocol, pools as sub-sections */}
      {cards.map((card, cardIdx) => {
        const isCollapsed = collapsed.has(card.protocol);
        const iconSrc = getProtocolIcon(card.protocol);
        // Use tree layout when pools have distinct sub-names (e.g. "Blend · Etherfuse Pool")
        const useTree = card.pools.some((p) => p.displayName.includes(" · "));

        return (
          <motion.div
            key={card.protocol}
            className="overflow-hidden rounded-xl border border-border bg-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + cardIdx * 0.06 }}
          >
            {/* Protocol header */}
            <button
              onClick={() => toggle(card.protocol)}
              className="flex w-full items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/20"
            >
              {iconSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconSrc}
                  alt={card.displayName}
                  className="h-8 w-8 shrink-0 rounded-full"
                />
              ) : (
                <TokenImage
                  alt={card.displayName}
                  className="h-8 w-8 shrink-0 rounded-full text-[11px]"
                />
              )}
              <span className="text-base font-semibold text-foreground">
                {card.displayName}
              </span>
              <span className="text-sm text-muted-foreground">
                {card.totalPositions} position
                {card.totalPositions !== 1 ? "s" : ""}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {card.pnl && card.pnl.profitUsd !== 0 && (
                  <span
                    className={cn(
                      "text-xs font-medium",
                      card.pnl.profitUsd >= 0 ? "text-emerald-400" : "text-destructive",
                    )}
                  >
                    {card.pnl.profitUsd >= 0 ? "+" : ""}
                    {formatUsd(card.pnl.profitUsd)} ({card.pnl.profitPercent.toFixed(1)}%)
                  </span>
                )}
                <span className="text-base font-medium text-foreground">
                  {card.totalValueUsd > 0 ? formatUsd(card.totalValueUsd) : "—"}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isCollapsed && "-rotate-90",
                )}
              />
            </button>

            {/* Expanded content */}
            <AnimatePresence initial={false}>
              {/* Flat layout — no tree (e.g. Aquarius) */}
              {!isCollapsed && !useTree &&
                card.pools.map((pool) => (
                  <motion.div
                    key={pool.displayName}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Column headers */}
                    <div
                      className={cn(
                        POS_GRID,
                        "border-t border-border px-6 py-2.5",
                      )}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Pool / Asset
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Type
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        APY
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Rewards
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount
                      </span>
                      <span className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Value
                      </span>
                    </div>

                    {pool.positions.map((pos, idx) => (
                      <div
                        key={`${pos.name}-${idx}`}
                        className={cn(
                          POS_GRID,
                          "border-t border-border/60 px-6 py-3.5 transition-colors hover:bg-muted/20",
                        )}
                      >
                        <PositionAssetCell pos={pos} />
                        <div>
                          <TypeBadge type={pos.type} />
                        </div>
                        <span className="text-sm font-medium text-emerald-400">
                          {pos.apy != null ? `${pos.apy.toFixed(2)}%` : "—"}
                        </span>
                        <PositionRewardsCell pos={pos} groupRewards={pool.rewards} />
                        <PositionAmountCell pos={pos} />
                        <span className="text-right text-base font-medium text-foreground">
                          {pos.valueUsd > 0 ? formatUsd(pos.valueUsd) : "—"}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                ))}

              {/* Tree layout — pools with distinct names (e.g. Blend) */}
              {!isCollapsed && useTree && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden border-t border-border px-4 pb-4 pt-2"
                >
                  {card.pools.map((pool, poolIdx) => {
                    const isLast = poolIdx === card.pools.length - 1;
                    return (
                      <div key={pool.displayName} className="relative ml-4">
                        {/* Vertical tree line */}
                        <div
                          className={cn(
                            "absolute left-0 top-0 w-0.5 bg-border",
                            isLast ? "h-5" : "h-full",
                          )}
                        />
                        {/* Horizontal branch */}
                        <div className="absolute left-0 top-5 h-0.5 w-4 bg-border" />

                        {/* Pool content — indented past the tree branch */}
                        <div className="pl-6">
                          {/* Pool header */}
                          <div className="flex items-center gap-3 py-2.5">
                            {POOL_ICONS[card.protocol] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={POOL_ICONS[card.protocol]}
                                alt="pool"
                                className="h-6 w-6 shrink-0 rounded-full"
                              />
                            )}
                            <span className="text-base font-medium text-foreground/80">
                              {extractPoolName(pool.displayName)}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {pool.positions.length} position
                              {pool.positions.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Table inside a nested card */}
                          <div className="overflow-hidden rounded-lg border border-border bg-muted/5">
                            {/* Column headers */}
                            <div className={cn(POS_GRID, "px-4 py-2")}>
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Asset
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Type
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                APY
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Rewards
                              </span>
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Amount
                              </span>
                              <span className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Value
                              </span>
                            </div>

                            {/* Position rows */}
                            {pool.positions.map((pos, idx) => (
                              <div
                                key={`${pos.name}-${idx}`}
                                className={cn(
                                  POS_GRID,
                                  "border-t border-border/40 px-4 py-3 transition-colors hover:bg-muted/20",
                                )}
                              >
                                <PositionAssetCell pos={pos} />
                                <div>
                                  <TypeBadge type={pos.type} />
                                </div>
                                <span className="text-sm font-medium text-emerald-400">
                                  {pos.apy != null ? `${pos.apy.toFixed(2)}%` : "—"}
                                </span>
                                <PositionRewardsCell pos={pos} groupRewards={pool.rewards} />
                                <PositionAmountCell pos={pos} />
                                <span className="text-right text-base font-medium text-foreground">
                                  {pos.valueUsd > 0
                                    ? formatUsd(pos.valueUsd)
                                    : "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Spacing between pools */}
                        {!isLast && <div className="h-3" />}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Per-protocol loading skeletons for protocols still being fetched */}
      {loadingProtocols.map((name) => {
        const key = name.toLowerCase().replace(/\s+/g, "-");
        const iconSrc = getProtocolIcon(key) ?? getProtocolIcon(name.toLowerCase());
        return (
          <motion.div
            key={`loading-${key}`}
            className="overflow-hidden rounded-xl border border-border bg-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="flex w-full items-center gap-3 px-6 py-4">
              {iconSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconSrc}
                  alt={name}
                  className="h-8 w-8 shrink-0 rounded-full opacity-50"
                />
              ) : (
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              )}
              <span className="text-base font-semibold text-foreground/60">
                {name}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading positions...
              </span>
            </div>
            <div className="border-t border-border px-6 py-3">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-2.5">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
