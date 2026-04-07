"use client";

import { cn } from "@/lib/utils";

import type { AllocationInfo } from "../types";

interface AllocationBarProps {
  allocations: AllocationInfo[];
  className?: string;
}

export function AllocationBar({ allocations, className }: AllocationBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="font-semibold text-foreground text-sm">Strategy Allocations</h3>
      {allocations.map((a) => (
        <div key={a.name} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{a.name}</span>
            <span className="text-muted-foreground">
              {a.weight}% &middot; {a.apy.toFixed(2)}% APY
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${a.weight}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
