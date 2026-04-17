"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Clock,
  Droplets,
  Layers,
  Link2,
  Loader2,
  Lock,
  Shield,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { cn } from "@/lib/utils";
import type { StellarOperation } from "../hooks/use-stellar-transactions";
import { useStellarTransactions } from "../hooks/use-stellar-transactions";

// ─── Icon map ─────────────────────────────────────────────────────────────────
// Icons chosen to be semantically obvious to non-devs

const OP_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  // Directional transfers
  payment_in:  { icon: ArrowDownLeft,  bg: "bg-emerald-500/10", fg: "text-emerald-400"      },
  payment_out: { icon: ArrowUpRight,   bg: "bg-destructive/10", fg: "text-destructive"      },
  // Swaps / path payments
  swap:        { icon: ArrowLeftRight, bg: "bg-violet-500/10",  fg: "text-violet-400"       },
  // DEX order book — trending chart represents market activity
  dex:         { icon: TrendingUp,     bg: "bg-amber-500/10",   fg: "text-amber-400"        },
  // Account creation
  create:      { icon: UserPlus,       bg: "bg-emerald-500/10", fg: "text-emerald-400"      },
  // Trustline permission — shield = permission
  trust:       { icon: Shield,         bg: "bg-blue-500/10",    fg: "text-blue-400"         },
  // Claim / receive a claimable balance — arrow down
  claim:       { icon: ArrowDownLeft,  bg: "bg-emerald-500/10", fg: "text-emerald-400"      },
  // Lock funds as a claimable balance
  lock:        { icon: Lock,           bg: "bg-amber-500/10",   fg: "text-amber-400"        },
  // Liquidity pool — water drops = liquidity
  lp:          { icon: Droplets,       bg: "bg-violet-500/10",  fg: "text-violet-400"       },
  // Smart contract call — layers = stacked protocol logic
  contract:    { icon: Layers,         bg: "bg-muted/30",       fg: "text-muted-foreground" },
  // Account merge — link = joining two things
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

// ─── Labels ───────────────────────────────────────────────────────────────────

const OP_LABELS: Record<string, string> = {
  payment:                     "Payment",
  path_payment_strict_send:    "Swap",
  path_payment_strict_receive: "Swap",
  create_account:              "Create Account",
  manage_sell_offer:           "Sell Order",
  manage_buy_offer:            "Buy Order",
  create_passive_sell_offer:   "Passive Sell Order",
  change_trust:                "Change Trustline",
  allow_trust:                 "Allow Trustline",
  set_trust_line_flags:        "Trustline Flags",
  account_merge:               "Merge Account",
  create_claimable_balance:    "Lock Balance",
  claim_claimable_balance:     "Claim Balance",
  liquidity_pool_deposit:      "Add Liquidity",
  liquidity_pool_withdraw:     "Remove Liquidity",
  invoke_contract:             "Contract Call",
};

