"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Clock,
  Droplets,
  Layers,
  Link2,
  Lock,
  Shield,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button-v2";
import { cn } from "@/lib/utils";
import { getExplorerUrl } from "@/shared/config/stellar";
import { useStellarTransactions, type StellarOperation } from "../hooks/use-stellar-transactions";

// ─── Icon map (reuse same pattern as transaction-list) ────────────────────────

const OP_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  payment_in:  { icon: ArrowDownLeft,  bg: "bg-emerald-500/10", fg: "text-emerald-400"      },
  payment_out: { icon: ArrowUpRight,   bg: "bg-destructive/10", fg: "text-destructive"      },
  swap:        { icon: ArrowLeftRight, bg: "bg-violet-500/10",  fg: "text-violet-400"       },
  dex:         { icon: TrendingUp,     bg: "bg-amber-500/10",   fg: "text-amber-400"        },
  create:      { icon: UserPlus,       bg: "bg-emerald-500/10", fg: "text-emerald-400"      },
  trust:       { icon: Shield,         bg: "bg-blue-500/10",    fg: "text-blue-400"         },
  claim:       { icon: ArrowDownLeft,  bg: "bg-emerald-500/10", fg: "text-emerald-400"      },
  lock:        { icon: Lock,           bg: "bg-amber-500/10",   fg: "text-amber-400"        },
  lp:          { icon: Droplets,       bg: "bg-violet-500/10",  fg: "text-violet-400"       },
  contract:    { icon: Layers,         bg: "bg-muted/30",       fg: "text-muted-foreground" },
  merge:       { icon: Link2,          bg: "bg-muted/30",       fg: "text-muted-foreground" },
};

function getIconKey(type: string, outgoing: boolean): keyof typeof OP_ICONS {
  if (type === "payment") return outgoing ? "payment_out" : "payment_in";
  if (type.startsWith("path_payment")) return "swap";
  if (type.includes("offer")) return "dex";
  if (type === "create_account") return "create";
  if (type.includes("trust")) return "trust";
  if (type === "claim_claimable_balance") return "claim";
  if (type === "create_claimable_balance") return "lock";
  if (type.startsWith("liquidity_pool")) return "lp";
  if (type === "invoke_contract") return "contract";
  if (type === "account_merge") return "merge";
  return "contract";
}

// ─── Labels / helpers ─────────────────────────────────────────────────────────

const OP_LABELS: Record<string, string> = {
  payment:                     "Payment",
  path_payment_strict_send:    "Swap",
  path_payment_strict_receive: "Swap",
  create_account:              "Create Account",
  manage_sell_offer:           "Sell Order",
  manage_buy_offer:            "Buy Order",
  create_passive_sell_offer:   "Passive Order",
  change_trust:                "Change Trust",
  allow_trust:                 "Allow Trust",
  set_trust_line_flags:        "Trust Flags",
  account_merge:               "Merge Account",
  create_claimable_balance:    "Lock Balance",
  claim_claimable_balance:     "Claim Balance",
  liquidity_pool_deposit:      "LP Deposit",
  liquidity_pool_withdraw:     "LP Withdraw",
  invoke_contract:             "Invoke Host Function",
};

function getOpLabel(type: string): string {
  return (
    OP_LABELS[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

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

function isOutgoingOp(op: StellarOperation, address: string): boolean {
  const outTypes = new Set([
    "payment",
    "path_payment_strict_send",
    "path_payment_strict_receive",
  ]);
  return outTypes.has(op.type) && op.from === address;
}

function getAmountSummary(
  op: StellarOperation,
  outgoing: boolean,
): { text: string; color: string } | null {
  const isTransfer =
    op.type === "payment" || op.type.startsWith("path_payment");
  const amt = op.type.startsWith("path_payment")
    ? (op.destinationAmount ?? op.amount)
    : op.amount;
  const asset = op.type.startsWith("path_payment")
    ? (op.destinationAsset ?? op.assetCode ?? "XLM")
    : (op.assetCode ?? "XLM");

  if (!amt) return null;
  const num = parseFloat(amt);
  const formatted = num.toLocaleString("en-US", { maximumFractionDigits: 4 });
  const sign = isTransfer ? (outgoing ? "−" : "+") : "";
  const color = isTransfer
    ? outgoing
      ? "text-destructive"
      : "text-emerald-400"
    : "text-foreground";

  return { text: `${sign}${formatted} ${asset}`, color };
}

// ─── Main component ───────────────────────────────────────────────────────────

interface HistorySidebarProps {
  address: string;
  onSeeAll?: () => void;
}

export function HistorySidebar({ address, onSeeAll }: HistorySidebarProps) {
  const { data, isLoading } = useStellarTransactions(address);
  const ops = (data?.pages.flatMap((p) => p.operations) ?? []).slice(0, 5);

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
      ) : ops.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <Clock className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="mb-1 text-sm font-medium text-muted-foreground">
            No transactions yet
          </p>
          <p className="text-center text-xs text-muted-foreground/60">
            Stellar operations will appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {ops.map((op) => {
            const outgoing = isOutgoingOp(op, address);
            const key = getIconKey(op.type, outgoing);
            const { icon: Icon, bg, fg } = OP_ICONS[key]!;
            const summary = getAmountSummary(op, outgoing);
            const explorerLink = getExplorerUrl("tx", op.transactionHash);

            return (
              <a
                key={op.id}
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-6 py-3.5 transition-colors hover:bg-muted/20"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    bg,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", fg)} />
                </div>

                {/* Label + time */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {getOpLabel(op.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(op.createdAt)}
                  </span>
                </div>

                {/* Amount */}
                {summary && (
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      summary.color,
                    )}
                  >
                    {summary.text}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      )}

      {/* See all */}
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
