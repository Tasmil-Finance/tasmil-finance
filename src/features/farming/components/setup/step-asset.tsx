"use client";

import type { Asset } from "../shared/asset-pill";
import { AssetPill } from "../shared/asset-pill";

interface Props {
  value: Asset;
  balances: { usdc: number; xlm: number };
  onSelect: (asset: Asset) => void;
  reconfigure?: boolean;
}

const fmt = (n: number, asset: Asset) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: asset === "USDC" ? 2 : 4,
  });

export function StepAsset({ value, balances, onSelect, reconfigure }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <AssetPill
          asset="USDC"
          hint={`${fmt(balances.usdc, "USDC")} avail`}
          selected={value === "USDC"}
          disabled={!!reconfigure}
          onSelect={onSelect}
        />
        <AssetPill
          asset="XLM"
          hint={`${fmt(balances.xlm, "XLM")} avail`}
          selected={value === "XLM"}
          disabled={!!reconfigure}
          onSelect={onSelect}
        />
      </div>
      {reconfigure && (
        <p className="text-center text-[11px] text-[#666]">
          Asset can't be changed after funding.
        </p>
      )}
    </div>
  );
}