function getOpLabel(type: string): string {
  return (
    OP_LABELS[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatGroupDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function shortenAddr(a: string): string {
  if (!a || a.length < 10) return a;
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

function formatNum(amt: string): string {
  const n = parseFloat(amt);
  if (Number.isNaN(n)) return amt;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toPrecision(4);
}

// ─── Row data helpers ─────────────────────────────────────────────────────────

function isOutgoingOp(op: StellarOperation, address: string): boolean {
  const outTypes = new Set([
    "payment",
    "path_payment_strict_send",
    "path_payment_strict_receive",
  ]);
  return outTypes.has(op.type) && op.from === address;
}

// Center column: signed+colored amount for transfers, plain asset for others
interface CenterInfo {
  asset: string;
  display: string;      // formatted number (possibly with sign)
  color: string;        // tailwind color class
  signed: boolean;      // whether to show +/- prefix
}

function getCenterInfo(
  op: StellarOperation,
  address: string,
): CenterInfo | null {
  const isTransfer =
    op.type === "payment" || op.type.startsWith("path_payment");
  const outgoing = isOutgoingOp(op, address);

  const rawAmt = op.type.startsWith("path_payment")
    ? (op.destinationAmount ?? op.amount)
    : op.amount;
  const asset = op.type.startsWith("path_payment")
    ? (op.destinationAsset ?? op.assetCode ?? "XLM")
    : (op.assetCode ?? "XLM");

  if (rawAmt) {
    const display = formatNum(rawAmt);
    if (isTransfer) {
      return {
        asset,
        display: outgoing ? `−${display}` : `+${display}`,
        color: outgoing ? "text-destructive" : "text-emerald-400",
        signed: true,
      };
    }
    // Non-transfer op with an amount (e.g. LP, claimable)
    return { asset, display, color: "text-foreground", signed: false };
  }

  // No amount — show asset name if we know it (trust changes, offers, etc.)
  if (op.assetCode) {
    return {
      asset: op.assetCode,
      display: op.assetCode,
      color: "text-muted-foreground",
      signed: false,
    };
  }

  return null;
}

interface RightInfo {
  label: string;
  value: string;
}

function getRightInfo(op: StellarOperation, address: string): RightInfo | null {
  if (op.type === "payment") {
    const out = op.from === address;
    const addr = out ? op.to : op.from;
    if (!addr) return null;
    return { label: out ? "To" : "From", value: shortenAddr(addr) };
  }
  if (op.type.startsWith("path_payment")) {
    if (!op.to) return null;
    return { label: "To", value: shortenAddr(op.to) };
  }
  if (op.type === "create_account") {
    if (!op.to) return null;
    return { label: "Account", value: shortenAddr(op.to) };
  }
  if (op.type.includes("trust")) {
    return { label: "Asset", value: op.assetCode ?? "—" };
  }
  if (op.type.startsWith("liquidity_pool")) {
    return { label: "Pool", value: op.assetCode ?? "—" };
  }
  return null;
}

// ─── Group by date ────────────────────────────────────────────────────────────

function groupByDate(
  ops: StellarOperation[],
): { label: string; ops: StellarOperation[] }[] {
  const map = new Map<string, StellarOperation[]>();
  for (const op of ops) {
    const key = new Date(op.createdAt).toDateString();
    const bucket = map.get(key);
    if (bucket) bucket.push(op);
    else map.set(key, [op] as StellarOperation[]);
  }
  return Array.from(map.entries()).map(([, dayOps]) => ({
    label: formatGroupDate(dayOps[0]!.createdAt),
    ops: dayOps,
  }));
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function TxRow({ op, address }: { op: StellarOperation; address: string }) {
  const outgoing = isOutgoingOp(op, address);
  const key = getIconKey(op.type, outgoing);
  const { icon: Icon, bg, fg } = OP_ICONS[key]!;
  const center = getCenterInfo(op, address);
  const right = getRightInfo(op, address);
  const txLink = getExplorerUrl("tx", op.transactionHash);

  return (
    <a
      href={txLink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/20"
    >
      {/* Operation icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          bg,
        )}
      >
        <Icon className={cn("h-[15px] w-[15px]", fg)} />
      </div>

      {/* Op label + time */}
      <div className="min-w-0 w-44 shrink-0">
        <p className="truncate text-sm font-medium text-foreground">
          {getOpLabel(op.type)}
        </p>
        <p className="text-xs text-muted-foreground">{formatTime(op.createdAt)}</p>
      </div>

      {/* Token + amount */}
      <div className="flex flex-1 items-center gap-2.5">
        {center ? (
          <>
            {/* Only show token circle when it's a real token asset, not for "show asset name as display" */}
            {!center.signed && center.asset === center.display ? (
              // Asset-name-only rows (trust changes, etc.)
              <TokenImage
                alt={center.asset}
                className="h-7 w-7 shrink-0 rounded-full text-[10px]"
              />
            ) : (
              <TokenImage
                alt={center.asset}
                className="h-7 w-7 shrink-0 rounded-full text-[10px]"
              />
            )}
            <p className={cn("text-sm font-semibold leading-none", center.color)}>
              {center.display}
              {center.signed && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {center.asset}
                </span>
              )}
            </p>
          </>
        ) : null}
      </div>

      {/* Direction + address */}
      {right ? (
        <div className="flex w-40 shrink-0 flex-col items-end gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            {right.label}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {right.value}
          </span>
        </div>
      ) : (
        <div className="w-40 shrink-0" />
      )}
    </a>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TransactionList({ address }: { address: string }) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useStellarTransactions(address);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const allOps = data?.pages.flatMap((p) => p.operations) ?? [];
  const groups = groupByDate(allOps);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-52" />
        {[4, 3].map((count, gi) => (
          <div key={gi} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="w-44 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <div className="flex flex-1 items-center gap-2.5">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex w-40 flex-col items-end gap-1">
                    <Skeleton className="h-2.5 w-8" />
                    <Skeleton className="h-3.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Empty ──
  if (allOps.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">
          Transaction History
        </h2>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="font-medium text-foreground">No transactions yet</p>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Stellar operations will appear here as you transact on-chain.
          </p>
        </div>
      </div>
    );
  }

  // ── Grouped list ──
  return (
    <div className="flex flex-col gap-2">
      {/* Heading */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Transaction History
        </h2>
        <span className="text-sm text-muted-foreground">
          {allOps.length} operations
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          {/* Date label */}
          <p className="px-1 pt-2 text-sm font-semibold text-muted-foreground">
            {group.label}
          </p>
          {/* Rows card */}
          <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border/60">
            {group.ops.map((op) => (
              <TxRow key={op.id} op={op} address={address} />
            ))}
          </div>
        </div>
      ))}

      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more…
            </div>
          )}
        </div>
      )}

      {!hasNextPage && allOps.length > 0 && (
        <p className="py-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground/30">
          End of history
        </p>
      )}
    </div>
  );
}
