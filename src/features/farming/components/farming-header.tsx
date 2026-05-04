"use client";

import { motion } from "framer-motion";
import { Tractor, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "@/shared/ui/count-up";
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

interface FarmingHeaderProps {
  totalValueUsd: number;
  allTimePnlUsd: number;
  allTimePnlPercent: number;
  currentApy: number;
  isLoading: boolean;
}

export function FarmingHeader({
  totalValueUsd,
  allTimePnlUsd,
  allTimePnlPercent,
  currentApy,
  isLoading,
}: FarmingHeaderProps) {
  const isPositive = allTimePnlUsd >= 0;
  const hasPnl = allTimePnlUsd !== 0 || allTimePnlPercent !== 0;

  return (
    <motion.div
      className="flex items-center gap-4 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Icon — same size as AddressAvatar (size-20) */}
      <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/15">
        <Tractor className="size-9 text-primary" />
      </div>

      <div className="flex flex-col gap-1">
        {/* Line 1 — clean single-color text like portfolio address line */}
        <span className="flex items-center gap-1.5 text-base font-medium text-muted-foreground transition-colors">
          {currentApy > 0 ? `APY ${formatApyPercent(currentApy)}` : "Yield Farming"}
        </span>

        {/* Line 2 + 3: value + P&L — copy-paste from WalletHeader */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-0.5"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div className="text-5xl font-bold tracking-tight text-foreground">
              <CountUp
                value={totalValueUsd}
                prefix="$"
                decimals={2}
                duration={0.8}
                abbreviate={false}
              />
            </div>
            {hasPnl && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span
                  className={cn(
                    "text-base font-medium",
                    isPositive ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {formatUsd(allTimePnlUsd)}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-sm font-semibold",
                    isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}
                >
                  {isPositive ? "+" : ""}
                  {allTimePnlPercent.toFixed(2)}%
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
