"use client";

import { motion } from "framer-motion";
import { LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";
import type { HistoryPoint, HistoryRange } from "../hooks/use-portfolio-history";

const RANGES: HistoryRange[] = ["7d", "30d", "90d", "all"];
const RANGE_LABEL: Record<HistoryRange, string> = {
  "7d": "7d",
  "30d": "30d",
  "90d": "90d",
  all: "All",
};

interface PerformanceChartProps {
  data: HistoryPoint[];
  range: HistoryRange;
  isPlaceholder: boolean;
  isLoading: boolean;
  onRangeChange: (range: HistoryRange) => void;
}

export function PerformanceChart({
  data,
  range,
  isPlaceholder,
  isLoading,
  onRangeChange,
}: PerformanceChartProps) {
  return (
    <motion.div
      className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-5"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground text-xl">Portfolio Value</h2>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border/40 bg-muted/10 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={r === range}
              onClick={() => onRangeChange(r)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium text-xs transition-colors",
                r === range
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Skeleton data-testid="chart-skeleton" className="h-48 w-full rounded-lg" />
      ) : isPlaceholder ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-border/40 border-dashed bg-muted/5 text-center">
          <p className="font-medium text-muted-foreground text-sm">No history yet</p>
          <p className="max-w-sm text-muted-foreground/70 text-xs">
            Daily portfolio history rolls up overnight. Your first data point lands tomorrow.
          </p>
        </div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>{/* Phase 2 will add axes, line, tooltip */}</LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
