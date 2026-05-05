"use client";

import { cn } from "@/lib/utils";

export type Asset = "USDC" | "XLM";

interface Props {
  asset: Asset;
  hint?: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (asset: Asset) => void;
}

export function AssetPill({ asset, hint, selected, disabled, onSelect }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={!!selected}
      onClick={() => !disabled && onSelect?.(asset)}
      className={cn(
        "rounded-xl border px-3.5 py-1.5 text-sm transition-all",
        "disabled:cursor-not-allowed disabled:opacity-60",
        selected
          ? "border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/40"
          : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/12 hover:text-foreground"
      )}
    >
      <span className="font-semibold">{asset}</span>
      {hint && <span className="ml-1.5 text-muted-foreground/60 text-xs">· {hint}</span>}
    </button>
  );
}
