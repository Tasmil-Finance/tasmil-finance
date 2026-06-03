/**
 * TasmilClient — main entry point for the Tasmil Adapter SDK.
 *
 * Usage:
 *   import { createTasmilClient } from '@tasmil/adapter-sdk';
 *   const sdk = createTasmilClient({ network: 'mainnet' });
 *   await sdk.blend.listPools();
 *   await sdk.yield.getAll({ minApy: 5 });
 *   await sdk.swap.getBestQuote({ tokenIn: 'XLM', tokenOut: 'USDC', amount: '100' });
 */

import type { TasmilClientConfig } from "./types/common.js";
import { BlendAdapter } from "./protocols/blend/index.js";
import { AquariusAdapter } from "./protocols/aquarius/index.js";
import { SoroswapAdapter } from "./protocols/soroswap/index.js";
import { PhoenixAdapter } from "./protocols/phoenix/index.js";
import { SdexAdapter } from "./protocols/sdex/index.js";
import { AllbridgeAdapter } from "./protocols/allbridge/index.js";
import { DefindexAdapter } from "./protocols/defindex/index.js";
import { TemplarAdapter } from "./protocols/templar/index.js";
import { TasmilAdapter } from "./protocols/tasmil/index.js";
import { YieldAggregator } from "./aggregators/yield/index.js";
import { SwapAggregator } from "./aggregators/swap/index.js";
import { BridgeAggregator } from "./aggregators/bridge/index.js";
import { CrossChainTokenRegistry } from "./registry/index.js";
import { StellarOperations } from "./stellar/operations.js";
import { getStellarNetworkFromEnv, STELLAR_NETWORKS } from "./utils/network.js";

// ─── TasmilClient ─────────────────────────────────────────────────

export class TasmilClient {
  readonly config: TasmilClientConfig;

  // ── Protocol namespaces ──────────────────────────────────────
  readonly blend: BlendAdapter;
  readonly aquarius: AquariusAdapter;
  readonly soroswap: SoroswapAdapter;
  readonly phoenix: PhoenixAdapter;
  readonly sdex: SdexAdapter;
  readonly allbridge: AllbridgeAdapter;
  readonly defindex: DefindexAdapter;
  readonly templar: TemplarAdapter;
  readonly tasmil: TasmilAdapter;

  // ── Aggregators ──────────────────────────────────────────────
  readonly yield: YieldAggregator;
  readonly swap: SwapAggregator;
  readonly bridge: BridgeAggregator;

  // ── Registry ────────────────────────────────────────────────
  readonly tokens: CrossChainTokenRegistry;

  // ── Stellar operations (submit, verify, trustlines) ────────
  readonly stellar: StellarOperations;

  constructor(config: TasmilClientConfig) {
    this.config = config;

    // Protocols
    this.blend = new BlendAdapter(config);
    this.aquarius = new AquariusAdapter(config);
    this.soroswap = new SoroswapAdapter(config);
    this.phoenix = new PhoenixAdapter(config);
    this.sdex = new SdexAdapter(config);
    this.allbridge = new AllbridgeAdapter(config);
    this.defindex = new DefindexAdapter(config);
    this.templar = new TemplarAdapter(config);
    this.tasmil = new TasmilAdapter(config);

    // Aggregators
    this.yield = new YieldAggregator(config);
    this.swap = new SwapAggregator(config);
    this.bridge = new BridgeAggregator(config);

    // Registry
    this.tokens = new CrossChainTokenRegistry(config.network);

    // Stellar operations
    this.stellar = new StellarOperations(config);
  }

  /**
   * Load bridgeable tokens and chains from Allbridge SDK.
   * Enriches sdk.tokens with dynamically discovered cross-chain data.
   *
   * @example
   * const sdk = createTasmilClient({ network: 'mainnet' });
   * await sdk.loadBridgeTokens();
   * // Now sdk.tokens.chains() includes Sui, Algorand, etc.
   * // And sdk.tokens.getBridgeableTokens() includes USDe, etc.
   */
  async loadBridgeTokens(): Promise<{ chainsAdded: number; tokensUpdated: number; tokensAdded: number }> {
    return this.tokens.loadBridgeTokens(this.allbridge);
  }
}

// ─── Factory functions ────────────────────────────────────────────

/**
 * Create a Tasmil SDK client with explicit config.
 *
 * @example
 * const sdk = createTasmilClient({ network: 'mainnet' });
 */
export function createTasmilClient(config: TasmilClientConfig): TasmilClient {
  const defaults = STELLAR_NETWORKS[config.network];
  return new TasmilClient({
    rpcUrl: defaults.rpcUrl,
    horizonUrl: defaults.horizonUrl,
    ...config,
  });
}

/**
 * Create a Tasmil SDK client from environment variables.
 * Reads: STELLAR_NETWORK, STELLAR_RPC_URL, STELLAR_HORIZON_URL, SOROSWAP_API_KEYS
 *
 * Useful for mcp-stellar and backend which already configure via env.
 *
 * @example
 * const sdk = createTasmilClientFromEnv();
 */
export function createTasmilClientFromEnv(): TasmilClient {
  const network = getStellarNetworkFromEnv();
  return createTasmilClient({
    network,
    soroswapApiKeys: process.env["SOROSWAP_API_KEYS"] ?? process.env["SOROSWAP_API_KEY"],
    defindexApiUrl: process.env["DEFINDEX_API_URL"],
    defindexApiKey: process.env["DEFINDEX_API_KEY"],
  });
}
