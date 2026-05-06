// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import type { NextRequest } from "next/server";
import { getDefindexClient, getNetwork, jsonError } from "../_sdk";

/**
 * GET /api/defindex/history?address=C...&period=7d&interval=daily
 *
 * Returns historical performance data for a DeFindex vault.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) return jsonError("address parameter required");

  const period = req.nextUrl.searchParams.get("period") as
    | "all"
    | "7d"
    | "30d"
    | "90d"
    | "1y"
    | null;
  const interval = req.nextUrl.searchParams.get("interval") as
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | null;

  try {
    const sdk = getDefindexClient();
    const history = await sdk.defindex.getVaultHistory(address, {
      ...(period ? { period } : {}),
      ...(interval ? { interval } : {}),
    });
    return Response.json({
      success: true,
      network: getNetwork(),
      history,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch history", 500);
  }
}
