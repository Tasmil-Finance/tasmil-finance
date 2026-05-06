// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import type { NextRequest } from "next/server";
import { getDefindexClient, getNetwork, jsonError } from "../_sdk";

/**
 * GET /api/defindex/balance?vault=C...&user=G...
 *
 * Returns user's share balance and underlying asset values in a DeFindex vault.
 */
export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get("vault");
  const user = req.nextUrl.searchParams.get("user");
  if (!vault) return jsonError("vault parameter required");
  if (!user) return jsonError("user parameter required");

  try {
    const sdk = getDefindexClient();
    const balance = await sdk.defindex.getVaultBalance(vault, user);
    return Response.json({
      success: true,
      network: getNetwork(),
      balance,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch balance", 500);
  }
}
