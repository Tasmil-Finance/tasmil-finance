import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

const AQUARIUS_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

/**
 * GET /api/aquarius/pool-history?pool=C...&size=30
 *
 * Historical daily volume & liquidity for a specific pool.
 * Uses /statistics/totals/?pool_address=ADDR endpoint.
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const base = AQUARIUS_BASE[network] ?? AQUARIUS_BASE.testnet;
  const pool = req.nextUrl.searchParams.get("pool");
  const size = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("size") ?? "30")));

  if (!pool) {
    return NextResponse.json(
      { success: false, error: "Missing 'pool' query parameter" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `${base}/statistics/totals/?pool_address=${pool}&size=${size}`,
      {
        headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" },
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Aquarius API error: ${res.status}` },
        { status: res.status },
      );
    }

    const raw = await res.json();
    const items = ((raw.items ?? []) as Record<string, unknown>[]).map((d) => ({
      date: d.date_str,
      volume: Number(d.volume_usd ?? 0) / 1e7,
      liquidity: Number(d.liquidity_usd ?? 0) / 1e7,
    }));

    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      pool,
      total: raw.total,
      items,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Pool history unavailable" },
      { status: 500 },
    );
  }
}
