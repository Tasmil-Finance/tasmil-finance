"use client";

import { Flame, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

import type { PresetCardData, RiskPreset } from "../types";

function formatApyPercent(apyPercent: number): string {
  return apyPercent.toFixed(1);
}

interface PresetCardProps {
  preset: PresetCardData;
  selected: boolean;
  onSelect: () => void;
}

interface PresetConfig {
  icon: typeof Shield;
  description: string;
  tone: { label: string; className: string };
}

const PRESET_CONFIG: Record<RiskPreset, PresetConfig> = {
  Safe: {
    icon: Shield,
    description: "Stablecoin lending with minimal risk exposure",
    tone: {
      label: "Low risk",
      className: "bg-emerald-500/10 text-emerald-400",
    },
  },
  Balanced: {
    icon: TrendingUp,
    description: "Diversified lending & liquidity pools",
    tone: {
      label: "Diversified",
      className: "bg-primary/10 text-primary",
    },
  },
  Aggressive: {
    icon: Flame,
    description: "High-yield strategies with backstop exposure",
    tone: {
      label: "High yield",
      className: "bg-amber-500/10 text-amber-400",
    },
  },
};

const RECOMMENDED_PRESET: RiskPreset = "Balanced";

export function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  const config = PRESET_CONFIG[preset.name];
  const Icon = config.icon;
  const isRecommended = preset.name === RECOMMENDED_PRESET;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group relative flex h-full w-full cursor-pointer flex-col rounded-2xl border border-white/6 bg-white/3 p-5 text-left",
        "transition-all duration-200 ease-out",
        "hover:border-white/12 hover:bg-white/5",
        selected && "border-primary/40 shadow-lg shadow-primary/15 ring-2 ring-primary/40"
      )}
    >
      <div className="relative flex flex-1 flex-col gap-4">
        {/* Header: icon + name + recommended + tone pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/30 transition-colors",
                selected && "bg-primary/15"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-colors",
                  selected && "text-primary"
                )}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-base text-foreground tracking-tight">
                  {preset.name}
                </h3>
                {isRecommended && (
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 font-medium text-[10px] text-primary uppercase tracking-wider">
                    Recommended
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-muted-foreground/70 leading-tight">
                {config.description}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 font-medium text-[10px]",
              config.tone.className
            )}
          >
            {config.tone.label}
          </span>
        </div>

        {/* APY — hero number, neutral foreground */}
        <div>
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Est. APY</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-bold font-mono text-4xl text-foreground tracking-tight">
              {formatApyPercent(preset.estimatedApy)}
            </span>
            <span className="font-semibold text-muted-foreground text-xl">%</span>
          </div>
        </div>

        {/* Pool allocation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
              Allocation
            </p>
            <p className="text-[10px] text-muted-foreground/60">
              {preset.poolCount} pool{preset.poolCount !== 1 ? "s" : ""}
            </p>
          </div>

          {preset.topPools.slice(0, 3).map((pool) => (
            <div key={pool.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-foreground/85 text-xs">{pool.name}</span>
                <div className="flex items-center gap-2 pl-2">
                  <span className="font-mono text-[11px] text-muted-foreground/60">
                    {formatApyPercent(pool.apy)}%
                  </span>
                  <span className="w-10 text-right font-mono text-[11px] text-foreground/70">
                    {pool.weight.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/4">
                <div
                  className="h-full rounded-full bg-foreground/25 transition-all duration-500"
                  style={{ width: `${Math.min(pool.weight, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Risk tags — neutral, pinned to bottom so cards align across grid row */}
        <div className="mt-auto flex flex-wrap gap-1.5">
          {preset.risks.map((risk) => (
            <span
              key={risk}
              className="rounded-full border border-white/8 bg-white/3 px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {risk}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
