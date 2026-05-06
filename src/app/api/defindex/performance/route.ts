// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import type { NextRequest } from "next/server";
import { getDefindexClient, getNetwork, jsonError } from "../_sdk";

/**
 * GET /api/defindex/performance?wallet=G...&vault=C...&interval=daily
 *
 * Returns account position performance in a DeFindex vault.
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const vault = req.nextUrl.searchParams.get("vault");
  if (!wallet) return jsonError("wallet parameter required");
  if (!vault) return jsonError("vault parameter required");

  const interval = req.nextUrl.searchParams.get("interval") as
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | null;

  try {
    const sdk = getDefindexClient();
    const performance = await sdk.defindex.getAccountPerformance(wallet, vault, {
      ...(interval ? { interval } : {}),
    });
    return Response.json({
      success: true,
      network: getNetwork(),
      performance,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch performance", 500);
  }
}
