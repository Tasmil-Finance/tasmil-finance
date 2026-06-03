/**
 * @tasmil/adapter-sdk
 *
 * Unified protocol adapter SDK for Tasmil Finance.
 * Aggregates Blend, Soroswap, Aquarius, Phoenix, SDEX, Allbridge, DeFindex.
 *
 * Usage:
 *   import { createTasmilClient } from '@tasmil/adapter-sdk';
 *   const sdk = createTasmilClient({ network: 'mainnet' });
 *
 *   // Protocol-specific
 *   await sdk.blend.listPools()
 *   await sdk.soroswap.getQuote({ assetIn, assetOut, amount, tradeType: 'EXACT_IN' })
 *
 *   // Aggregated
 *   await sdk.yield.getAll({ assetFilter: 'USDC', minApy: 5 })
 *   await sdk.swap.getBestQuote({ tokenIn: 'XLM', tokenOut: 'USDC', amount: '100' })
 *   await sdk.bridge.getBestQuote({ fromChain: 'stellar', toChain: 'ethereum', asset: 'USDC', amount: '100' })
 */

// ── Client factory ─────────────────────────────────────────────
export { TasmilClient, createTasmilClient, createTasmilClientFromEnv } from "./client.js";

// ── Protocol adapters ──────────────────────────────────────────
export { BlendAdapter } from "./protocols/blend/index.js";
export type { BlendPoolInfo, BlendRegistryData } from "./protocols/blend/index.js";

export { AquariusAdapter, AquariusApiError } from "./protocols/aquarius/index.js";
export type { AquariusPool, AquariusReward } from "./protocols/aquarius/index.js";

export { SoroswapAdapter, SoroswapApiError } from "./protocols/soroswap/index.js";
export type { SoroswapPool, SoroswapQuote, SoroswapQuoteRequest } from "./protocols/soroswap/index.js";

export { PhoenixAdapter } from "./protocols/phoenix/index.js";
export type { PhoenixPoolInfo, PhoenixPoolResponse } from "./protocols/phoenix/index.js";

export { SdexAdapter, SdexError } from "./protocols/sdex/index.js";

export { AllbridgeAdapter, ALLBRIDGE_CHAINS } from "./protocols/allbridge/index.js";

export { DefindexAdapter, DefindexApiClient, DefindexApiError } from "./protocols/defindex/index.js";
export type {
  DefindexVault,
  DefindexVaultDetail,
  DefindexVaultAsset,
  DefindexStrategy,
  DefindexFundBreakdown,
  DefindexUserBalance,
  DefindexVaultHistory,
  DefindexVaultHistoryParams,
  DefindexAccountPerformance,
  DefindexAccountPerformanceParams,
} from "./protocols/defindex/index.js";

export { TemplarAdapter, TEMPLAR_CONTRACT, TEMPLAR_MARKETS } from "./protocols/templar/index.js";
export type {
  TemplarMarketId,
  TemplarMarketInfo,
  TemplarSwapQuoteParams,
  TemplarSwapResult,
  TemplarSupplyParams,
  TemplarSupplyXdrResult,
} from "./protocols/templar/index.js";

export { TasmilAdapter, TasmilApiClient, TasmilApiError } from "./protocols/tasmil/index.js";
export type { TasmilPreset, AccountStrategyStatus, AccountPosition } from "./protocols/tasmil/index.js";

// ── Aggregators ────────────────────────────────────────────────
export { YieldAggregator } from "./aggregators/yield/index.js";
export { SwapAggregator } from "./aggregators/swap/index.js";
export { BridgeAggregator } from "./aggregators/bridge/index.js";

// ── Stellar operations (submit, verify, trustlines) ───────────
export { StellarOperations } from "./stellar/operations.js";

// ── Types ──────────────────────────────────────────────────────
export type {
  // Common
  StellarNetwork,
  StellarNetworkConfig,
  TasmilClientConfig,
  XDR,
  TxBuildResult,
  TxSubmitResult,
  SimulationResult,
  AssetFormat,
  ClassicAsset,
  ContractAddress,
  AssetSymbol,
} from "./types/common.js";

export type {
  // Yield
  PoolType,
  ProtocolId,
  RiskLevel,
  APYComponents,
  PoolTerms,
  YieldOpportunity,
  YieldFilterParams,
} from "./types/yield.js";

export type {
  // Swap
  SwapProtocol,
  SwapRequest,
  SwapQuote,
  SwapAggregateResult,
} from "./types/swap.js";

export type {
  // Bridge
  BridgeProvider,
  SupportedChain,
  BridgeRequest,
  BridgeQuote,
  BridgeAggregateResult,
} from "./types/bridge.js";

export type {
  // Lending
  LendingMarket,
  LendingPosition,
  BorrowQuote,
} from "./types/lending.js";

// ── Utils (re-exported for convenience) ───────────────────────
export {
  // Network
  STELLAR_NETWORKS,
  AQUARIUS_API_URLS,
  SOROSWAP_API_BASE,
  getStellarNetworkFromEnv,
  getNetworkPassphrase,
  getSoroswapApiKey,
  // Contracts
  KNOWN_CONTRACTS,
  KNOWN_ASSETS,
  NATIVE_ASSET_CODE,
  getKnownContracts,
  getKnownAssets,
  getXlmSac,
  getBlendV2Backstop,
  getBlendV2Pools,
  // Asset resolver
  detectAssetFormat,
  resolveAsset,
  resolveAssetAsync,
  getAssetSymbol,
  resolveContractSymbol,
  // XDR
  decodeScVal,
  // Soroban
  invokeContract,
  viewCall,
  buildScVal,
  SimulationError,
  // Stellar client
  createSorobanClient,
  createHorizonClient,
  getSorobanClient,
  getHorizonClient,
  clearClientCache,
  // Timeout
  withTimeout,
  TimeoutError,
  // Logger
  createLogger,
  // NEAR RPC
  nearViewCall,
  NearRpcError,
  // Welcome reward memo
  WELCOME_REWARD_MARKER,
  buildWelcomeRewardMemo,
  stampWelcomeRewardMemoXdr,
} from "./utils/index.js";

// ── Cross-Chain Token Registry ──────────────────────────────────
export {
  CrossChainTokenRegistry,
  SUPPORTED_CHAINS,
} from "./registry/index.js";
export type {
  ChainInfo,
  CrossChainToken,
  FilterTokensParams,
  FilterTokensResult,
} from "./registry/index.js";

// ── Token Metadata Registry (Aquarius API snapshot) ──────────────
export { TOKEN_REGISTRY, lookupToken } from "./registry/token-metadata.js";
export type { TokenMeta } from "./registry/token-metadata.js";

// ── Token & Pool Registry (Stellar-specific) ────────────────────
export {
  TokenPoolRegistry,
  getTokenPoolRegistry,
} from "./utils/token-registry.js";
