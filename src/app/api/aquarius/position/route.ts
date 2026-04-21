import { type NextRequest, NextResponse } from "next/server";
import { createTasmilClient } from "@tasmil/adapter-sdk";

function getNetwork(): "mainnet" | "testnet" {
  const raw = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] ?? process.env["STELLAR_NETWORK"] ?? "mainnet";
  return raw.toLowerCase().includes("test") ? "testnet" : "mainnet";
}

/**
 * GET /api/aquarius/position?pool=C...&user=G...&tickLower=-887200&tickUpper=887200
 *
 * Query user's concentrated pool position at given tick range.
 */
export async function GET(req: NextRequest) {
  const pool = req.nextUrl.searchParams.get("pool");
  const user = req.nextUrl.searchParams.get("user");
  const tickLower = req.nextUrl.searchParams.get("tickLower") ?? "-887200";
  const tickUpper = req.nextUrl.searchParams.get("tickUpper") ?? "887200";

  if (!pool || !user) {
    return NextResponse.json({ success: false, error: "Missing pool, user" }, { status: 400 });
  }

  try {
    const sdk = createTasmilClient({
      network: getNetwork(),
      rpcUrl: process.env["STELLAR_RPC_URL"],
      horizonUrl: process.env["STELLAR_HORIZON_URL"],
    });

    const position = await sdk.aquarius.getPosition({
      poolAddress: pool,
      user,
      tickLower: Number(tickLower),
      tickUpper: Number(tickUpper),
    });

    return NextResponse.json({
      success: true,
      position,
      hasPosition: position != null && BigInt(position.liquidity) > 0n,
    });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
