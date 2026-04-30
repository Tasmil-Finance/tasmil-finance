"use client";

import { Layers, Loader2, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDefiPositions } from "@/features/profile/hooks/use-defi-positions";
import { Skeleton } from "@/shared/ui/skeleton";
import { useWalletStore } from "@/store/use-wallet";
import { ProtocolCollapsibleSection } from "./protocol-collapsible-section";

// ─── Formatters ─────────────────────────────────────────────────────────────

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

// ─── Loading skeleton ───────────────────────────────────────────────────────

function PositionsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 px-3 py-4">
      {/* Summary skeleton */}
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </div>
      {/* Protocol card skeletons */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="border-t border-border px-4 py-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="space-y-1.5 py-2">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-14 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="ml-8 h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col px-3 py-4">
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Layers className="h-5 w-5 text-violet-400/60" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            No positions found
          </p>
          <p className="text-xs text-muted-foreground">
            Start a conversation with the AI to manage your DeFi positions.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Disconnected state ─────────────────────────────────────────────────────

function DisconnectedState() {
  return (
    <div className="flex flex-1 flex-col px-3 py-4">
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-12 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
          <Wallet className="h-5 w-5 text-violet-400/60" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Connect wallet to view positions
          </p>
          <p className="text-xs text-muted-foreground">
            Your DeFi positions will appear here once your wallet is connected.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────

export function PositionsSidebarPanel() {
  const account = useWalletStore((s) => s.account);
  const { groups, isLoading, loadingProtocols } = useDefiPositions(account);

  // Not connected
  if (!account) {
    return <DisconnectedState />;
  }

  // Initial loading — all protocols still fetching, no data yet
  if (isLoading && groups.length === 0) {
    return <PositionsSkeleton count={3} />;
  }

  // Empty — wallet connected but no positions
  if (!isLoading && groups.length === 0) {
    return <EmptyState />;
  }

  // Compute totals
  const totalValueUsd = groups.reduce((sum, g) => sum + g.totalValueUsd, 0);
  const totalProfitUsd = groups.reduce((sum, g) => sum + (g.pnl?.profitUsd ?? 0), 0);
  const hasPnl = groups.some((g) => g.pnl && g.pnl.profitUsd !== 0);
  const protocolCount = groups.length;
  const positionCount = groups.reduce((sum, g) => sum + g.positions.length, 0);

  // Weighted P&L percentage (profit-weighted by TVL)
  const totalProfitPercent =
    totalValueUsd > 0 && totalProfitUsd !== 0
      ? (totalProfitUsd / (totalValueUsd - totalProfitUsd)) * 100
      : 0;

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Summary header */}
      <div className="shrink-0 px-3 pt-4 pb-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20">
              <Layers className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-semibold text-foreground tabular-nums">
                  {formatUsd(totalValueUsd)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                <span>
                  {protocolCount} protocol{protocolCount !== 1 ? "s" : ""}
                </span>
                <span>·</span>
                <span>
                  {positionCount} position{positionCount !== 1 ? "s" : ""}
                </span>
                {hasPnl && totalProfitUsd !== 0 && (
                  <>
                    <span>·</span>
                    <span
                      className={cn(
                        "font-medium",
                        totalProfitUsd >= 0 ? "text-emerald-400" : "text-destructive",
                      )}
                    >
                      {totalProfitUsd >= 0 ? "+" : ""}
                      {formatUsd(totalProfitUsd)}
                      {" ("}
                      {totalProfitPercent >= 0 ? "+" : ""}
                      {totalProfitPercent.toFixed(1)}%)
                    </span>
                  </>
                )}
                {loadingProtocols.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      Loading...
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol cards */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
        <AnimatePresence initial={false}>
          {groups.map((group) => (
            <ProtocolCollapsibleSection
              key={group.protocol}
              protocol={group.protocol}
              displayName={group.displayName}
              totalValueUsd={group.totalValueUsd}
              positions={group.positions}
              pnl={group.pnl}
            />
          ))}
        </AnimatePresence>

        {/* Loading skeletons for protocols still being fetched */}
        {loadingProtocols.map((name) => {
          const key = name.toLowerCase().replace(/\s+/g, "-");
          return (
            <motion.div
              key={`loading-${key}`}
              className="overflow-hidden rounded-xl border border-border bg-card"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </div>
              </div>
              <div className="border-t border-border px-4 py-3">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="space-y-1.5 py-2">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-14 rounded-md" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="ml-8 h-3 w-32" />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
