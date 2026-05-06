"use client";

import { AlertTriangle, Shield, TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useScrollPreservation } from "@/features/chat/actions/hooks/use-scroll-preservation";
import { cn } from "@/lib/utils";

/** Status badge for protocol availability. */
export function StatusBadge({ status }: { status: string | undefined | null }) {
  const isOk = status === "ok";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs",
        isOk
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : "bg-red-500/10 text-red-600 dark:text-red-400"
      )}
    >
      {isOk ? "Available" : (status ?? "Unavailable")}
    </span>
  );
}

/** APY display with color coding: green (20%+), yellow (10-20%), blue (<10%). */
export function APYDisplay({
  value,
}: {
  value: number | string | Record<string, unknown> | undefined | null;
}) {
  if (value === undefined || value === null)
    return <span className="text-muted-foreground text-xs">N/A</span>;

  // Handle APY object format: { total: 14.2, base: 10, reward: 4.2 }
  let raw: unknown = value;
  if (typeof raw === "object" && raw !== null && "total" in raw) {
    raw = (raw as Record<string, unknown>).total;
  }

  const n =
    typeof raw === "string" ? Number.parseFloat(raw) : typeof raw === "number" ? raw : Number.NaN;
  if (Number.isNaN(n)) return <span className="text-muted-foreground text-xs">N/A</span>;

  const color = n >= 20 ? "text-green-500" : n >= 10 ? "text-yellow-500" : "text-blue-500";

  return <span className={cn("font-semibold", color)}>{n.toFixed(2)}%</span>;
}

/** Risk badge: low/medium/high. */
export function RiskBadge({ risk }: { risk: string | undefined | null }) {
  const config: Record<string, { color: string; icon: typeof Shield }> = {
    low: { color: "bg-green-500/10 text-green-600 dark:text-green-400", icon: Shield },
    medium: { color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: AlertTriangle },
    high: { color: "bg-red-500/10 text-red-600 dark:text-red-400", icon: Zap },
  };
  const c = config[risk ?? ""] ?? config.medium!;
  const Icon = c?.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs",
        c?.color
      )}
    >
      <Icon className="h-3 w-3" />
      {risk ?? "unknown"}
    </span>
  );
}

/** Protocol name badge. */
export function ProtocolBadge({ name }: { name: string | undefined | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
      {name ?? "unknown"}
    </span>
  );
}

/** Price change indicator with arrow. */
export function PriceChange({ value }: { value: number | string | undefined | null }) {
  if (value === undefined || value === null)
    return <span className="text-muted-foreground text-xs">N/A</span>;
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return <span className="text-muted-foreground text-xs">N/A</span>;

  const isPositive = n >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-sm",
        isPositive ? "text-green-500" : "text-red-500"
      )}
    >
      <Icon className="h-3 w-3" />
      {isPositive ? "+" : ""}
      {n.toFixed(2)}%
    </span>
  );
}

/** Generic scrollable list wrapper. */
export function ScrollableList({
  id,
  maxHeight = 300,
  children,
  className,
}: {
  id: string;
  maxHeight?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { scrollRef, handleScroll } = useScrollPreservation(id);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn("space-y-1 overflow-y-auto", className)}
      style={{ maxHeight }}
      data-scrollable="true"
    >
      {children}
    </div>
  );
}

/** Key-value detail row used across all cards. */
export function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}
