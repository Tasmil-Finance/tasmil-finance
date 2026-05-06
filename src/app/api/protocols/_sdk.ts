import { createTasmilClient, type TasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

let _cached: TasmilClient | null = null;

export function getClient(): TasmilClient {
  if (_cached) return _cached;
  _cached = createTasmilClient({
    network: STELLAR_NETWORK,
    soroswapApiKeys: process.env.SOROSWAP_API_KEYS ?? process.env.SOROSWAP_API_KEY,
  });
  return _cached;
}

export const VALID_PROTOCOLS = [
  "blend",
  "aquarius",
  "soroswap",
  "phoenix",
  "sdex",
  "allbridge",
  "defindex",
  "templar",
] as const;
export type ProtocolId = (typeof VALID_PROTOCOLS)[number];

export function isValidProtocol(p: string): p is ProtocolId {
  return (VALID_PROTOCOLS as readonly string[]).includes(p);
}

export function getExplorerUrl(contract: string): string {
  const base =
    STELLAR_NETWORK === "testnet"
      ? "https://stellar.expert/explorer/testnet/contract"
      : "https://stellar.expert/explorer/public/contract";
  return `${base}/${contract}`;
}

export function jsonError(msg: string, status = 400) {
  return Response.json({ success: false, error: msg }, { status });
}

export function getNetwork() {
  return STELLAR_NETWORK;
}
