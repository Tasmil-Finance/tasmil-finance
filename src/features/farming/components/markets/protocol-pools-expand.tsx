"use client";

import type { DiscoveredPool } from "../../types";

interface Props {
  pools: DiscoveredPool[];
  excluded: string[];
  onChange: (next: string[]) => void;
}

export function ProtocolPoolsExpand({ pools, excluded, onChange }: Props) {
  const toggle = (id: string, on: boolean) => {
    const set = new Set(excluded);
    if (on) set.delete(id);
    else set.add(id);
    onChange(Array.from(set));
  };
  return (
    <ul className="mt-3 divide-y divide-[#1a1a1a] rounded-md border border-[#1a1a1a] bg-[#050505]">
      {pools.map((p) => {
        const on = !excluded.includes(p.id);
        return (
          <li key={p.id} className="flex items-center justify-between px-3 py-2 text-xs">
            <div>
              <p className="text-white">
                {p.assetSymbol}
                {p.pairedAssetSymbol ? `/${p.pairedAssetSymbol}` : ""}
              </p>
              <p className="text-[10px] text-[#555] capitalize">{p.poolType}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-primary tabular-nums">
                {(p.currentApy * 100).toFixed(2)}%
              </span>
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => toggle(p.id, e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
