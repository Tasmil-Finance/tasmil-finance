import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

/**
 * Aquarius pools API base URLs.
 * Uses the /pools/ endpoint (NOT /api/external/v1/pools/) which includes
 * TVL, volume, APY, rewards, and pool type data.
 */
const AQUARIUS_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

/**
 * GET /api/aquarius/pools?type=all|stable|volatile|concentrated&page=1&limit=20&search=
 *
 * Proxies to Aquarius /pools/ API with full TVL, volume, APY, rewards data.
 * Response shape: { total, items[], pagination }
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const base = AQUARIUS_BASE[network] ?? AQUARIUS_BASE.testnet;

  const poolType = req.nextUrl.searchParams.get("type") ?? "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "10")));
  const search = req.nextUrl.searchParams.get("search") ?? "";

  // Map frontend filter values to Aquarius API pool_type param
  const aquaPoolType =
    poolType === "volatile"
      ? "constant_product"
      : poolType === "all"
        ? ""
        : poolType; // "stable" and "concentrated" pass through directly

  const params = new URLSearchParams({
    pool_type: aquaPoolType,
    sort: "-liquidity",
    page: String(page),
    size: String(limit),
    search,
  });

  try {
    const res = await fetch(`${base}/pools/?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Tasmil/1.0",
      },
      next: { revalidate: 60 }, // cache 60s
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Aquarius API error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as {
      total: number;
      items: Record<string, unknown>[];
      next: string | null;
      previous: string | null;
    };

    const totalCount = data.total;
    const totalPages = Math.ceil(totalCount / limit);

    // Normalize pools to a consistent shape for the frontend adapter
    const pools = data.items.map((p) => ({
      address: p.address,
      pool_type: p.pool_type,
      tokens_str: p.tokens_str,
      tokens_addresses: p.tokens_addresses,
      fee: p.fee,
      // Rich data from /pools/ API
      liquidity_usd: p.liquidity_usd,
      volume_usd: p.volume_usd,
      apy: p.apy,
      rewards_apy: p.rewards_apy,
      incentive_apy: p.incentive_apy,
      total_apy: p.total_apy,
      // Extra
      reserves: p.reserves,
      total_share: p.total_share,
      gauge_enabled: p.gauge_enabled,
      tx_count: p.tx_count,
    }));

    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      filter: poolType || "all",
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      pools,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Aquarius API unavailable" },
      { status: 500 },
    );
  }
}
