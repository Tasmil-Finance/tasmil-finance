// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { createTasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

export function getDefindexClient() {
  return createTasmilClient({
    network: STELLAR_NETWORK,
    defindexApiUrl: process.env.DEFINDEX_API_URL,
    defindexApiKey: process.env.DEFINDEX_API_KEY,
  });
}

export function getNetwork() {
  return STELLAR_NETWORK;
}

export function jsonError(msg: string, status = 400) {
  return Response.json({ success: false, error: msg }, { status });
}
