import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

const AQUARIUS_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

/**
 * GET /api/aquarius/pool-info?pool=C...
 *
 * Fetches single pool detail from Aquarius /pools/ API (with TVL, APY, rewards).
 */
export async function GET(req: NextRequest) {
  const poolAddress = req.nextUrl.searchParams.get("pool");
  if (!poolAddress) {
    return NextResponse.json(
      { success: false, error: "Missing 'pool' query parameter" },
      { status: 400 },
    );
  }

  const network = getNetwork();
  const base = AQUARIUS_BASE[network] ?? AQUARIUS_BASE.testnet;

  try {
    // Search by pool address
    const res = await fetch(`${base}/pools/?search=${poolAddress}&size=5`, {
      headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Aquarius API error: ${res.status}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as { total: number; items: Record<string, unknown>[] };
    const pool = data.items.find((p) => p.address === poolAddress) ?? data.items[0];

    if (!pool) {
      return NextResponse.json(
        { success: false, error: `Pool not found: ${poolAddress}` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      pool,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed to fetch pool" },
      { status: 400 },
    );
  }
}
