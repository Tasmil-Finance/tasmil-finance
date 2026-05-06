"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIER_STYLES, type Tier, tierFromVolume } from "../lib/tier";

interface PodiumCardProps {
  rank: 1 | 2 | 3;
  walletAddress: string;
  volumeUsd: number;
}

const RANK_GRADIENT: Record<1 | 2 | 3, string> = {
  1: "bg-gradient-to-b from-yellow-300/30 to-amber-500/10 border-yellow-400/40",
  2: "bg-gradient-to-b from-slate-200/30 to-slate-400/10 border-slate-300/40",
  3: "bg-gradient-to-b from-orange-300/30 to-amber-700/10 border-orange-400/40",
};

const RANK_HEIGHT: Record<1 | 2 | 3, string> = {
  1: "min-h-[200px]",
  2: "min-h-[170px]",
  3: "min-h-[150px]",
};

function shorten(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function PodiumCard({ rank, walletAddress, volumeUsd }: PodiumCardProps) {
  const tier: Tier = tierFromVolume(volumeUsd);
  const tierStyle = TIER_STYLES[tier];

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-end gap-3 rounded-2xl border p-4",
        RANK_GRADIENT[rank],
        RANK_HEIGHT[rank]
      )}
      data-testid={`podium-rank-${rank}`}
    >
      <Trophy className="h-8 w-8 text-foreground" />
      <div className="font-bold text-3xl text-foreground">#{rank}</div>
      <div className="font-mono text-muted-foreground text-sm">{shorten(walletAddress)}</div>
      <div className="font-semibold text-foreground text-lg">{formatUsd(volumeUsd)}</div>
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 font-semibold text-xs",
          tierStyle.bg,
          tierStyle.text
        )}
      >
        {tierStyle.label}
      </span>
    </div>
  );
}
