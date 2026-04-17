"use client";

import { useMemo } from "react";
import type { WalletToken } from "./use-wallet-tokens";

export interface HistoryPoint {
  timestamp: number;
  value: number;
}

const POINTS: Record<number, number> = { 1: 48, 7: 56, 30: 60, 90: 90 };

/** Seeded pseudo-random so chart shape is stable across renders for the same wallet. */
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateMockHistory(totalUsd: number, days: number, seed: number): HistoryPoint[] {
  const count = POINTS[days] ?? 60;
  const now = Date.now();
  const stepMs = (days * 86400_000) / count;
  const rng = seededRng(seed);

  // Walk backwards: start from a value ±5% lower, drift up/down with slight upward bias
  const startOffset = totalUsd * (0.03 + rng() * 0.05) * (rng() > 0.4 ? -1 : 1);
  let v = totalUsd - startOffset;

  const points: HistoryPoint[] = [];
  for (let i = 0; i < count; i++) {
    const ts = now - (count - i) * stepMs;
    // Small random walk, ±1% per step, slight upward drift
    const delta = v * (rng() * 0.018 - 0.007);
    v = Math.max(v + delta, totalUsd * 0.6);
    points.push({ timestamp: ts, value: v });
  }
  // Pin last point to actual current value
  points.push({ timestamp: now, value: totalUsd });
  return points;
}

export function usePortfolioHistory(tokens: WalletToken[], totalUsd: number, days: number) {
  // Derive a stable seed from the wallet's token balances
  const seed = useMemo(
    () =>
      tokens.reduce((acc, t) => {
        const s = `${t.assetCode}${t.balance.toFixed(4)}`;
        return s.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, acc);
      }, days * 17),
    [tokens, days]
  );

  const data = useMemo(
    () => (totalUsd > 0 ? generateMockHistory(totalUsd, days, Math.abs(seed)) : []),
    [totalUsd, days, seed]
  );

  return { data, isLoading: false };
}
