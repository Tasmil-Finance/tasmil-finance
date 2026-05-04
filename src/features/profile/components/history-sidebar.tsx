"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getExplorerUrl } from "@/shared/config/stellar";
import { Button } from "@/shared/ui/button-v2";
import { Skeleton } from "@/shared/ui/skeleton";
import { useSorobanTokenMeta } from "../hooks/use-soroban-token-meta";
import { useStellarTransactions } from "../hooks/use-stellar-transactions";
import { decodeOperation } from "../lib/decode-operation";
import { formatAmount, signedAmount } from "../lib/format-amount";
import { groupByTransaction } from "../lib/group-by-transaction";
import { getIconStyle } from "../lib/icons";
import type { TxGroup } from "../lib/types";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function summary(group: TxGroup): { text: string; color: string } | null {
  const { primary, successful } = group;
  if (!successful) return { text: "Failed", color: "text-destructive" };
  if (primary.kind === "swap") {
    const src = primary.deltas.find((d) => !d.isCredit);
    const dst = primary.deltas.find((d) => d.isCredit);
    if (!src || !dst) return null;
    return {
      text: `${formatAmount(src.amount)} ${src.code} → ${formatAmount(dst.amount)} ${dst.code}`,
      color: "text-foreground",
    };
  }
  const d = primary.deltas[0];
  if (!d) return null;
  return {
    text: `${signedAmount(formatAmount(d.amount), d.isCredit)} ${d.code}`,
    color: d.isCredit ? "text-emerald-400" : "text-destructive",
  };
}

interface HistorySidebarProps {
  address: string;
  onSeeAll?: () => void;
}

export function HistorySidebar({ address, onSeeAll }: HistorySidebarProps) {
  const { data, isLoading } = useStellarTransactions(address);

  const allRaw = data?.pages.flatMap((p) => p.ops) ?? [];
  const allAttrs = (data?.pages ?? []).reduce<Record<string, NonNullable<TxGroup["attrs"]>>>(
    (acc, p) => Object.assign(acc, p.attrsByTx),
    {},
  );

  const contractIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRaw) {
      for (const c of r.asset_balance_changes ?? []) {
        if (c.asset_type !== "native" && c.asset_issuer) set.add(c.asset_issuer);
      }
    }
    return Array.from(set);
  }, [allRaw]);

  const { lookup } = useSorobanTokenMeta(contractIds);
  const decoded = useMemo(() => allRaw.map((r) => decodeOperation(r, address, lookup)), [allRaw, address, lookup]);
  const groups = useMemo(() => groupByTransaction(decoded, allAttrs).slice(0, 5), [decoded, allAttrs]);

  return (
    <motion.div
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-xl font-semibold text-foreground">History</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-6 py-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <Clock className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="mb-1 text-sm font-medium text-muted-foreground">No transactions yet</p>
          <p className="text-center text-xs text-muted-foreground/60">
            Stellar operations will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {groups.map((group) => {
            const style = getIconStyle(group.primary.kind, group.successful);
            const Icon = style.icon;
            const sum = summary(group);
            const explorerLink = getExplorerUrl("tx", group.txHash);
            return (
              <a
                key={group.txHash}
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/20"
              >
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", style.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", style.fg)} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">{style.label}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(group.createdAt)}</span>
                </div>
                {sum && (
                  <span className={cn("shrink-0 text-sm font-semibold", sum.color)}>{sum.text}</span>
                )}
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-auto border-t border-border px-4 py-3">
        <Button
          variant="ghost"
          className="w-full text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={onSeeAll}
        >
          See all
        </Button>
      </div>
    </motion.div>
  );
}
