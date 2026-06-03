/**
 * Stellar DEX (SDEX) / Classic Order Book Protocol Adapter
 * Usage: sdk.sdex.getOrderbook(...), sdk.sdex.findPaths(...)
 */

import { Asset, Operation, TransactionBuilder, Memo, Horizon } from "@stellar/stellar-sdk";
import type { TasmilClientConfig, XDR } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { SwapAdapterQuoteParams } from "../../types/swap.js";
import { createHorizonClient } from "../../utils/stellar-client.js";
import { getNetworkPassphrase, STELLAR_NETWORKS } from "../../utils/network.js";
import { getAssetSymbol, resolveAsset } from "../../utils/asset-resolver.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("sdex");

export class SdexError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SdexError";
  }
}

// ─── Asset parsing ────────────────────────────────────────────────

function parseAsset(assetStr: string): Asset {
  if (!assetStr || assetStr === "XLM" || assetStr === "native") {
    return Asset.native();
  }
  const parts = assetStr.split(":");
  if (parts.length === 2 && parts[0] && parts[1]) {
    return new Asset(parts[0], parts[1]);
  }
  throw new SdexError(`Invalid classic asset format: "${assetStr}" — expected "CODE:ISSUER" or "XLM"`);
}

// ─── SdexAdapter ─────────────────────────────────────────────────

export class SdexAdapter {
  constructor(private readonly config: TasmilClientConfig) {}

  /**
   * Find strict-send paths via Horizon REST API (direct fetch, version-independent).
   * Avoids @stellar/stellar-sdk version conflicts between workspace packages.
   */
  async findStrictSendPaths(
    sourceAsset: string,
    sourceAmount: string,
    destinationAssets: string[],
  ): Promise<unknown[]> {
    const horizonUrl = this.config.horizonUrl ?? STELLAR_NETWORKS[this.config.network].horizonUrl;
    const params = new URLSearchParams();

    // Source asset params
    if (!sourceAsset || sourceAsset === "XLM" || sourceAsset === "native") {
      params.set("source_asset_type", "native");
    } else {
      const [code, issuer] = sourceAsset.split(":");
      params.set("source_asset_type", (code?.length ?? 0) <= 4 ? "credit_alphanum4" : "credit_alphanum12");
      if (code) params.set("source_asset_code", code);
      if (issuer) params.set("source_asset_issuer", issuer);
    }
    params.set("source_amount", sourceAmount);

    // Destination assets (comma-separated)
    const destStrings = destinationAssets.map((d) =>
      !d || d === "XLM" || d === "native" ? "native" : d,
    );
    params.set("destination_assets", destStrings.join(","));

    const url = `${horizonUrl}/paths/strict-send?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new SdexError(`Horizon strict-send-paths failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { _embedded?: { records?: unknown[] } };
    return data._embedded?.records ?? [];
  }

  /**
   * Find strict-receive paths via Horizon REST API (direct fetch, version-independent).
   */
  async findStrictReceivePaths(
    sourceAccount: string,
    destinationAsset: string,
    destinationAmount: string,
  ): Promise<unknown[]> {
    const horizonUrl = this.config.horizonUrl ?? STELLAR_NETWORKS[this.config.network].horizonUrl;
    const params = new URLSearchParams({ source_account: sourceAccount });

    if (!destinationAsset || destinationAsset === "XLM" || destinationAsset === "native") {
      params.set("destination_asset_type", "native");
    } else {
      const [code, issuer] = destinationAsset.split(":");
      params.set("destination_asset_type", (code?.length ?? 0) <= 4 ? "credit_alphanum4" : "credit_alphanum12");
      if (code) params.set("destination_asset_code", code);
      if (issuer) params.set("destination_asset_issuer", issuer);
    }
    params.set("destination_amount", destinationAmount);

    const url = `${horizonUrl}/paths/strict-receive?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new SdexError(`Horizon strict-receive-paths failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { _embedded?: { records?: unknown[] } };
    return data._embedded?.records ?? [];
  }

