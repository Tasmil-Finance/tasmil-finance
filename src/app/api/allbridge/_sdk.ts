import { createTasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

export function getAllbridgeClient() {
  return createTasmilClient({ network: STELLAR_NETWORK });
}

export function getNetwork() { return STELLAR_NETWORK; }
