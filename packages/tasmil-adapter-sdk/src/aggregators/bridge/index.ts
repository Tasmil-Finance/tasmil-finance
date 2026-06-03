/**
 * Bridge Aggregator — compare cross-chain bridge quotes.
 *
 * Ported from apps/mcp-stellar/src/tools/unified/internals/compare-bridge-logic.ts
 * Supports: Allbridge, NEAR Intents
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type {
  BridgeRequest,
  BridgeQuote,
  BridgeAggregateResult,
  BridgeProvider,
} from "../../types/bridge.js";
import { withTimeout } from "../../utils/timeout.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("bridge-aggregator");
const TIMEOUT_MS = 15_000;

// ─── NEAR Intents client ──────────────────────────────────────────

const NEAR_INTENTS_API = "https://1click.chaindefuser.com/v0";

async function getNearIntentsQuote(
  fromChain: string,
  toChain: string,
  assetIn: string,
  assetOut: string,
  amount: string,
  recipient: string,
  refund: string,
): Promise<BridgeQuote> {
  const chainIn = fromChain.toLowerCase() === "stellar" ? "stellar" : fromChain.toLowerCase();
  const chainOut = toChain.toLowerCase() === "stellar" ? "stellar" : toChain.toLowerCase();

  const res = await fetch(`${NEAR_INTENTS_API}/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      defuse_asset_identifier_in: `${chainIn}:${assetIn.toLowerCase()}`,
      defuse_asset_identifier_out: `${chainOut}:${assetOut.toLowerCase()}`,
      exact_amount_in: amount,
      deadline: new Date(Date.now() + 300_000).toISOString(),
      deposit_address: recipient,
      refund_address: refund,
    }),
  });

  if (!res.ok) {
    throw new Error(`NEAR Intents API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const amountOut = String(data["amount_out"] ?? data["amountOut"] ?? "0");
  const fee = String(data["fee"] ?? "0");

  return {
    provider: "near_intents",
    amountIn: amount,
    amountOut,
    fee,
    feePercent:
      amountOut !== "0" && parseFloat(amount) > 0
        ? ((parseFloat(fee) / parseFloat(amount)) * 100).toFixed(2) + "%"
        : "N/A",
    estimatedTime: "~2min",
    crossChainSwap: true,
    status: "ok",
  };
}

// ─── BridgeAggregator ─────────────────────────────────────────────

export class BridgeAggregator {
  constructor(private readonly config: TasmilClientConfig) {}

  /**
   * Get quotes from all bridge providers in parallel.
   */
  async getAllQuotes(request: BridgeRequest): Promise<BridgeAggregateResult> {
    const {
      fromChain,
      toChain,
      asset,
      assetOut,
      amount,
      from,
      to,
      providers,
    } = request;

    const recipient = to ?? from ?? "0x0000000000000000000000000000000000000001";
    const refund = from ?? recipient;
    const assetOutSym = assetOut ?? asset;

    const enabled = (name: BridgeProvider) =>
      !providers || providers.includes(name);

    const { AllbridgeAdapter } = await import("../../protocols/allbridge/index.js");
    const allbridge = new AllbridgeAdapter(this.config);

    const tasks: Array<Promise<BridgeQuote>> = [];
    const providerOrder: BridgeProvider[] = [];

    if (enabled("allbridge")) {
      tasks.push(
        withTimeout(
          allbridge.getQuote({ fromChain, toChain, asset, assetOut: assetOutSym, amount }),
          TIMEOUT_MS,
        ),
      );
      providerOrder.push("allbridge");
    }

    // NEAR Intents and Templar bridge providers are disabled for now.
    // NEAR Intents: API unstable, frequently unavailable.
    // Templar: requires refundTo/recipient params that aren't available at discovery time.

    const results = await Promise.allSettled(tasks);
    const quotes: BridgeQuote[] = [];

    for (let i = 0; i < providerOrder.length; i++) {
      const r = results[i]!;
      if (r.status === "fulfilled") {
        quotes.push(r.value);
      } else {
        quotes.push({
          provider: providerOrder[i]!,
          amountIn: amount,
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          estimatedTime: "N/A",
          crossChainSwap: false,
          status: "unavailable",
          error: (r as PromiseRejectedResult).reason?.message,
        });
      }
    }

    const ok = quotes
      .filter((q) => q.status === "ok" && q.amountOut !== "0")
      .sort((a, b) => parseFloat(b.amountOut) - parseFloat(a.amountOut));

    const sorted: BridgeQuote[] = [
      ...ok,
      ...quotes.filter((q) => q.status !== "ok" || q.amountOut === "0"),
    ];

    return {
      quotes: sorted,
      best: ok[0]?.provider ?? null,
      fromChain,
      toChain,
      asset,
    };
  }

  /**
   * Get the best bridge quote.
   */
  async getBestQuote(request: BridgeRequest): Promise<BridgeQuote | null> {
    const result = await this.getAllQuotes(request);
    return result.quotes.find((q) => q.status === "ok") ?? null;
  }
}
