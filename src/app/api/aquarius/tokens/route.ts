import { type NextRequest, NextResponse } from "next/server";
import { getNetwork } from "../_sdk";

const AQUARIUS_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

/**
 * GET /api/aquarius/tokens?size=200
 *
 * Lists all tokens that have been pooled in Aquarius AMM.
 * Includes: name, code, decimals, address, price_xlm, logo.
 */
export async function GET(req: NextRequest) {
  const network = getNetwork();
  const base = AQUARIUS_BASE[network] ?? AQUARIUS_BASE.testnet;
  const size = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get("size") ?? "200")));

  try {
    const res = await fetch(`${base}/tokens/?pooled=true&size=${size}`, {
      headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Aquarius tokens API error: ${res.status}` },
        { status: res.status },
      );
    }

    const raw = await res.json();
    const tokens = ((raw.items ?? []) as Record<string, unknown>[]).map((t) => ({
      code: t.code,
      name: t.name,
      address: t.address,
      decimals: t.decimals,
      issuer: t.issuer,
      logo: t.logo,
      priceXlm: t.price_xlm,
      homeDomain: t.home_domain,
    }));

    return NextResponse.json({
      success: true,
      network,
      protocol: "aquarius",
      total: raw.total,
      tokens,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Tokens API unavailable" },
      { status: 500 },
    );
  }
}
