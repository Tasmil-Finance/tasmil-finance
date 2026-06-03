/**
 * Stellar RPC & Horizon client factories.
 * Config-driven — no env-var coupling.
 */

import { rpc, Horizon } from "@stellar/stellar-sdk";
import type { StellarNetwork, TasmilClientConfig } from "../types/common.js";
import { STELLAR_NETWORKS } from "./network.js";

// ─── Per-config client caches ─────────────────────────────────────

const sorobanClientCache = new Map<string, rpc.Server>();
const horizonClientCache = new Map<string, Horizon.Server>();

export function createSorobanClient(config: TasmilClientConfig): rpc.Server {
  const resolvedUrl =
    config.rpcUrl ?? STELLAR_NETWORKS[config.network].rpcUrl;
  const cacheKey = `${config.network}:${resolvedUrl}`;

  const cached = sorobanClientCache.get(cacheKey);
  if (cached) return cached;

  const client = new rpc.Server(resolvedUrl, {
    allowHttp: resolvedUrl.startsWith("http://"),
  });
  sorobanClientCache.set(cacheKey, client);
  return client;
}

export function createHorizonClient(config: TasmilClientConfig): Horizon.Server {
  const resolvedUrl =
    config.horizonUrl ?? STELLAR_NETWORKS[config.network].horizonUrl;
  const cacheKey = `${config.network}:${resolvedUrl}`;

  const cached = horizonClientCache.get(cacheKey);
  if (cached) return cached;

  const client = new Horizon.Server(resolvedUrl, {
    allowHttp: resolvedUrl.startsWith("http://"),
  });
  horizonClientCache.set(cacheKey, client);
  return client;
}

/** Legacy: env-var based singleton (for mcp-stellar backward compat) */
let _legacySorobanClient: rpc.Server | null = null;
let _legacyHorizonClient: Horizon.Server | null = null;

export function getSorobanClient(
  network?: StellarNetwork,
  rpcUrl?: string,
): rpc.Server {
  if (_legacySorobanClient) return _legacySorobanClient;
  const net = network ?? (process.env["STELLAR_NETWORK"] as StellarNetwork) ?? "mainnet";
  const url = rpcUrl ?? STELLAR_NETWORKS[net].rpcUrl;
  _legacySorobanClient = new rpc.Server(url, {
    allowHttp: url.startsWith("http://"),
  });
  return _legacySorobanClient;
}

export function getHorizonClient(
  network?: StellarNetwork,
  horizonUrl?: string,
): Horizon.Server {
  if (_legacyHorizonClient) return _legacyHorizonClient;
  const net = network ?? (process.env["STELLAR_NETWORK"] as StellarNetwork) ?? "mainnet";
  const url = horizonUrl ?? STELLAR_NETWORKS[net].horizonUrl;
  _legacyHorizonClient = new Horizon.Server(url, {
    allowHttp: url.startsWith("http://"),
  });
  return _legacyHorizonClient;
}

export function clearClientCache(): void {
  sorobanClientCache.clear();
  horizonClientCache.clear();
  _legacySorobanClient = null;
  _legacyHorizonClient = null;
}
