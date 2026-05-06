import { formatPercent } from "@/features/protocols/lib/formatting";

("use client");

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Database, Layers, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";

// ─── Formatters ─────────────────────────────────────────────────

function fmt(v: unknown, d = 2): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return n.toFixed(d);
}

function trunc(s: string): string {
  return s.length <= 10 ? s : `${s.slice(0, 4)}…${s.slice(-4)}`;
}

// ─── Micro components ───────────────────────────────────────────

function Apy({ value }: { value: unknown }) {
  const n = Number(value);
  if (!Number.isFinite(n)) return <span className="text-muted-foreground">—</span>;
  const p = n < 1 ? n * 100 : n;
  return <span className="text-foreground text-xs tabular-nums">{p.toFixed(2)}%</span>;
}

function Tag({ type }: { type: string }) {
  const m: Record<string, [string, string]> = {
    supply: ["Supply", "text-foreground bg-muted"],
    collateral: ["Collateral", "text-primary bg-primary/10"],
    borrow: ["Borrow", "text-foreground bg-muted"],
    active: ["Active", "text-emerald-400 bg-emerald-400/10"],
    setup: ["Setup", "text-amber-400 bg-amber-400/10"],
  };
  const [label, cls] = m[type] ?? [type, "text-muted-foreground bg-muted"];
  return (
    <span className={cn("rounded-md px-1.5 py-px font-medium text-[10px]", cls)}>{label}</span>
  );
}

function Bar({ value }: { value: unknown }) {
  const n = Number(value);
  const p = Number.isFinite(n) ? (n < 1 ? n * 100 : n) : 0;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-border">
      <div
        className="h-full rounded-full bg-primary/60"
        style={{ width: `${Math.min(p, 100)}%` }}
      />
    </div>
  );
}

// ─── POOLS LIST ─────────────────────────────────────────────────

