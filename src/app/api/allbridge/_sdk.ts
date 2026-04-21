import { createTasmilClient } from "@tasmil/adapter-sdk";

function getNetwork(): "mainnet" | "testnet" {
  const raw =
    process.env["NEXT_PUBLIC_STELLAR_NETWORK"] ??
    process.env["STELLAR_NETWORK"] ??
    "mainnet";
  return raw.toLowerCase().includes("test") ? "testnet" : "mainnet";
}

export function getAllbridgeClient() {
  return createTasmilClient({
    network: getNetwork(),
    rpcUrl: process.env["STELLAR_RPC_URL"],
    horizonUrl: process.env["STELLAR_HORIZON_URL"],
  });
}

export { getNetwork };
