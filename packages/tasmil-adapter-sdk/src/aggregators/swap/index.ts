/**
 * Swap Aggregator — get best quote across Soroswap, Aquarius, Phoenix, SDEX.
 *
 * Ported from apps/mcp-stellar/src/services/aggregator-service.ts
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type {
  SwapRequest,
  SwapQuote,
  SwapAggregateResult,
  SwapProtocol,
} from "../../types/swap.js";
import { getAssetSymbol } from "../../utils/asset-resolver.js";
import { withTimeout } from "../../utils/timeout.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("swap-aggregator");
const TIMEOUT_MS = 10_000;

type SwapAdapterLike = {
  getAdapterQuote(params: {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    from?: string;
    slippageBps?: number;
  }): Promise<SwapQuote>;
};

// ─── SwapAggregator ───────────────────────────────────────────────

export class SwapAggregator {
  constructor(private readonly config: TasmilClientConfig) {}

  /**
   * Get swap quotes from all protocols in parallel. Returns sorted best-first.
   */
  async getAllQuotes(request: SwapRequest): Promise<SwapAggregateResult> {
    const { tokenIn, tokenOut, amount, from, slippageBps, protocols } = request;

    if (!tokenIn || !tokenOut || !amount) {
      throw new Error("SwapAggregator requires tokenIn, tokenOut, amount");
    }

    const [
      { SoroswapAdapter },
      { AquariusAdapter },
      { PhoenixAdapter },
      { SdexAdapter },
      // { TemplarAdapter }, // Templar swap disabled — requires NEAR params not available at quote time
    ] = await Promise.all([
      import("../../protocols/soroswap/index.js"),
      import("../../protocols/aquarius/index.js"),
      import("../../protocols/phoenix/index.js"),
      import("../../protocols/sdex/index.js"),
      // import("../../protocols/templar/index.js"),
    ]);

    const allAdapters: Array<[SwapProtocol, SwapAdapterLike]> = [
      ["soroswap", new SoroswapAdapter(this.config) as unknown as SwapAdapterLike],
      ["aquarius", new AquariusAdapter(this.config) as unknown as SwapAdapterLike],
      ["phoenix", new PhoenixAdapter(this.config) as unknown as SwapAdapterLike],
      ["sdex", new SdexAdapter(this.config) as unknown as SwapAdapterLike],
      // ["templar", new TemplarAdapter(this.config) as unknown as SwapAdapterLike],
    ];

    const filtered = protocols
      ? allAdapters.filter(([id]) => protocols.includes(id))
      : allAdapters;

    const params = { tokenIn, tokenOut, amount, from, slippageBps };

    const results = await Promise.allSettled(
      filtered.map(([, adapter]) =>
        withTimeout(adapter.getAdapterQuote(params), TIMEOUT_MS),
      ),
    );

    const quotes: SwapQuote[] = [];

    for (let i = 0; i < filtered.length; i++) {
      const [protocol] = filtered[i]!;
      const r = results[i]!;

      if (r.status === "fulfilled") {
        quotes.push({ ...r.value, protocol });
      } else {
        quotes.push({
          protocol,
          amountIn: amount,
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          route: [],
          estimatedTime: "N/A",
          status: "unavailable",
          error: (r as PromiseRejectedResult).reason?.message,
        });
      }
    }

    const unavailable = quotes.filter((q) => q.status !== "ok");
    if (unavailable.length > 0) {
      log.warn(`${unavailable.length}/${quotes.length} protocols unavailable`, {
        protocols: unavailable.map((q) => q.protocol),
      });
    }

    const ok = quotes
      .filter((q) => q.status === "ok")
      .sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut));

    const sorted: SwapQuote[] = [
      ...ok,
      ...quotes.filter((q) => q.status !== "ok"),
    ];

    return {
      quotes: sorted,
      best: ok[0]?.protocol ?? null,
      tokenIn: getAssetSymbol(tokenIn, this.config.network),
      tokenOut: getAssetSymbol(tokenOut, this.config.network),
    };
  }

  /**
   * Get only the best quote.
   */
  async getBestQuote(request: SwapRequest): Promise<SwapQuote | null> {
    const result = await this.getAllQuotes(request);
    return result.quotes.find((q) => q.status === "ok") ?? null;
  }
}
