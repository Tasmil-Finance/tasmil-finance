import { type NextRequest, NextResponse } from "next/server";

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet";
const AQUA_BASE = `https://amm-api${isTestnet ? "-testnet" : ""}.aqua.network/api/external/v1`;

/**
 * Server-side proxy for Aquarius AMM API.
 * Handles redirects server-side to avoid CORS / trailing-slash issues.
 *
 * Usage: GET /api/aquarius-proxy?path=pools/&page=1&page_size=50
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = searchParams.get("path") ?? "pools/";

  // Build upstream URL: forward all query params except "path"
  const upstream = new URL(`${AQUA_BASE}/${path}`);
  for (const [key, value] of searchParams.entries()) {
    if (key !== "path") upstream.searchParams.set(key, value);
  }

  const res = await fetch(upstream.toString(), { redirect: "follow" });
  const data = await res.json();
  return NextResponse.json(data);
}
