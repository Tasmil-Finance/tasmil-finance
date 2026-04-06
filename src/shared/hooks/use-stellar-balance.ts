"use client";

import { useCallback, useEffect, useState } from "react";
import { activeNetwork } from "@/shared/config/stellar";

interface StellarBalance {
  xlm: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStellarBalance(address: string | null): StellarBalance {
  const [xlm, setXlm] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setXlm(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${activeNetwork.horizonUrl}/accounts/${address}`);
      if (!res.ok) {
        if (res.status === 404) {
          setXlm(0);
          return;
        }
        throw new Error(`Failed to fetch account: ${res.status}`);
      }

      const data = await res.json();
      const nativeBalance = data.balances?.find(
        (b: { asset_type: string }) => b.asset_type === "native"
      );
      setXlm(nativeBalance ? parseFloat(nativeBalance.balance) : 0);
    } catch (err) {
      console.error("Failed to fetch Stellar balance:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setXlm(0);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchBalance();
    // Refetch every 30 seconds
    const interval = setInterval(fetchBalance, 30_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return { xlm, isLoading, error, refetch: fetchBalance };
}
