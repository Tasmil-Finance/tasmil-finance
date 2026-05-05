"use client";

import { motion } from "framer-motion";
import { Loader2, ShieldOff } from "lucide-react";
import { PresetCard } from "@/features/account/components/preset-card";
import type { PresetCardData, RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import type { DiscoveredPool } from "../../types";
import { FarmingPools } from "../farming-pools";

interface ManageTabProps {
  presets: PresetCardData[] | undefined;
  presetsLoading: boolean;
  selectedPreset: RiskPreset | null;
  onSelectPreset: (preset: RiskPreset) => void;
  currentPreset: string | undefined;
  previewAsset: "USDC" | "XLM";
  onChangePreviewAsset: (asset: "USDC" | "XLM") => void;
  activeAssets: string[];
  isRevoked: boolean;
  isUpdatingPreset: boolean;
  actionError: string | null;
  onApply: () => void;
  pools: DiscoveredPool[];
  poolsLoading: boolean;
  /** Composite keys (`${protocol.toLowerCase()}:${assetSymbol}${pair}`) for in-position rows */
  inPositionKeys?: Set<string>;
  onSelectPool?: (pool: DiscoveredPool) => void;
}

export function ManageTab({
  presets,
  presetsLoading,
  selectedPreset,
  onSelectPreset,
  currentPreset,
  previewAsset,
  onChangePreviewAsset,
  activeAssets,
  isRevoked,
  isUpdatingPreset,
  actionError,
  onApply,
  pools,
  poolsLoading,
  inPositionKeys,
  onSelectPool,
}: ManageTabProps) {
  const currentPresetLabel = currentPreset
    ? currentPreset.charAt(0) + currentPreset.slice(1).toLowerCase()
    : "Balanced";
  const activeAssetsUpper = activeAssets.map((a) => a.toUpperCase());

  return (
    <motion.div
      key="manage"
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
    >
      <section className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground text-xl">Choose Your Strategy</h2>
            <p className="text-muted-foreground text-sm">
              Current preset:{" "}
              <span className="font-medium text-foreground">{currentPresetLabel}</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(["USDC", "XLM"] as const).map((asset) => {
              const isActive = previewAsset === asset;
              const isCurrentBase = activeAssetsUpper.includes(asset);
              const poolCount = pools.filter(
                (p) => p.assetSymbol === asset && !!p.strategyContractAddress
              ).length;
              return (
                <button
                  type="button"
                  key={asset}
                  onClick={() => onChangePreviewAsset(asset)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all",
                    isActive
                      ? "border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/40"
                      : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/12 hover:text-foreground"
                  )}
                >
                  <span className="font-semibold">{asset}</span>
                  <span className="text-[10px] text-muted-foreground/70">
                    ({poolCount} pool{poolCount !== 1 ? "s" : ""})
                  </span>
                  {isCurrentBase && (
                    <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-400">
                      active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isRevoked && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 text-sm">
            <ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Session key is revoked. Reactivate from Settings before changing your strategy.
            </p>
          </div>
        )}

        {selectedPreset && selectedPreset?.toUpperCase() !== currentPreset?.toUpperCase() && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "sticky top-0 z-10 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-card px-4 py-2.5",
              (isRevoked || isUpdatingPreset) && "opacity-60"
            )}
          >
            <p className="text-sm">
              <span className="font-medium text-foreground">{selectedPreset} selected</span>
              <span className="text-muted-foreground"> · current: {currentPresetLabel}</span>
            </p>
            <div className="flex items-center gap-3">
              {actionError && <p className="text-destructive text-xs">{actionError}</p>}
              <Button
                variant="gradient"
                size="sm"
                className="h-9 px-5"
                onClick={onApply}
                disabled={isRevoked || isUpdatingPreset}
              >
                {isUpdatingPreset && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Apply Strategy
              </Button>
            </div>
          </motion.div>
        )}

        {presetsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : presets && presets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                selected={selectedPreset === preset.name}
                onSelect={() => {
                  if (!isRevoked && !isUpdatingPreset) onSelectPreset(preset.name);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/10 p-6 text-center text-muted-foreground text-sm">
            Strategy options are loading. If this persists, please refresh the page.
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-semibold text-foreground text-xl">Available Pools</h2>
        <FarmingPools
          pools={pools}
          isLoading={poolsLoading}
          assetFilter={previewAsset}
          inPositionKeys={inPositionKeys}
          onSelectPool={onSelectPool}
        />
      </section>
    </motion.div>
  );
}