export function BlendPoolsCard({ data }: { data: Record<string, unknown> }) {
  const pools = (data.pools ?? []) as Record<string, unknown>[];
  const [open, setOpen] = useState<Set<number>>(new Set([0]));
  const flip = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  if (!pools.length) return <Empty icon={Layers} text="No pools found" />;

  return (
    <Card>
      <Header
        icon={<Database className="h-3.5 w-3.5" />}
        title="Blend Pools"
        right={<span className="text-muted-foreground text-xs">{pools.length}</span>}
      />
      {pools.map((pool, i) => {
        const res = (pool.reserves ?? []) as Record<string, unknown>[];
        const isOpen = open.has(i);
        return (
          <div key={i} className={cn(i > 0 && "border-border border-t")}>
            <button
              type="button"
              onClick={() => flip(i)}
              className="flex w-full items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/30"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
              <span className="flex-1 truncate text-left font-medium text-[13px] text-foreground">
                {String(pool.name ?? "Pool")}
              </span>
              <Tag type={String(pool.status ?? "unknown")} />
            </button>
            <AnimatePresence>
              {isOpen && res.length > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 px-4 pb-2">
                    {res.map((r, j) => (
                      <div key={j} className="flex items-center gap-2.5 py-1.5 pl-5">
                        <TokenImage
                          src={null}
                          alt={String(r.symbol ?? "?")}
                          className="h-5 w-5 rounded-full"
                        />
                        <span className="w-12 font-medium text-foreground text-xs">
                          {String(r.symbol ?? "?")}
                        </span>
                        <div className="grid flex-1 grid-cols-3 gap-1 text-[11px]">
                          <span className="text-muted-foreground">
                            <span className="text-muted-foreground/50">S </span>
                            <Apy value={r.supplyApy} />
                          </span>
                          <span className="text-muted-foreground">
                            <span className="text-muted-foreground/50">B </span>
                            <Apy value={r.borrowApy} />
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            {fmt(r.totalSupply ?? r.totalSupplied)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </Card>
  );
}

// ─── POOL DETAIL ────────────────────────────────────────────────

export function BlendPoolDetailCard({ data }: { data: Record<string, unknown> }) {
  const pool = (data.pool ?? data) as Record<string, unknown>;
  const res = (pool.reserves ?? []) as Record<string, unknown>[];

  return (
    <Card>
      <div className="flex items-center justify-between border-border border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium text-[13px] text-foreground">{String(pool.name ?? "Pool")}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {trunc(String(pool.address ?? pool.poolAddress ?? ""))}
            </p>
          </div>
        </div>
        <Tag type={String(pool.status ?? "unknown")} />
      </div>
      {res.length > 0 ? (
        <div className="divide-y divide-border/50">
          {res.map((r: Record<string, unknown>, i: number) => (
            <div key={i} className="px-4 py-3 transition-colors hover:bg-muted/20">
              <div className="mb-2 flex items-center gap-2.5">
                <TokenImage
                  src={null}
                  alt={String(r.symbol ?? "?")}
                  className="h-6 w-6 rounded-full"
                />
                <span className="flex-1 font-medium text-foreground text-sm">
                  {String(r.symbol ?? "?")}
                </span>
                <div className="w-20">
                  <Bar value={r.utilization as number} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 pl-8">
                <Stat label="Supply APY" value={formatPercent(r.supplyApy as number)} />
                <Stat label="Borrow APY" value={formatPercent(r.borrowApy as number)} />
                <Stat label="Supplied" value={fmt(r.totalSupply ?? r.totalSupplied)} />
                <Stat label="Borrowed" value={fmt(r.totalBorrow ?? r.totalBorrowed)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={Database} text="No reserves" />
      )}
    </Card>
  );
}

// ─── RESERVE ────────────────────────────────────────────────────

export function BlendReserveCard({ data }: { data: Record<string, unknown> }) {
  const r = (data.reserve ?? data) as Record<string, unknown>;
  const sym = String(r.symbol ?? "?");

  return (
    <Card>
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <TokenImage src={null} alt={sym} className="h-7 w-7 rounded-full" />
        <div>
          <p className="font-medium text-foreground text-sm">{sym}</p>
          <p className="text-[10px] text-muted-foreground">Reserve Detail</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="Supply APY" value={formatPercent(r.supplyApy as number)} />
          <MetricBox label="Borrow APY" value={formatPercent(r.borrowApy as number)} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px]">
            <span className="text-muted-foreground">Utilization</span>
            <span className="text-foreground tabular-nums">
              {formatPercent(r.utilization as number)}
            </span>
          </div>
          <Bar value={r.utilization as number} />
        </div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <Row label="Total Supply" value={`${fmt(r.totalSupply)} ${sym}`} />
          <Row label="Total Borrow" value={`${fmt(r.totalBorrow)} ${sym}`} />
          <Row label="C-Factor" value={formatPercent(r.collateralFactor as number)} />
          <Row label="L-Factor" value={formatPercent(r.liabilityFactor as number)} />
        </div>
      </div>
    </Card>
  );
}

// ─── POSITIONS ──────────────────────────────────────────────────

export function BlendPositionsCard({ data }: { data: Record<string, unknown> }) {
  const hasPos = data.hasPosition as boolean;
  const positions = (data.positions ?? []) as Record<string, unknown>[];
  const summary = data.summary as Record<string, unknown> | undefined;
  const collateral = (data.collateral ?? []) as Record<string, unknown>[];
  const supply = (data.supply ?? []) as Record<string, unknown>[];
  const liabilities = (data.liabilities ?? []) as Record<string, unknown>[];

  const supplied: Record<string, unknown>[] = positions.length
    ? positions.filter((p) => p.suppliedAmount != null)
    : [
        ...collateral.map((c) => ({ ...c, suppliedAmount: c.amount, isCollateral: true })),
        ...supply.map((s) => ({ ...s, suppliedAmount: s.amount, isCollateral: false })),
      ];
  const borrowed: Record<string, unknown>[] = positions.length
    ? positions.filter((p) => p.borrowedAmount != null)
    : liabilities.map((l) => ({ ...l, borrowedAmount: l.amount }));

  if (!hasPos && !supplied.length && !borrowed.length)
    return (
      <Card>
        <Empty icon={Wallet} text="No open positions" />
      </Card>
    );

  const hf = Number(summary?.healthFactor);
  const hfColor = !Number.isFinite(hf)
    ? "text-muted-foreground"
    : hf > 1.5
      ? "text-emerald-400"
      : hf > 1.1
        ? "text-amber-400"
        : "text-destructive";

  return (
    <Card>
      <Header icon={<Shield className="h-3.5 w-3.5" />} title="Position" />
      {summary && (
        <div className="grid grid-cols-4 gap-1.5 border-border border-b px-3 py-3">
          <MetricBox label="Supplied" value={`$${fmt(summary.totalSuppliedUsd)}`} />
          <MetricBox label="Borrowed" value={`$${fmt(summary.totalBorrowedUsd)}`} />
          <MetricBox label="Available" value={`$${fmt(summary.availableBorrowUsd)}`} />
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="mb-0.5 text-[10px] text-muted-foreground">Health</p>
            <p className={cn("font-semibold text-sm tabular-nums", hfColor)}>
              {Number.isFinite(hf) ? hf.toFixed(2) : "—"}
            </p>
          </div>
        </div>
      )}
      {supplied.length > 0 && <PositionSection type="supply" positions={supplied} showCollateral />}
      {borrowed.length > 0 && <PositionSection type="borrow" positions={borrowed} />}
    </Card>
  );
}

function PositionSection({
  type,
  positions,
  showCollateral,
}: {
  type: string;
  positions: Record<string, unknown>[];
  showCollateral?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-2.5",
        type === "supply" && positions.length > 0 && "border-border border-b"
      )}
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Tag type={type} />
        <span className="text-[10px] text-muted-foreground">{positions.length}</span>
      </div>
      {positions.map((p, i) => {
        const sym = String(p.symbol ?? p.asset ?? "?");
        const amount = type === "borrow" ? (p.borrowedAmount ?? p.amount) : p.suppliedAmount;
        const apy = type === "borrow" ? (p.borrowApy ?? p.apy) : (p.supplyApy ?? p.apy);
        return (
          <div key={i} className="flex items-center gap-2 py-1.5">
            <TokenImage src={null} alt={sym} className="h-5 w-5 rounded-full" />
            <span className="flex-1 font-medium text-foreground text-xs">{sym}</span>
            {showCollateral && p.isCollateral === true && <Tag type="collateral" />}
            <span className="text-foreground text-xs tabular-nums">{fmt(amount, 2)}</span>
            <span className="w-14 text-right text-[11px] text-muted-foreground tabular-nums">
              <Apy value={apy} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Shared primitives ──────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl border border-border bg-card">{children}</div>;
}

function Header({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-border border-b px-4 py-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 font-medium text-[13px] text-foreground">{title}</span>
      {right}
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Layers; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-8 text-muted-foreground">
      <Icon className="h-5 w-5 opacity-30" />
      <p className="text-xs">{text}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[9px] text-muted-foreground/60 uppercase">{label}</p>
      <p className="text-foreground text-xs tabular-nums">{value}</p>
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-2.5 py-2">
      <p className="mb-0.5 text-[10px] text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground text-sm tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground tabular-nums">{value}</span>
    </div>
  );
}
