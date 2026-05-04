"use client";

import { StatCard } from "./stat-card";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatApy(decimal: number): string {
  return `${(decimal * 100).toFixed(2)}%`;
}

interface StatRowProps {
  totalValueUsd: number;
  allTimePnlUsd: number;
  allTimePnlPercent: number;
  currentApy: number;
}

export function StatRow({
  totalValueUsd,
  allTimePnlUsd,
  allTimePnlPercent,
  currentApy,
}: StatRowProps) {
  const positive = allTimePnlUsd >= 0;
  const tone = allTimePnlUsd === 0 ? "neutral" : positive ? "positive" : "negative";
  const sign = positive && allTimePnlUsd > 0 ? "+" : "";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total Value"
        value={formatUsd(totalValueUsd)}
        sparklineState="placeholder"
      />
      <StatCard
        label="All-Time P&L"
        value={`${sign}${formatUsd(allTimePnlUsd)}`}
        delta={{ text: `${sign}${allTimePnlPercent.toFixed(2)}%`, tone }}
        sparklineState="placeholder"
      />
      <StatCard
        label="Current APY"
        value={formatApy(currentApy)}
        sparklineState="placeholder"
      />
    </div>
  );
}
