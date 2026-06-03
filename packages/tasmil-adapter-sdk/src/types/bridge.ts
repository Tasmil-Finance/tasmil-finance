// ─── Bridge / Cross-chain Types ───────────────────────────────────

export type BridgeProvider = "allbridge" | "near_intents" | "templar";

export type SupportedChain =
  | "stellar"
  | "ethereum"
  | "bsc"
  | "solana"
  | "polygon"
  | "arbitrum"
  | "avalanche"
  | "near"
  | "base"
  | "optimism"
  | "tron";

export interface BridgeRequest {
  fromChain: SupportedChain | string;
  toChain: SupportedChain | string;
  /** Asset symbol or contract address on the source chain */
  asset: string;
  /** Asset symbol or address on the destination chain (defaults to same as asset) */
  assetOut?: string;
  amount: string;
  /** Sender address on source chain */
  from?: string;
  /** Recipient address on destination chain */
  to?: string;
  /** Limit to specific providers */
  providers?: BridgeProvider[];
}

export interface BridgeQuote {
  provider: BridgeProvider;
  amountIn: string;
  amountOut: string;
  /** Bridge fee */
  fee: string;
  feePercent: string;
  /** Gas fee on the destination chain paid in native token of the source chain (e.g. XLM on Stellar) */
  gasFee?: string;
  /** Symbol of the native token used for gas fee (e.g. "XLM") */
  gasFeeToken?: string;
  estimatedTime: string;
  /** Whether a swap is also performed as part of the bridge */
  crossChainSwap: boolean;
  /** For deposit-based bridges: where to send the source tokens */
  depositAddress?: string;
  depositMemo?: string;
  /** Pre-built XDR if the bridge can generate it directly */
  xdr?: string;
  status: "ok" | "unavailable" | "error";
  error?: string;
}

export interface BridgeAggregateResult {
  /** All quotes, sorted best-first (highest amountOut) */
  quotes: BridgeQuote[];
  /** Provider with the best amountOut */
  best: BridgeProvider | null;
  fromChain: string;
  toChain: string;
  asset: string;
}
