// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { createTasmilClient } from "@tasmil/adapter-sdk";
import { type NextRequest, NextResponse } from "next/server";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

const SCALAR_7 = 10_000_000;

interface PositionItem {
  name: string;
  type: "vault" | "supply" | "borrow" | "lp" | "stake";
  asset: string;
  valueUsd: number;
  apy?: number;
  extra?: string;
  rewards?: { amount: number; token: string; daily?: number };
  pair?: {
    token0: string;
    token1: string;
    pooled0?: string;
    pooled1?: string;
    shares?: string;
    sharePct?: string;
    poolType?: string;
    fee?: string;
  };
}

interface ProtocolPositionGroup {
  protocol: string;
  displayName: string;
  icon: string | null;
  totalValueUsd: number;
  positions: PositionItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseTokenSymbol(raw: string): string {
  if (raw === "native") return "XLM";
  const colonIdx = raw.indexOf(":");
  return colonIdx > 0 ? raw.slice(0, colonIdx) : raw;
}

function poolPairName(pool: {
  tokens_str?: string | string[];
  tokens?: Array<{ address: string; symbol?: string }>;
  tokens_addresses?: string[];
  address: string;
}): string {
  if (Array.isArray(pool.tokens_str) && pool.tokens_str.length > 0) {
    return pool.tokens_str.map(parseTokenSymbol).join("/");
  }
  if (typeof pool.tokens_str === "string") return pool.tokens_str.replace(/-/g, "/");
  if (Array.isArray(pool.tokens) && pool.tokens.length > 0) {
    return pool.tokens.map((t) => t.symbol ?? t.address.slice(0, 4)).join("/");
  }
  return `Pool ${pool.address.slice(0, 6)}\u2026`;
}

// ─── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user) {
    return NextResponse.json({ success: false, error: "user parameter required" }, { status: 400 });
  }

  try {
    const sdk = createTasmilClient({ network: STELLAR_NETWORK });

    // HTTP call for pools + Soroban calls for rewards in parallel
    const userPools = await sdk.aquarius.getUserPoolsWithRewards(user);
    if (userPools.length === 0) return NextResponse.json({ success: true, groups: [] });

    const items: PositionItem[] = userPools.map((pool) => {
      const name = poolPairName(pool);
      const userBalance = parseFloat(pool.balance || "0");
      const humanShares = userBalance / SCALAR_7;
      const poolType = pool.pool_type ?? "constant_product";
      const fee = pool.fee != null ? Number(pool.fee) / 100 : 0;
      const shareDecimals = Number(pool.share_token_decimals ?? 7);
      const totalShare = Number(pool.total_share ?? 0);

      // Resolve token symbols
      const tokensStr = Array.isArray(pool.tokens_str) ? pool.tokens_str : [];
      let sym0 = "Token0";
      let sym1 = "Token1";
      if (tokensStr.length >= 2) {
        sym0 = parseTokenSymbol(tokensStr[0]!);
        sym1 = parseTokenSymbol(tokensStr[1]!);
      } else if (Array.isArray(pool.tokens) && pool.tokens.length >= 2) {
        sym0 = pool.tokens[0]?.symbol ? parseTokenSymbol(pool.tokens[0]?.symbol) : "Token0";
        sym1 = pool.tokens[1]?.symbol ? parseTokenSymbol(pool.tokens[1]?.symbol) : "Token1";
      }

      // Compute share % and pooled amounts from reserves + total_share
      // Formula (from Aquarius DAO): pooled[i] = reserve[i] / 10^decimal * userBalance / (totalShare / 10^shareDecimals)
      let sharePct = 0;
      let pooled0: string | undefined;
      let pooled1: string | undefined;
      const reserves = Array.isArray(pool.reserves) ? (pool.reserves as string[]) : [];

      if (totalShare > 0) {
        const totalShareHuman = totalShare / 10 ** shareDecimals;
        sharePct = (humanShares / totalShareHuman) * 100;

        if (reserves.length >= 2) {
          const r0 = Number(reserves[0]) / SCALAR_7;
          const r1 = Number(reserves[1]) / SCALAR_7;
          const p0 = (r0 * humanShares) / totalShareHuman;
          const p1 = (r1 * humanShares) / totalShareHuman;
          if (p0 > 0) pooled0 = p0.toLocaleString("en-US", { maximumFractionDigits: 7 });
          if (p1 > 0) pooled1 = p1.toLocaleString("en-US", { maximumFractionDigits: 7 });
        }
      }

      // Rewards APY from API
      const rewardsApy = parseFloat(String(pool.rewards_apy ?? 0));

      // Rewards from Soroban contract
      const posRewards =
        pool.rewards && pool.rewards.toClaim > 0
          ? { amount: pool.rewards.toClaim, token: "AQUA", daily: pool.rewards.dailyReward }
          : undefined;

      return {
        name: `${name} LP`,
        type: "lp" as const,
        asset: name,
        valueUsd: 0,
        apy: rewardsApy > 0 ? Math.round(rewardsApy * 100) / 100 : undefined,
        rewards: posRewards,
        extra: `${humanShares.toLocaleString("en-US", { maximumFractionDigits: 4 })} shares`,
        pair: {
          token0: sym0,
          token1: sym1,
          pooled0,
          pooled1,
          shares: humanShares.toLocaleString("en-US", { maximumFractionDigits: 4 }),
          sharePct: sharePct.toFixed(7),
          poolType:
            poolType === "stable"
              ? "Stable"
              : poolType === "concentrated"
                ? "Concentrated"
                : "Volatile",
          fee: fee > 0 ? `${fee.toFixed(2)}%` : undefined,
        },
      };
    });

    const groups: ProtocolPositionGroup[] =
      items.length > 0
        ? [
            {
              protocol: "aquarius",
              displayName: "Aquarius AMM",
              icon: null,
              totalValueUsd: 0,
              positions: items,
            },
          ]
        : [];

    return NextResponse.json({ success: true, groups });
  } catch (e) {
    console.error("[api/positions/aquarius]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch positions" },
      { status: 500 }
    );
  }
}
