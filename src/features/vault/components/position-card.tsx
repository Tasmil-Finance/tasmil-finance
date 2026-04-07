"use client";

import { cn } from "@/lib/utils";

import type { VaultPosition } from "../types";

interface PositionCardProps {
  position: VaultPosition;
  className?: string;
}

export function PositionCard({ position, className }: PositionCardProps) {
  const profit = Number.parseFloat(position.profitUsd);
  const isPositive = profit >= 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/20 p-6 text-center",
        className,
      )}
    >
      <div className="text-muted-foreground text-sm">Your Balance</div>
      <div className="mt-1 font-bold text-4xl text-foreground">${position.balanceUsd}</div>

      <div className="mt-3 flex items-center justify-center gap-4">
        <div>
          <span className={cn("font-medium", isPositive ? "text-green-500" : "text-red-400")}>
            {isPositive ? "+" : ""}${position.profitUsd}
          </span>
          <span className="ml-1 text-muted-foreground text-xs">
            ({isPositive ? "+" : ""}{position.profitPercent.toFixed(2)}%)
          </span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="text-muted-foreground text-sm">
          APY <span className="font-medium text-green-500">{position.currentApy.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
