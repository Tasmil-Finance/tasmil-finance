"use client";

import { Loader2 } from "lucide-react";
import type { PresetCardData, RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Hairline } from "../shared/hairline";

const LOW_APY_THRESHOLD_PCT = 1;

interface Props {
  presets: PresetCardData[] | undefined;
  value: RiskPreset;
  onSelect: (preset: RiskPreset) => void;
  baseAsset?: "USDC" | "XLM";
}

export function StepPreset({ presets, value, onSelect, baseAsset = "USDC" }: Props) {
  if (!presets) {
    return (
      <div data-testid="preset-loading" className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-[#555]" />
      </div>
    );
  }
  const selected = presets.find((p) => p.name === value);
  const lowApy = !!selected && selected.estimatedApy < LOW_APY_THRESHOLD_PCT;

  return (
    <div className="flex flex-col gap-1">
      {presets.map((p, i) => (
        <div key={p.name}>
          {i > 0 && <Hairline />}
          <button
            type="button"
            role="radio"
            aria-checked={p.name === value}
            onClick={() => onSelect(p.name)}
            className={cn(
              "w-full flex items-center justify-between py-4 px-2 text-left transition-colors",
              p.name === value ? "text-white" : "text-[#888] hover:text-white"
            )}
          >
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-[11px] text-[#555] mt-0.5">
                {p.poolCount} pool{p.poolCount === 1 ? "" : "s"} · {p.risks[0]}
              </p>
            </div>
            <p className="font-mono font-bold text-2xl text-primary tabular-nums">
              {p.estimatedApy.toFixed(2)}%
            </p>
          </button>
        </div>
      ))}
      {lowApy && (
        <p className="mt-2 text-[11px] text-amber-400">
          {value} with {baseAsset} pays &lt;1% right now. Try Balanced/Aggressive or switch asset.
        </p>
      )}
    </div>
  );
}
