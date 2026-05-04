"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type DeltaTone = "positive" | "negative" | "neutral";
type SparklineState = "placeholder" | "live" | "loading";

interface StatCardProps {
  label: string;
  value: string;
  delta?: { text: string; tone: DeltaTone };
  sparklineState?: SparklineState;
  /** Optional sparkline node (Phase 2). When omitted and state="placeholder", shows trend-soon copy. */
  sparkline?: React.ReactNode;
}

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-muted-foreground",
};

export function StatCard({ label, value, delta, sparklineState, sparkline }: StatCardProps) {
  return (
    <motion.article
      role="article"
      aria-label={`${label}: ${value}`}
      className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-card p-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {value}
      </span>
      {delta && (
        <span className={cn("text-sm font-medium", DELTA_TONE_CLASS[delta.tone])}>
          {delta.text}
        </span>
      )}
      <div className="mt-1 h-10">
        {sparklineState === "placeholder" && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Trend coming soon
          </p>
        )}
        {sparkline}
      </div>
    </motion.article>
  );
}
