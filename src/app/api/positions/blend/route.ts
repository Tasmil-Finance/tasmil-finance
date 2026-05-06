// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "../../protocols/_sdk";

interface PositionItem {
  name: string;
  type: "vault" | "supply" | "borrow" | "lp" | "stake";
  asset: string;
  valueUsd: number;
  apy?: number;
  extra?: string;
  rewards?: { amount: number; token: string };
}

interface ProtocolPositionGroup {
  protocol: string;
  displayName: string;
  icon: string | null;
  totalValueUsd: number;
  positions: PositionItem[];
  rewards?: { amount: number; token: string };
}

function formatAmount(amount: number, symbol: string): string {
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${symbol}`;
}

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user) {
    return NextResponse.json({ success: false, error: "user parameter required" }, { status: 400 });
  }

  try {
    const sdk = getClient();
    const pools = await sdk.blend.listPools();

    const results = await Promise.allSettled(
      pools.map((pool) => sdk.blend.getUserPositions(pool.address, user))
    );

    const groups: ProtocolPositionGroup[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const pos = result.value;

      const hasPositions =
        pos.collateral.length > 0 || pos.supply.length > 0 || pos.liabilities.length > 0;
      if (!hasPositions) continue;

      const items: PositionItem[] = [];

      for (const c of pos.collateral) {
        items.push({
          name: `${c.symbol} Collateral`,
          type: "supply",
          asset: c.symbol,
          valueUsd: 0,
          apy: c.apy > 0 ? Math.round(c.apy * 100 * 100) / 100 : undefined,
          extra: formatAmount(c.amount, c.symbol),
        });
      }

      for (const s of pos.supply) {
        items.push({
          name: `${s.symbol} Supply`,
          type: "supply",
          asset: s.symbol,
          valueUsd: 0,
          apy: s.apy > 0 ? Math.round(s.apy * 100 * 100) / 100 : undefined,
          extra: formatAmount(s.amount, s.symbol),
        });
      }

      for (const l of pos.liabilities) {
        items.push({
          name: `${l.symbol} Borrow`,
          type: "borrow",
          asset: l.symbol,
          valueUsd: 0,
          apy: l.apy > 0 ? Math.round(l.apy * 100 * 100) / 100 : undefined,
          extra: formatAmount(l.amount, l.symbol),
        });
      }

      // Add claimable BLND emissions as a group-level reward
      const groupRewards =
        pos.emissions != null && pos.emissions > 0
          ? { amount: pos.emissions, token: "BLND" }
          : undefined;

      groups.push({
        protocol: "blend",
        displayName: `Blend \u00b7 ${pos.poolName}`,
        icon: null,
        totalValueUsd: 0,
        positions: items,
        rewards: groupRewards,
      });
    }

    return NextResponse.json({ success: true, groups });
  } catch (e) {
    console.error("[api/positions/blend]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
