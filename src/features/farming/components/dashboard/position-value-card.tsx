"use client";

import { Plus, Power } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export interface ChartPoint {
  t: number;
  v: number;
}

interface Props {
  totalBalanceUsd: number;
  totalDepositedUsd: number;
  lifetimeEarningsUsd: number;
  lifetimeEarningsPct: number;
  chartSeries: ChartPoint[];
  onAddFunds: () => void;
  onDeactivate: () => void;
}

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PositionValueCard({
  totalBalanceUsd,
  totalDepositedUsd,
  lifetimeEarningsUsd,
  lifetimeEarningsPct,
  chartSeries,
  onAddFunds,
  onDeactivate,
}: Props) {
  const [tab, setTab] = useState<"value" | "yield">("value");

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full bg-muted p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("value")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              tab === "value" ? "bg-background text-foreground" : "text-muted-foreground",
            )}
          >
            Position Value
          </button>
          <button
            type="button"
            onClick={() => setTab("yield")}
            className={cn(
              "rounded-full px-3 py-1 transition-colors",
              tab === "yield" ? "bg-background text-foreground" : "text-muted-foreground",
            )}
          >
            Yield Projection
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDeactivate}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Power className="h-3.5 w-3.5" /> Deactivate
          </button>
          <button
            type="button"
            onClick={onAddFunds}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/25"
          >
            <Plus className="h-3.5 w-3.5" /> Add funds
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="col-span-3">
          <p className="text-xs text-muted-foreground">Total balance</p>
          <p className="font-mono font-semibold text-3xl text-foreground tabular-nums">
            {fmtUsd(totalBalanceUsd)} USDC
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total deposited</p>
          <p className="mt-1 font-mono text-foreground/80 tabular-nums">
            {fmtUsd(totalDepositedUsd)} USDC
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-xs text-emerald-300 tabular-nums">
            {fmtUsd(lifetimeEarningsUsd)} USDC ({lifetimeEarningsPct.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="mt-6 h-48 w-full">
        {chartSeries.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartSeries}>
              <defs>
                <linearGradient id="positionValueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(203, 100%, 61%)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(203, 100%, 61%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" hide />
              <YAxis hide />
              <Tooltip cursor={false} content={() => null} />
              <Area
                type="monotone"
                dataKey="v"
                stroke="hsl(203, 100%, 61%)"
                strokeWidth={2}
                fill="url(#positionValueFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            History building…
          </div>
        )}
      </div>
    </div>
  );
}
