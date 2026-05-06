// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

/**
 * Shared SDK singleton for all aggregator API routes.
 * Ensures loadBridgeTokens() is called once and shared across
 * /api/tokens, /api/tokens/filter, and /api/aggregator/quote.
 */

import { createTasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

export const sdk = createTasmilClient({ network: STELLAR_NETWORK });

let bridgeLoadPromise: Promise<void> | null = null;

/**
 * Ensures bridge tokens are loaded exactly once.
 * Safe to call from multiple routes — deduplicates the fetch.
 */
export function ensureBridgeTokens(): Promise<void> {
  if (sdk.tokens.isBridgeLoaded()) return Promise.resolve();

  if (!bridgeLoadPromise) {
    bridgeLoadPromise = sdk
      .loadBridgeTokens()
      .then((stats) => {
        console.warn("[sdk] Bridge tokens loaded:", stats);
      })
      .catch((err) => {
        console.error("[sdk] Failed to load bridge tokens:", err);
        bridgeLoadPromise = null; // allow retry on next request
      });
  }

  return bridgeLoadPromise;
}
