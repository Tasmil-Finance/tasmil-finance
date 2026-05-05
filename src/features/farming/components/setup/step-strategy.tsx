"use client";

import type { PresetCardData, RiskPreset } from "@/features/account/types";
import type { Asset } from "../shared/asset-pill";
import { AssetPill } from "../shared/asset-pill";
import { CircleButton } from "../shared/circle-button";
import type { Mode } from "../shared/mode-toggle";
import { StepPoolPicker } from "./step-pool-picker";
import { StepPreset } from "./step-preset";

interface Props {
  asset: Asset;
  mode: Mode;
  preset: RiskPreset;
  customMarkets: string[];
  balances: { usdc: number; xlm: number };
  presets: PresetCardData[] | undefined;
  onAssetChange: (asset: Asset) => void;
  onModeChange: (mode: Mode) => void;
  onPresetChange: (preset: RiskPreset) => void;
  onCustomMarketsChange: (next: string[]) => void;
}

const fmt = (n: number, asset: Asset) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: asset === "USDC" ? 2 : 4,
  });

function InlineModeToggle({ value, onChange }: { value: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="flex gap-3">
      <CircleButton
        variant={value === "AUTO" ? "radial-cyan" : "ghost"}
        size="lg"
        onClick={() => onChange("AUTO")}
        aria-pressed={value === "AUTO"}
      >
        Auto
      </CircleButton>
      <CircleButton
        variant={value === "CUSTOM" ? "radial-cyan" : "ghost"}
        size="lg"
        onClick={() => onChange("CUSTOM")}
        aria-pressed={value === "CUSTOM"}
      >
        Custom
      </CircleButton>
    </div>
  );
}

export function StepStrategy({
  asset,
  mode,
  preset,
  customMarkets,
  balances,
  presets,
  onAssetChange,
  onModeChange,
  onPresetChange,
  onCustomMarketsChange,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl text-foreground tracking-tight">Tasmil Agent Strategy</h1>
        <p className="text-muted-foreground text-sm">
          Choose your deposit asset, how the agent should allocate, and your risk profile.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          Deposit asset
        </p>
        <div className="grid grid-cols-2 gap-3">
          <AssetPill
            asset="USDC"
            hint={`${fmt(balances.usdc, "USDC")} avail`}
            selected={asset === "USDC"}
            onSelect={onAssetChange}
          />
          <AssetPill
            asset="XLM"
            hint={`${fmt(balances.xlm, "XLM")} avail`}
            selected={asset === "XLM"}
            onSelect={onAssetChange}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          Allocation mode
        </p>
        <InlineModeToggle value={mode} onChange={onModeChange} />
      </section>

      <section className="flex flex-col gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          {mode === "AUTO" ? "Risk preset" : "Custom mode"}
        </p>
        {mode === "AUTO" ? (
          <StepPreset presets={presets} value={preset} onSelect={onPresetChange} baseAsset={asset} />
        ) : (
          <StepPoolPicker value={customMarkets} onChange={onCustomMarketsChange} />
        )}
      </section>
    </div>
  );
}
