"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";
import type { WalletToken } from "../hooks/use-wallet-tokens";
import { usePortfolioHistory } from "../hooks/use-portfolio-history";

const TIME_PERIODS = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
] as const;

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatChartDate(timestamp: number, days: number): string {
  const date = new Date(timestamp);
  if (days <= 1) {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface PerformanceChartProps {
  tokens: WalletToken[];
  totalUsd: number;
  isLoadingTokens: boolean;
}

export function PerformanceChart({ tokens, totalUsd, isLoadingTokens }: PerformanceChartProps) {
  const [selectedDays, setSelectedDays] = useState<number>(7);

  const { data: chartData } = usePortfolioHistory(tokens, totalUsd, selectedDays);

  const hasEnoughData = chartData.length >= 2;

  // Compute PnL from first to last point
  const firstValue = chartData[0]?.value ?? totalUsd;
  const lastValue = chartData.at(-1)?.value ?? totalUsd;
  const changeAbsolute = lastValue - firstValue;
  const changePercent = firstValue > 0 ? (changeAbsolute / firstValue) * 100 : 0;
  const isPositive = changePercent >= 0;

  const chartColor = isPositive ? "#22c55e" : "#ef4444";
  const showLoading = isLoadingTokens;

  return (
    <motion.div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground">Performance</h2>
        <Info className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Value + PnL */}
      {isLoadingTokens ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-36 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded-md" />
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <span className="text-[32px] font-bold tracking-tight text-foreground">
            {formatUsd(totalUsd)}
          </span>
          {hasEnoughData && (
            <span className={cn("text-base font-medium", isPositive ? "text-emerald-400" : "text-destructive")}>
              {isPositive ? "+" : ""}
              {changePercent.toFixed(2)}% ({formatUsd(Math.abs(changeAbsolute))})
            </span>
          )}
        </motion.div>
      )}

      {/* Chart area */}
      <div className="relative h-[150px] w-full sm:h-[200px]">
        {showLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !hasEnoughData ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-sm text-muted-foreground">
            <p>Not enough price history data</p>
            <p className="text-xs">Try a different time period</p>
          </div>
        ) : (
          <div className="flex h-full">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0]?.payload as { timestamp: number; value: number };
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
                          <p className="text-xs text-muted-foreground">
                            {formatChartDate(point.timestamp, selectedDays)}
                          </p>
                          <p className="text-sm font-semibold text-foreground">
                            {formatUsd(point.value)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill="url(#perfGradient)"
                    dot={false}
                    activeDot={{ r: 4, fill: chartColor }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Y-axis labels */}
            <div className="flex w-14 flex-col justify-between pl-2 text-xs text-muted-foreground">
              <span>{formatUsd(Math.max(...chartData.map((d) => d.value)))}</span>
              <span>{formatUsd(Math.min(...chartData.map((d) => d.value)))}</span>
            </div>
          </div>
        )}
      </div>

      {/* Time period buttons */}
      <div className="flex items-center gap-2">
        {TIME_PERIODS.map((period) => (
          <button
            key={period.label}
            onClick={() => setSelectedDays(period.days)}
            className={cn(
              "relative rounded-xl px-3 py-1 text-[13px] font-medium transition-colors",
              selectedDays === period.days
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {selectedDays === period.days && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-secondary"
                layoutId="chart-period"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{period.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
