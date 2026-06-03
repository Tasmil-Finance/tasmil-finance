/**
 * Stellar network configuration constants.
 * Moved from apps/mcp-stellar/src/config/constants.ts
 *
 * The SDK does NOT read from process.env directly — callers pass config via createTasmilClient().
 * This module exports constants and helpers that are config-agnostic.
 */

import type { StellarNetwork, StellarNetworkConfig } from "../types/common.js";

export const STELLAR_NETWORKS: Record<StellarNetwork, StellarNetworkConfig> = {
  mainnet: {
    networkPassphrase: "Public Global Stellar Network ; September 2015",
    rpcUrl: "https://mainnet.sorobanrpc.com",
    horizonUrl: "https://horizon.stellar.org",
    friendbotUrl: null,
  },
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
    friendbotUrl: "https://friendbot.stellar.org",
  },
} as const;

// ─── API URLs ────────────────────────────────────────────────────

export const AQUARIUS_API_URLS: Record<StellarNetwork, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

export const SOROSWAP_API_BASE = "https://api.soroswap.finance";

// ─── Env-based helpers (for mcp-stellar backward compat) ─────────
// These read process.env and should only be called from app entry points.

export function getStellarNetworkFromEnv(): StellarNetwork {
  const env = process.env["STELLAR_NETWORK"] ?? "mainnet";
  if (env !== "mainnet" && env !== "testnet") {
    throw new Error(
      `Invalid STELLAR_NETWORK: ${env}. Must be "mainnet" or "testnet".`,
    );
  }
  return env;
}

export function getStellarRpcUrlFromEnv(network: StellarNetwork): string {
  return process.env["STELLAR_RPC_URL"] ?? STELLAR_NETWORKS[network].rpcUrl;
}

export function getStellarHorizonUrlFromEnv(network: StellarNetwork): string {
  return (
    process.env["STELLAR_HORIZON_URL"] ?? STELLAR_NETWORKS[network].horizonUrl
  );
}

export function getNetworkPassphrase(network: StellarNetwork): string {
  return STELLAR_NETWORKS[network].networkPassphrase;
}

/** Round-robin Soroswap API key rotation */
let _soroswapKeys: string[] | null = null;
let _soroswapIdx = 0;

export function getSoroswapApiKey(keysEnvValue?: string): string | undefined {
  if (_soroswapKeys === null) {
    const envVal =
      keysEnvValue ??
      (process.env["SOROSWAP_API_KEYS"] || process.env["SOROSWAP_API_KEY"] || "");
    _soroswapKeys = envVal
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }
  if (_soroswapKeys.length === 0) return undefined;
  const key = _soroswapKeys[_soroswapIdx % _soroswapKeys.length];
  _soroswapIdx++;
  return key;
}
