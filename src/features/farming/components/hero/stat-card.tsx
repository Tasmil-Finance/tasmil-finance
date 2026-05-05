"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type DeltaTone = "positive" | "negative" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  delta?: { text: string; tone: DeltaTone };
  /** Optional sparkline node. Slot renders only when provided. Phase 2 will wire real charts. */
  sparkline?: React.ReactNode;
}

const DELTA_TONE_CLASS: Record<DeltaTone, string> = {
  positive: "text-emerald-400",
  negative: "text-red-400",
  neutral: "text-muted-foreground",
};

export function StatCard({ label, value, delta, sparkline }: StatCardProps) {
  return (
    <motion.article
      role="article"
      aria-label={`${label}: ${value}`}
      className="flex flex-col gap-2 rounded-2xl border border-border/40 bg-card p-5"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span className="font-medium text-[11px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="font-bold font-mono text-3xl text-foreground tracking-tight sm:text-4xl">
        {value}
      </span>
      {delta && (
        <span className={cn("font-medium text-sm", DELTA_TONE_CLASS[delta.tone])}>
          {delta.text}
        </span>
      )}
      {sparkline && <div className="mt-1 h-10">{sparkline}</div>}
    </motion.article>
  );
}
