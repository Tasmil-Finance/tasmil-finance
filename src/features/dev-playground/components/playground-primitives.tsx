"use client";

import { AlertTriangle, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

// ─── Card wrapper ───────────────────────────────────────────────

export function PgCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      {children}
    </div>
  );
}

// ─── Card header ────────────────────────────────────────────────

export function PgCardHeader({
  icon,
  iconColor = "text-violet-400",
  iconBg = "bg-violet-500/20",
  title,
  subtitle,
  badge,
  actions,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
        <span className={cn("h-4.5 w-4.5", iconColor)}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-medium text-foreground text-sm">{title}</span>
        {subtitle && <span className="ml-2 text-muted-foreground text-xs">{subtitle}</span>}
      </div>
      {badge}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Grid layout (matches portfolio POS_GRID) ──────────────────

export const POS_GRID = "grid grid-cols-[2fr_90px_1.2fr_1fr] items-center gap-x-3";

export function PgGridHeader({ columns }: { columns: string[] }) {
  return (
    <div className={cn(POS_GRID, "border-border border-b px-5 py-2")}>
      {columns.map((col) => (
        <span
          key={col}
          className="font-medium text-[11px] text-muted-foreground uppercase tracking-wider"
        >
          {col}
        </span>
      ))}
    </div>
  );
}

// ─── Type badge (from portfolio) ────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  vault: { label: "Vault", color: "text-violet-400", bg: "bg-violet-400/10" },
  supply: { label: "Supply", color: "text-primary", bg: "bg-primary/10" },
  collateral: { label: "Collateral", color: "text-blue-400", bg: "bg-blue-400/10" },
  borrow: { label: "Borrow", color: "text-destructive", bg: "bg-destructive/10" },
  lp: { label: "LP", color: "text-amber-400", bg: "bg-amber-400/10" },
  stake: { label: "Staked", color: "text-violet-400", bg: "bg-violet-400/10" },
  lending: { label: "Lending", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  backstop: { label: "Backstop", color: "text-cyan-400", bg: "bg-cyan-400/10" },
};

export function TypeBadge({ type }: { type: string }) {
  const config = TYPE_CONFIG[type] ?? {
    label: type,
    color: "text-muted-foreground",
    bg: "bg-muted",
  };
  return (
    <span
      className={cn(
        "inline-block rounded-md px-2 py-0.5 font-medium text-xs",
        config.color,
        config.bg
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Status badge ───────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const isOk = status === "ok" || status === "active";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide",
        isOk ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      )}
    >
      {status}
    </span>
  );
}

// ─── APY display ────────────────────────────────────────────────

export function ApyDisplay({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const pct = value < 1 ? value * 100 : value; // handle 0-1 and 0-100 ranges
  const color = pct >= 20 ? "text-emerald-400" : pct >= 5 ? "text-amber-400" : "text-blue-400";
  return <span className={cn("font-medium", color)}>{pct.toFixed(2)}%</span>;
}

// ─── Skeleton states ────────────────────────────────────────────

export function PgSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="ml-auto h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────

export function PgEmpty({ message = "No data found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-10 text-muted-foreground">
      <Layers className="h-8 w-8 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ─── Error state ────────────────────────────────────────────────

export function PgError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-destructive text-sm">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

// ─── JSON viewer ────────────────────────────────────────────────

export function JsonViewer({ data }: { data: unknown }) {
  return (
    <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted/30 p-4 font-mono text-muted-foreground text-xs">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
