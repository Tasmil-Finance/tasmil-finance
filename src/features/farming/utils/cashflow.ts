import type { ActivityItem, PositionData } from "@/features/account/types";

export interface CashflowSummary {
  totalFundedUsd: number;
  totalWithdrawnUsd: number;
  netDepositsUsd: number;
  allTimePnlUsd: number;
  allTimePnlPercent: number;
}

export function computeCashflowSummary(
  position: PositionData | undefined,
  activities: ActivityItem[] | undefined
): CashflowSummary {
  const totalValueUsd = position?.totalValueUsd ?? 0;
  const totalDepositedUsd = position?.totalDepositedUsd ?? 0;
  const totalWithdrawnFromApi = position?.totalWithdrawnUsd ?? 0;
  const netDepositsFromApi = position?.netDepositsUsd ?? totalDepositedUsd - totalWithdrawnFromApi;
  const profitUsd = position?.profitUsd ?? 0;
  const profitPercent = position?.profitPercent ?? 0;

  if (totalDepositedUsd > 0 || totalWithdrawnFromApi > 0) {
    return {
      totalFundedUsd: totalDepositedUsd,
      totalWithdrawnUsd: totalWithdrawnFromApi,
      netDepositsUsd: netDepositsFromApi,
      allTimePnlUsd: profitUsd,
      allTimePnlPercent: profitPercent,
    };
  }

  let totalFundedUsd = 0;
  let legacyStrategyDepositsUsd = 0;
  let totalWithdrawnUsd = 0;
  const seen = new Set<string>();

  for (const item of activities ?? []) {
    const dedupeKey = item.txHash ? `${item.type}:${item.txHash}` : `${item.type}:${item.id}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const amountUsd = typeof item.amountUsd === "number" ? item.amountUsd : 0;
    if (amountUsd <= 0) continue;
    if (item.type === "FUND") totalFundedUsd += amountUsd;
    else if (item.type === "DEPOSIT") legacyStrategyDepositsUsd += amountUsd;
    else if (item.type === "WITHDRAW") totalWithdrawnUsd += amountUsd;
  }

  if (totalFundedUsd <= 0 && legacyStrategyDepositsUsd > 0) {
    totalFundedUsd = legacyStrategyDepositsUsd;
  }

  const hasCashflowData = totalFundedUsd > 0 || totalWithdrawnUsd > 0;
  if (!hasCashflowData) {
    return {
      totalFundedUsd: totalDepositedUsd,
      totalWithdrawnUsd: 0,
      netDepositsUsd: totalDepositedUsd,
      allTimePnlUsd: profitUsd,
      allTimePnlPercent: profitPercent,
    };
  }

  const netDepositsUsd = totalFundedUsd - totalWithdrawnUsd;
  const allTimePnlUsd = totalValueUsd + totalWithdrawnUsd - totalFundedUsd;
  const allTimePnlPercent =
    totalFundedUsd > 0 ? Math.round((allTimePnlUsd / totalFundedUsd) * 10000) / 100 : 0;

  return {
    totalFundedUsd,
    totalWithdrawnUsd,
    netDepositsUsd,
    allTimePnlUsd,
    allTimePnlPercent,
  };
}
