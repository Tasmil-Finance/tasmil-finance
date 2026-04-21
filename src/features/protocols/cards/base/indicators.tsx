"use client";

import { cn } from "@/lib/utils";

// ─── Playground-style micro components ──────────────────────────

/** APY display - auto-detects 0-1 range vs 0-100. */
export function Apy({ value }: { value: unknown }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return <span className="text-muted-foreground">{"\u2014"}</span>;
  const p = n < 1 ? n * 100 : n;
  return <span className="text-foreground tabular-nums text-xs">{p.toFixed(2)}%</span>;
}

/** Badge tag for type (supply, collateral, borrow, active, setup). */
export function Tag({ type }: { type: string }) {
  const m: Record<string, [string, string]> = {
    supply: ["Supply", "text-foreground bg-muted"],
    collateral: ["Collateral", "text-primary bg-primary/10"],
    borrow: ["Borrow", "text-foreground bg-muted"],
    active: ["Active", "text-emerald-400 bg-emerald-400/10"],
    setup: ["Setup", "text-amber-400 bg-amber-400/10"],
    on_ice: ["On Ice", "text-blue-400 bg-blue-400/10"],
    frozen: ["Frozen", "text-blue-400 bg-blue-400/10"],
    admin_frozen: ["Admin Frozen", "text-red-400 bg-red-400/10"],
  };
  const [label, cls] = m[type] ?? [type, "text-muted-foreground bg-muted"];
  return (
    <span className={cn("rounded-md px-1.5 py-px text-[10px] font-medium", cls)}>{label}</span>
  );
}

/** Utilization progress bar. */
export function Bar({ value }: { value: unknown }) {
  const n = Number(value);
  const p = Number.isFinite(n) ? (n < 1 ? n * 100 : n) : 0;
  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="h-1 flex-1 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${Math.min(p, 100)}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
        {p.toFixed(0)}%
      </span>
    </div>
  );
}

/** Small stat label + value pair. */
export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground/60 uppercase mb-0.5">{label}</p>
      <p className="text-xs text-foreground tabular-nums">{value}</p>
    </div>
  );
}

/** Metric box with background. */
export function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

/** Simple key-value row. */
export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </div>
  );
}

/** Playground-style section header. */
export function CardHeader({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[13px] font-medium text-foreground flex-1">{title}</span>
      {right}
    </div>
  );
}

// ─── Chat-style indicators ──────────────────────────────────────

/** APY display with color coding (chat style). */
export function APYDisplay({ value }: { value: number | string | undefined | null }) {
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground text-xs">N/A</span>;
  }
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (Number.isNaN(n)) return <span className="text-muted-foreground text-xs">N/A</span>;
  const color = n >= 20 ? "text-green-500" : n >= 10 ? "text-yellow-500" : "text-blue-500";
  return <span className={cn("font-semibold", color)}>{n.toFixed(2)}%</span>;
}

/** Key-value detail row (chat style). */
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

/** Protocol name badge (chat style). */
export function ProtocolBadge({ name }: { name: string | undefined | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
      {name ?? "unknown"}
    </span>
  );
}

/** Before → After change row. */
export function ChangeRow({
  label,
  before,
  after,
}: {
  label: string;
  before: string;
  after: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-xs text-foreground tabular-nums">{before}</span>
      <span className="text-muted-foreground/40 text-xs">{"\u2192"}</span>
      <span className="text-xs text-foreground tabular-nums">{after}</span>
    </div>
  );
}
