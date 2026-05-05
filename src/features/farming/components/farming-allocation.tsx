"use client";

import { motion } from "framer-motion";
import { Info, Layers } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Skeleton } from "@/shared/ui/skeleton";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatApyPercent(apyDecimal: number): string {
  return `${(apyDecimal * 100).toFixed(2)}%`;
}

const PROTOCOL_COLOR: Record<string, string> = {
  blend: "#00bfff",
  soroswap: "#36b1ff",
  aquarius: "#5eadd6",
  phoenix: "#7faabe",
  wallet: "#525252",
};
const FALLBACK_COLOR = "#a0a0a0";

function colorFor(protocol: string): string {
  return PROTOCOL_COLOR[protocol.toLowerCase()] ?? FALLBACK_COLOR;
}

interface Position {
  poolName: string;
  poolType: string;
  protocol: string;
  allocationPercent: number;
  valueUsd: number;
  apy: number;
  q4wExpiresAt?: string;
}

interface FarmingAllocationProps {
  positions: Position[];
  unallocatedWalletUsd: number;
  isLoading: boolean;
}

export function FarmingAllocation({
  positions,
  unallocatedWalletUsd,
  isLoading,
}: FarmingAllocationProps) {
  const pieData = positions.map((pos) => ({
    name: pos.poolName,
    protocol: pos.protocol,
    value: pos.valueUsd,
    apy: pos.apy,
    fill: colorFor(pos.protocol),
  }));

  if (unallocatedWalletUsd > 0.01) {
    pieData.push({
      name: "Unallocated",
      protocol: "wallet",
      value: unallocatedWalletUsd,
      apy: 0,
      fill: colorFor("wallet"),
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  // No positions — show chart-like empty state (matching Performance card shape)
  if (positions.length === 0) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-foreground">Allocation</h2>
          <Info className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
          <Layers className="h-7 w-7 opacity-40" />
          <p className="text-sm">No active positions yet</p>
          <p className="text-xs text-muted-foreground/60">
            Deposit funds and the agent will allocate across pools.
          </p>
        </div>
      </div>
    );
  }

  // Has positions — donut chart + legend
  return (
    <motion.div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground">Allocation</h2>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>

      <p className="text-sm text-muted-foreground">
        {positions.length} position{positions.length !== 1 ? "s" : ""} across protocols
      </p>

      {/* Donut chart + legend */}
      <div className="flex flex-col items-stretch gap-4 sm:gap-6 lg:flex-col xl:flex-row xl:items-center">
        <div className="mx-auto h-36 w-36 shrink-0 xl:mx-0 xl:h-40 xl:w-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                animationBegin={100}
                animationDuration={800}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload as (typeof pieData)[0];
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                      <p className="text-sm font-medium text-foreground">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.protocol} · {formatUsd(d.value)}
                        {d.apy > 0 && ` · ${formatApyPercent(d.apy)}`}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {pieData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-3">
              <div
                data-protocol-swatch={entry.protocol}
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-foreground">{entry.name}</span>
                <span className="text-xs capitalize text-muted-foreground">{entry.protocol}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-foreground">
                  {formatUsd(entry.value)}
                </span>
                {entry.apy > 0 && (
                  <span className="text-xs text-primary">{formatApyPercent(entry.apy)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
