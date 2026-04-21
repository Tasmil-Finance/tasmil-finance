import { createTasmilClient } from "@tasmil/adapter-sdk";
import { STELLAR_NETWORK } from "@/shared/config/stellar-server";

export function getBlendClient() {
  return createTasmilClient({ network: STELLAR_NETWORK });
}

export function getExplorerUrl(network: string, contract: string): string {
  const base =
    network === "testnet"
      ? "https://stellar.expert/explorer/testnet/contract"
      : "https://stellar.expert/explorer/public/contract";
  return `${base}/${contract}`;
}

export function getNetwork() { return STELLAR_NETWORK; }
