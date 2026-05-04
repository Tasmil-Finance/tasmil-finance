import type { ActivityItem, PositionData } from "@/features/account/types";
import { computeCashflowSummary } from "./cashflow";

const basePosition = (over: Partial<PositionData> = {}): PositionData =>
  ({
    totalValueUsd: 0,
    totalDepositedUsd: 0,
    totalWithdrawnUsd: 0,
    netDepositsUsd: 0,
    profitUsd: 0,
    profitPercent: 0,
    positions: [],
    activeAssets: [],
    status: "ACTIVE",
    preset: "BALANCED",
    baseAsset: "USDC",
    sessionKeyStale: false,
    balanceStale: false,
    currentApy: 0,
    gasReserveUsd: 0,
    ...over,
  }) as PositionData;

describe("computeCashflowSummary", () => {
  it("returns zeros for empty input", () => {
    const out = computeCashflowSummary(basePosition(), []);
    expect(out).toEqual({
      totalFundedUsd: 0,
      totalWithdrawnUsd: 0,
      netDepositsUsd: 0,
      allTimePnlUsd: 0,
      allTimePnlPercent: 0,
    });
  });

  it("uses api-provided fields when totalDepositedUsd > 0", () => {
    const position = basePosition({
      totalDepositedUsd: 1000,
      totalWithdrawnUsd: 200,
      netDepositsUsd: 800,
      profitUsd: 50,
      profitPercent: 5,
    });
    expect(computeCashflowSummary(position, [])).toEqual({
      totalFundedUsd: 1000,
      totalWithdrawnUsd: 200,
      netDepositsUsd: 800,
      allTimePnlUsd: 50,
      allTimePnlPercent: 5,
    });
  });

  it("falls back to activity scan when api fields are zero", () => {
    const position = basePosition({ totalValueUsd: 1100 });
    const activities: ActivityItem[] = [
      { id: "1", type: "FUND", amountUsd: 1000, txHash: "tx1", createdAt: "2026-05-01" },
      { id: "2", type: "WITHDRAW", amountUsd: 100, txHash: "tx2", createdAt: "2026-05-02" },
    ] as ActivityItem[];
    const out = computeCashflowSummary(position, activities);
    expect(out.totalFundedUsd).toBe(1000);
    expect(out.totalWithdrawnUsd).toBe(100);
    expect(out.netDepositsUsd).toBe(900);
    expect(out.allTimePnlUsd).toBe(200); // 1100 + 100 - 1000
    expect(out.allTimePnlPercent).toBe(20);
  });

  it("treats legacy DEPOSIT activity as funding when no FUND seen", () => {
    const activities: ActivityItem[] = [
      { id: "1", type: "DEPOSIT", amountUsd: 500, txHash: "tx1", createdAt: "2026-05-01" },
    ] as ActivityItem[];
    const out = computeCashflowSummary(basePosition({ totalValueUsd: 500 }), activities);
    expect(out.totalFundedUsd).toBe(500);
  });

  it("dedupes by txHash within same type", () => {
    const activities: ActivityItem[] = [
      { id: "1", type: "FUND", amountUsd: 100, txHash: "dup", createdAt: "2026-05-01" },
      { id: "2", type: "FUND", amountUsd: 999, txHash: "dup", createdAt: "2026-05-02" },
    ] as ActivityItem[];
    const out = computeCashflowSummary(basePosition({ totalValueUsd: 100 }), activities);
    expect(out.totalFundedUsd).toBe(100);
  });
});
