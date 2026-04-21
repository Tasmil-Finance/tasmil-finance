import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

const AQUARIUS_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

/**
 * GET /api/aquarius/statistics?period=24h
 * GET /api/aquarius/statistics?period=totals&size=30
 *
 * Proxies Aquarius statistics APIs:
 * - period=24h  → /statistics/24h/  (protocol-level 24h volume)
 * - period=totals → /statistics/totals/?size=N (daily historical TVL/volume)
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const base = AQUARIUS_BASE[network] ?? AQUARIUS_BASE.testnet;
  const period = req.nextUrl.searchParams.get("period") ?? "24h";
  const size = Math.min(365, Math.max(1, Number(req.nextUrl.searchParams.get("size") ?? "30")));

  try {
    const url =
      period === "totals"
        ? `${base}/statistics/totals/?size=${size}`
        : `${base}/statistics/24h/`;

    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" },
      next: { revalidate: 300 }, // cache 5min
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Aquarius statistics API error: ${res.status}` },
        { status: res.status },
      );
    }

    const raw = await res.json();

    if (period === "totals") {
      // Historical daily data — normalize liquidity_usd/volume_usd (stroops → USD)
      const items = ((raw.items ?? []) as Record<string, unknown>[]).map((d) => ({
        date: d.date_str,
        volume: Number(d.volume_usd ?? 0) / 1e7,
        liquidity: Number(d.liquidity_usd ?? 0) / 1e7,
      }));

      return NextResponse.json({
        success: true,
        network,
        protocol: "aquarius",
        period: "totals",
        total: raw.total,
        items,
      });
    }

    // 24h summary
    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      period: "24h",
      volume24h: Number(raw.volume_usd ?? 0) / 1e7,
      volumeRaw: Number(raw.volume ?? 0) / 1e7,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Statistics API unavailable" },
      { status: 500 },
    );
  }
}
