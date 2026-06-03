// ─── Swap Types ───────────────────────────────────────────────────

export type SwapProtocol = "soroswap" | "aquarius" | "phoenix" | "sdex" | "templar";

export interface SwapRequest {
  /** Token in (symbol, contract, or classic format) */
  tokenIn: string;
  /** Token out (symbol, contract, or classic format) */
  tokenOut: string;
  /** Amount as string (in asset's native units, 7 decimals for Stellar) */
  amount: string;
  /** "EXACT_IN" (default) or "EXACT_OUT" */
  tradeType?: "EXACT_IN" | "EXACT_OUT";
  /** Signer's Stellar address — required for building TX */
  from?: string;
  /** Slippage tolerance in basis points (default: 100 = 1%) */
  slippageBps?: number;
  /** Limit to specific protocols */
  protocols?: SwapProtocol[];
}

export interface SwapQuote {
  protocol: SwapProtocol;
  amountIn: string;
  amountOut: string;
  /** Fee in amount units */
  fee: string;
  /** Fee as human-readable percent (e.g. "0.30%") */
  feePercent: string;
  /** Price impact as human-readable percent */
  priceImpact?: string;
  /** Token symbols along the route */
  route: string[];
  /** Estimated settlement time */
  estimatedTime: string;
  /** Pool/pair address involved */
  poolAddress?: string;
  status: "ok" | "unavailable" | "no_route";
  error?: string;
}

export interface SwapAggregateResult {
  /** All quotes, sorted best-first (highest amountOut for EXACT_IN) */
  quotes: SwapQuote[];
  /** Protocol ID of the best quote, or null if all failed */
  best: SwapProtocol | null;
  /** Resolved human-readable symbol */
  tokenIn: string;
  tokenOut: string;
}

export interface SwapAdapterQuoteParams {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  from?: string;
  slippageBps?: number;
}
