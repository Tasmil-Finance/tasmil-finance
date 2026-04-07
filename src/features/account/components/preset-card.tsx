"use client";

import { cn } from "@/lib/utils";

import type { PresetCardData, RiskPreset } from "../types";

interface PresetCardProps {
  preset: PresetCardData;
  selected: boolean;
  onSelect: () => void;
}

const GRADIENT_MAP: Record<RiskPreset, string> = {
  Safe: "from-emerald-500/20 to-emerald-900/40",
  Balanced: "from-blue-500/20 to-blue-900/40",
  Aggressive: "from-orange-500/20 to-red-900/40",
};

const BORDER_MAP: Record<RiskPreset, string> = {
  Safe: "border-emerald-500/60 ring-emerald-500/30",
  Balanced: "border-blue-500/60 ring-blue-500/30",
  Aggressive: "border-orange-500/60 ring-orange-500/30",
};

export function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  const gradient = GRADIENT_MAP[preset.name];
  const selectedBorder = BORDER_MAP[preset.name];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full cursor-pointer rounded-xl border bg-gradient-to-b p-5 text-left transition-all duration-200",
        gradient,
        selected
          ? cn("ring-2", selectedBorder)
          : "border-border/50 hover:border-border",
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-bold text-foreground text-lg">{preset.name}</h3>
        <span className="font-bold font-mono text-foreground text-xl">
          ~{preset.estimatedApy.toFixed(1)}%
        </span>
      </div>

      {/* Pool type badges */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {preset.poolTypes.map((type) => (
          <span
            key={type}
            className="rounded-full border border-border/50 bg-background/30 px-2 py-0.5 text-muted-foreground text-xs"
          >
            {type}
          </span>
        ))}
      </div>

      {/* Risks */}
      <ul className="mb-4 space-y-1">
        {preset.risks.map((risk) => (
          <li key={risk} className="flex items-start gap-1.5 text-muted-foreground text-xs">
            <span className="mt-0.5 block h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
            {risk}
          </li>
        ))}
      </ul>

      {/* Top pools */}
      <div className="space-y-1.5 rounded-lg bg-background/20 p-3">
        <span className="font-medium text-muted-foreground text-xs">Top pools</span>
        {preset.topPools.slice(0, 3).map((pool) => (
          <div key={pool.name} className="flex items-center justify-between text-xs">
            <span className="text-foreground">{pool.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{pool.apy.toFixed(1)}% APY</span>
              <span className="font-mono text-foreground">{pool.weight}%</span>
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}
