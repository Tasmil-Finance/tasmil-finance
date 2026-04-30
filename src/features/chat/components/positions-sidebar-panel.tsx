"use client";

import { Layers, Loader2, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDefiPositions } from "@/features/profile/hooks/use-defi-positions";
import { Skeleton } from "@/shared/ui/skeleton";
import { useWalletStore } from "@/store/use-wallet";
import { ProtocolCollapsibleSection } from "./protocol-collapsible-section";

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
    <div className="space-y-1 px-4 py-4">
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-4 w-28 rounded bg-sidebar-accent" />
        <Skeleton className="h-4 w-16 rounded bg-sidebar-accent" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 border-t border-sidebar-border py-2.5">
            <Skeleton className="h-6 w-6 shrink-0 rounded-full bg-sidebar-accent" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24 rounded bg-sidebar-accent" />
              <Skeleton className="h-3 w-16 rounded bg-sidebar-accent" />
            </div>
            <Skeleton className="h-3.5 w-14 rounded bg-sidebar-accent" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <Layers className="h-8 w-8 text-sidebar-foreground/20" />
      <div>
        <p className="text-sm text-sidebar-foreground/70">
          No positions found
        </p>
        <p className="mt-0.5 text-xs text-sidebar-foreground/40">
          Start a conversation with the AI to manage your DeFi positions.
        </p>
      </div>
    </div>
  );
}

// ─── Disconnected state ─────────────────────────────────────────────────────

function DisconnectedState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <Wallet className="h-8 w-8 text-sidebar-foreground/20" />
      <div>
        <p className="text-sm text-sidebar-foreground/70">
          Connect wallet to view positions
        </p>
        <p className="mt-0.5 text-xs text-sidebar-foreground/40">
          Your DeFi positions will appear here once your wallet is connected.
        </p>
      </div>
    </div>
  );
}

// ─── Main panel ─────────────────────────────────────────────────────────────

export function PositionsSidebarPanel() {
  const account = useWalletStore((s) => s.account);
  const { groups, isLoading, loadingProtocols } = useDefiPositions(account);

  if (!account) {
    return <DisconnectedState />;
  }

  if (isLoading && groups.length === 0) {
    return <PositionsSkeleton count={3} />;
  }

  if (!isLoading && groups.length === 0) {
    return <EmptyState />;
  }

  const totalValueUsd = groups.reduce((sum, g) => sum + g.totalValueUsd, 0);
  const totalProfitUsd = groups.reduce((sum, g) => sum + (g.pnl?.profitUsd ?? 0), 0);
  const hasPnl = groups.some((g) => g.pnl && g.pnl.profitUsd !== 0);
  const protocolCount = groups.length;
  const positionCount = groups.reduce((sum, g) => sum + g.positions.length, 0);

  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Summary */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-baseline justify-between">
          <span className="text-base font-semibold text-sidebar-foreground">
            Total Value
          </span>
          <span className="text-base font-semibold text-sidebar-foreground tabular-nums">
            {formatUsd(totalValueUsd)}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-sidebar-foreground/50">
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
                  totalProfitUsd >= 0 ? "text-emerald-400" : "text-red-400",
                )}
              >
                {totalProfitUsd >= 0 ? "+" : ""}
                {formatUsd(totalProfitUsd)}
              </span>
            </>
          )}
          {loadingProtocols.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            </span>
          )}
        </div>
      </div>

      {/* Protocol list — flat sections separated by borders */}
      <div className="flex-1 overflow-y-auto">
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

        {loadingProtocols.map((name) => {
          const key = name.toLowerCase().replace(/\s+/g, "-");
          return (
            <div key={`loading-${key}`} className="border-b border-sidebar-border px-4 py-2.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 shrink-0 rounded-full bg-sidebar-accent" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded bg-sidebar-accent" />
                  <Skeleton className="h-3 w-16 rounded bg-sidebar-accent" />
                </div>
                <span className="flex items-center gap-1.5 text-xs text-sidebar-foreground/50">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading...
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
