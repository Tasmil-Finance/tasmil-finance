"use client";

import { useMemo } from "react";
import { useDefiPositions } from "./use-defi-positions";

export interface ProtocolStats {
  tvl: string;
  netDeposits: string;
  positionsCount: string;
  blendedApy: string;
  isLoading: boolean;
}

const USD_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function useProtocolStats(address: string | null | undefined): ProtocolStats {
  const { groups, vaultPnl, totalValueUsd, isLoading } = useDefiPositions(address);

  const positionsCount = useMemo(() => {
    let positions = 0;
    let protocols = 0;
    for (const g of groups) {
      if (g.positions.length > 0) {
        positions += g.positions.length;
        protocols += 1;
      }
    }
    return `${positions} / ${protocols}`;
  }, [groups]);

  return useMemo<ProtocolStats>(
    () => ({
      tvl: USD_FORMATTER.format(totalValueUsd),
      netDeposits: vaultPnl ? USD_FORMATTER.format(vaultPnl.netDepositsUsd) : "—",
      positionsCount,
      blendedApy: vaultPnl ? `${vaultPnl.currentApy.toFixed(2)}%` : "—",
      isLoading,
    }),
    [totalValueUsd, vaultPnl, positionsCount, isLoading],
  );
}