  /**
   * Get live order book snapshot via Horizon REST API (direct fetch, version-independent).
   */
  async getOrderbook(
    sellingAsset: string,
    buyingAsset: string,
    limit = 20,
  ): Promise<unknown> {
    const horizonUrl = this.config.horizonUrl ?? STELLAR_NETWORKS[this.config.network].horizonUrl;
    const params = new URLSearchParams({ limit: String(limit) });

    const addAssetParams = (prefix: string, asset: string) => {
      if (!asset || asset === "XLM" || asset === "native") {
        params.set(`${prefix}_asset_type`, "native");
      } else {
        const [code, issuer] = asset.split(":");
        params.set(`${prefix}_asset_type`, (code?.length ?? 0) <= 4 ? "credit_alphanum4" : "credit_alphanum12");
        if (code) params.set(`${prefix}_asset_code`, code);
        if (issuer) params.set(`${prefix}_asset_issuer`, issuer);
      }
    };

    addAssetParams("selling", sellingAsset);
    addAssetParams("buying", buyingAsset);

    const url = `${horizonUrl}/order_book?${params.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new SdexError(`Horizon orderbook failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Build a path payment strict-send XDR (no Soroban).
   */
  async buildPathPaymentStrictSendXDR(params: {
    from: string;
    sendAsset: string;
    sendAmount: string;
    destination: string;
    destAsset: string;
    destMin: string;
    path?: string[];
    memo?: string;
  }): Promise<XDR> {
    const horizon = createHorizonClient(this.config);
    const networkPassphrase = getNetworkPassphrase(this.config.network);
    const account = await (horizon as unknown as Horizon.Server).loadAccount(params.from);

    const sendAsset = parseAsset(params.sendAsset);
    const destAsset = parseAsset(params.destAsset);
    const pathAssets = (params.path ?? []).map(parseAsset);

    let builder = new TransactionBuilder(account, {
      fee: "1000",
      networkPassphrase,
    }).addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: params.sendAmount,
        destination: params.destination,
        destAsset,
        destMin: params.destMin,
        path: pathAssets,
      }),
    );

    if (params.memo) {
      builder = builder.addMemo(Memo.text(params.memo));
    }

    return builder.setTimeout(300).build().toXDR();
  }

  /**
   * SwapAdapter-compatible quote using strict-send paths.
   */
  async getAdapterQuote(params: SwapAdapterQuoteParams): Promise<{
    protocol: "sdex";
    amountIn: string;
    amountOut: string;
    fee: string;
    feePercent: string;
    route: string[];
    estimatedTime: string;
    status: "ok" | "no_route";
  }> {
    try {
      // SDEX / Horizon uses classic format: "XLM" or "CODE:ISSUER"
      // Resolve contract addresses or symbols to classic format before path-finding
      const classicIn = resolveAsset(params.tokenIn, "classic", this.config.network);
      const classicOut = resolveAsset(params.tokenOut, "classic", this.config.network);

      const tokenInSym = getAssetSymbol(params.tokenIn, this.config.network);
      const tokenOutSym = getAssetSymbol(params.tokenOut, this.config.network);

      // Horizon strictSendPaths expects human-readable decimal amounts (e.g. "12.0000000"),
      // not stroops. Divide by 1e7 to convert from the aggregator's stroop format.
      const humanAmount = (Number(params.amount) / 1e7).toFixed(7);

      const paths = await this.findStrictSendPaths(
        classicIn,
        humanAmount,
        [classicOut],
      );

      if (!paths || paths.length === 0) {
        return {
          protocol: "sdex",
          amountIn: params.amount,
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          route: [],
          estimatedTime: "N/A",
          status: "no_route",
        };
      }

      const best = paths[0] as Record<string, unknown>;
      // Horizon returns destination_amount in human-readable format (e.g. "36.5669746").
      // Convert to stroops (×1e7) so amountOut is consistent with Soroban adapters.
      const amountOutHuman = String(best["destination_amount"] ?? best["destAmount"] ?? "0");
      const amountOut = String(Math.round(parseFloat(amountOutHuman) * 1e7));

      const pathTokens = (best["path"] as unknown[] | undefined ?? []) as Array<
        Record<string, string>
      >;
      const routeSymbols = [
        tokenInSym,
        ...pathTokens.map((t) =>
          t["asset_type"] === "native" ? "XLM" : (t["asset_code"] ?? "?"),
        ),
        tokenOutSym,
      ];

      // SDEX charges ~0.10% fee; estimate in input token units
      const feeRate = 0.001;
      const estimatedFee = String(Math.floor(Number(params.amount) * feeRate));

      return {
        protocol: "sdex",
        amountIn: params.amount,
        amountOut,
        fee: estimatedFee,
        feePercent: "~0.10%",
        route: [...new Set(routeSymbols)],
        estimatedTime: "~5s",
        status: amountOut !== "0" ? "ok" : "no_route",
      };
    } catch (err) {
      log.warn("SDEX getAdapterQuote failed", { err: String(err) });
      throw err;
    }
  }

  // ─── Yield Aggregator (SDEX liquidity pools) ───────────────────

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    // SDEX liquidity pools are Classic Stellar liquidity pools (via Horizon)
    // Return empty for now — SDEX earn is through LP fees, complex to enumerate generically
    return [];
  }
}
