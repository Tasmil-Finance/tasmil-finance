"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import type { VaultPosition } from "../types";

interface PositionBannerProps {
  position: VaultPosition;
  className?: string;
}

export function PositionBanner({ position, className }: PositionBannerProps) {
  const profit = Number.parseFloat(position.profitUsd);
  const isPositive = profit >= 0;

  return (
    <Link
      href="/vault/dashboard"
      className={cn(
        "flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10",
        className,
      )}
    >
      <div>
        <div className="font-medium text-foreground text-sm">Your vault position</div>
        <div className="font-bold text-foreground text-lg">${position.balanceUsd}</div>
      </div>
      <div className="text-right">
        <span className={cn("font-medium text-sm", isPositive ? "text-green-500" : "text-red-400")}>
          {isPositive ? "+" : ""}${position.profitUsd}
        </span>
        <div className="text-muted-foreground text-xs">View dashboard &rarr;</div>
      </div>
    </Link>
  );
}
