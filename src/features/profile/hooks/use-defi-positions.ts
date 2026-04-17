"use client";

import { usePosition } from "@/features/account/hooks/use-account-api";
import { useBlendPositions } from "./use-blend-positions";
import { useAquariusPositions } from "./use-aquarius-positions";

export interface PositionItem {
  name: string;
  type: "vault" | "supply" | "borrow" | "lp" | "stake";
  asset: string;
  valueUsd: number;
  apy?: number;
  allocationPercent?: number;
  extra?: string;
}

export interface ProtocolPositionGroup {
  protocol: string;
  displayName: string;
  icon: string | null;
  totalValueUsd: number;
  positions: PositionItem[];
}

// ─── Tasmil vault positions (from backend) ────────────────────────────────────

function useTasmilGroup(publicKey: string | null | undefined) {
  const { data: pos, isLoading } = usePosition(publicKey ?? undefined);

  const group: ProtocolPositionGroup | null =
    pos && pos.positions.length > 0
      ? {
          protocol: "tasmil-vault",
          displayName: "Tasmil Vault",
          icon: null,
          totalValueUsd: pos.totalValueUsd,
          positions: pos.positions.map((p) => ({
            name: p.poolName,
            type: "vault" as const,
            asset: p.poolType,
            valueUsd: p.valueUsd,
            apy: p.apy,
            allocationPercent: p.allocationPercent,
            extra: `${p.allocationPercent.toFixed(1)}%`,
          })),
        }
      : null;

  return { group, isLoading };
}

// ─── Combined hook ────────────────────────────────────────────────────────────

export function useDefiPositions(address: string | null | undefined) {
  const { group: tasmilGroup, isLoading: tasmilLoading } = useTasmilGroup(address);
  const { data: blendGroups, isLoading: blendLoading } = useBlendPositions(address);
  const { data: aquaGroup, isLoading: aquaLoading } = useAquariusPositions(address);

  const groups: ProtocolPositionGroup[] = [];
  if (tasmilGroup) groups.push(tasmilGroup);
  if (blendGroups) groups.push(...blendGroups);
  if (aquaGroup) groups.push(aquaGroup);

  return {
    groups,
    isLoading: tasmilLoading || blendLoading || aquaLoading,
    totalValueUsd: groups.reduce((s, g) => s + g.totalValueUsd, 0),
  };
}
