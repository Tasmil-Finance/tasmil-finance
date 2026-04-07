"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";

import type { PositionData } from "../types";

type Position = PositionData["positions"][number];

interface PositionListProps {
  positions: Position[];
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Unlocking...";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `Locked ${days}d ${hours}h`;
  return `Locked ${hours}h`;
}

const POOL_TYPE_COLOR: Record<string, string> = {
  lending: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  backstop: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  lp: "bg-teal-500/20 text-teal-400 border-teal-500/30",
};

export function PositionList({ positions }: PositionListProps) {
  if (positions.length === 0) {
    return (
      <p className="py-6 text-center text-muted-foreground text-sm">No positions yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {positions.map((pos) => (
        <PositionRow key={`${pos.poolName}-${pos.protocol}`} position={pos} />
      ))}
    </div>
  );
}

function PositionRow({ position }: { position: Position }) {
  const hasQ4W = position.poolType === "backstop" && position.q4wExpiresAt;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/10 px-4 py-3">
      {/* Left: Pool info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-foreground text-sm">{position.poolName}</span>
          <Badge
            className={cn(
              "text-[10px]",
              POOL_TYPE_COLOR[position.poolType] ?? "bg-muted text-muted-foreground",
            )}
          >
            {position.poolType}
          </Badge>
          {hasQ4W && (
            <Badge className="border-orange-500/30 bg-orange-500/20 text-[10px] text-orange-400">
              {formatCountdown(position.q4wExpiresAt!)}
            </Badge>
          )}
        </div>
        <span className="text-muted-foreground text-xs">{position.protocol}</span>
      </div>

      {/* Center: Allocation bar */}
      <div className="hidden w-28 flex-col gap-1 sm:flex">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
          <div
            className="h-full rounded-full bg-primary/60 transition-all"
            style={{ width: `${Math.min(position.allocationPercent, 100)}%` }}
          />
        </div>
        <span className="text-center text-[10px] text-muted-foreground">
          {position.allocationPercent.toFixed(1)}%
        </span>
      </div>

      {/* Right: Value + APY */}
      <div className="flex flex-col items-end">
        <span className="font-medium font-mono text-foreground text-sm">
          {formatUsd(position.valueUsd)}
        </span>
        <span className="font-mono text-emerald-400 text-xs">
          {position.apy.toFixed(2)}% APY
        </span>
      </div>
    </div>
  );
}
