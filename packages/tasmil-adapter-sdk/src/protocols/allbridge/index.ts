/**
 * Allbridge Cross-Chain Bridge Protocol Adapter
 * Usage: sdk.allbridge.getQuote(...), sdk.allbridge.lp.listPools()
 *
 * Uses REST API fallback when the AllbridgeCoreSdk fails (known issue in Next.js).
 */

import {
  AllbridgeCoreSdk,
  ChainSymbol,
  FeePaymentMethod,
  Messenger,
} from "@allbridge/bridge-core-sdk";
import type { TasmilClientConfig } from "../../types/common.js";
import type { BridgeQuote } from "../../types/bridge.js";
import type { YieldOpportunity } from "../../types/yield.js";
import { STELLAR_NETWORKS } from "../../utils/network.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("allbridge");

const ALLBRIDGE_API = "https://core.api.allbridgecoreapi.net";

// ─── Chain mappings ───────────────────────────────────────────────

export const ALLBRIDGE_CHAINS: Record<string, ChainSymbol> = {
  stellar: ChainSymbol.SRB,
  ethereum: ChainSymbol.ETH,
  bsc: ChainSymbol.BSC,
  polygon: ChainSymbol.POL,
  avalanche: ChainSymbol.AVA,
  solana: ChainSymbol.SOL,
  arbitrum: ChainSymbol.ARB,
  optimism: ChainSymbol.OPT,
  base: ChainSymbol.BAS,
  tron: ChainSymbol.TRX,
};

// Reverse map: our chain ID → Allbridge ChainSymbol string
const CHAIN_TO_SYMBOL: Record<string, string> = {};
for (const [chainId, sym] of Object.entries(ALLBRIDGE_CHAINS)) {
  CHAIN_TO_SYMBOL[chainId] = sym;
}
// Add chains not in the original map
CHAIN_TO_SYMBOL["celo"] = "CEL";
CHAIN_TO_SYMBOL["sonic"] = "SNC";
CHAIN_TO_SYMBOL["unichain"] = "UNI";
CHAIN_TO_SYMBOL["linea"] = "LIN";
CHAIN_TO_SYMBOL["sui"] = "SUI";
CHAIN_TO_SYMBOL["algorand"] = "ALG";
CHAIN_TO_SYMBOL["stacks"] = "STX";

// Native token symbol per chain (for gas fee display)
// Native token symbol per chain (for gas fee display)
const CHAIN_NATIVE_TOKEN: Record<string, string> = {
  stellar: "XLM",
  ethereum: "ETH",
  bsc: "BNB",
  polygon: "POL",
  avalanche: "AVAX",
  solana: "SOL",
  arbitrum: "ETH",
  optimism: "ETH",
  base: "ETH",
  tron: "TRX",
  celo: "CELO",
  sonic: "S",
  linea: "ETH",
  sui: "SUI",
};

// Native token decimals per chain (for converting txCostAmount)
const CHAIN_NATIVE_DECIMALS: Record<string, number> = {
  stellar: 7,
  ethereum: 18,
  bsc: 18,
  polygon: 18,
  avalanche: 18,
  solana: 9,
  arbitrum: 18,
  optimism: 18,
  base: 18,
  tron: 6,
  celo: 18,
  sonic: 18,
  linea: 18,
  sui: 9,
};

// ─── REST API token info cache ───────────────────────────────────

let cachedTokenInfo: Record<string, unknown> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTokenInfo(): Promise<Record<string, unknown>> {
  if (cachedTokenInfo && Date.now() - cacheTime < CACHE_TTL) {
    return cachedTokenInfo;
  }
  const res = await fetch(`${ALLBRIDGE_API}/token-info`);
  if (!res.ok) throw new Error(`Allbridge API failed: ${res.status}`);
  cachedTokenInfo = (await res.json()) as Record<string, unknown>;
  cacheTime = Date.now();
  return cachedTokenInfo;
}

// ─── REST-based quote calculation ────────────────────────────────

interface AllbridgeTokenData {
  symbol: string;
  name: string;
  decimals: number;
  feeShare: string;
  poolAddress: string;
  tokenAddress: string;
  poolInfo?: {
    aValue: string;
    dValue: string;
    tokenBalance: string;
    vUsdBalance: string;
    totalLpAmount: string;
    p: number;
  };
}

interface AllbridgeChainData {
  tokens: AllbridgeTokenData[];
  transferTime?: Record<string, Record<string, number | null>>;
  txCostAmount?: {
    swap?: string;
    transfer?: string;
    maxAmount?: string;
  };
}

async function getQuoteViaRest(
  fromChain: string,
  toChain: string,
  asset: string,
  assetOut: string,
  amount: string,
): Promise<BridgeQuote> {
  const fromSym = CHAIN_TO_SYMBOL[fromChain.toLowerCase()];
  const toSym = CHAIN_TO_SYMBOL[toChain.toLowerCase()];

  if (!fromSym || !toSym) {
    throw new Error(`Chain not supported by Allbridge: ${fromChain} → ${toChain}`);
  }

  const tokenInfo = await getTokenInfo();
  const srcChain = tokenInfo[fromSym] as AllbridgeChainData | undefined;
  const dstChain = tokenInfo[toSym] as AllbridgeChainData | undefined;

  if (!srcChain) throw new Error(`${fromChain} not found in Allbridge`);
  if (!dstChain) throw new Error(`${toChain} not found in Allbridge`);

  const srcToken = srcChain.tokens.find(
    (t) => t.symbol.toUpperCase() === asset.toUpperCase(),
  );
  const dstToken = dstChain.tokens.find(
    (t) => t.symbol.toUpperCase() === assetOut.toUpperCase(),
  );

  if (!srcToken) throw new Error(`${asset} not on ${fromChain} (Allbridge)`);
  if (!dstToken) throw new Error(`${assetOut} not on ${toChain} (Allbridge)`);

  // LP fee: 0.3% total (0.15% sending + 0.15% receiving)
  // Each token has its own feeShare; apply both sides
  const amountFloat = parseFloat(amount);
  const srcFeeShare = parseFloat(srcToken.feeShare || "0");
  const dstFeeShare = parseFloat(dstToken.feeShare || "0");
  const amountOut = amountFloat * (1 - srcFeeShare) * (1 - dstFeeShare);

  // Transfer time (in milliseconds from API)
  let estimatedTime = "~5min";
  if (srcChain.transferTime?.[toSym]) {
    const times = srcChain.transferTime[toSym]!;
    const transferMs = times["allbridge"] ?? times["Allbridge"] ?? null;
    if (transferMs != null && transferMs > 0) {
      estimatedTime = `~${Math.ceil(transferMs / 60_000)}min`;
    }
  }

  const fee = (amountFloat - amountOut).toFixed(6);

  // Relayer fee — use txCostAmount from token-info (already fetched, no auth needed)
  let gasFee: string | undefined;
  let gasFeeToken: string | undefined;
  const srcTxCost = srcChain.txCostAmount?.transfer;
  if (srcTxCost) {
    const srcNativeDecimals = CHAIN_NATIVE_DECIMALS[fromChain.toLowerCase()] ?? 9;
    gasFee = (Number(srcTxCost) / 10 ** srcNativeDecimals).toString();
    gasFeeToken = CHAIN_NATIVE_TOKEN[fromChain.toLowerCase()] ?? fromChain;
  }

  return {
    provider: "allbridge",
    amountIn: amount,
    amountOut: amountOut.toFixed(6),
    fee,
    feePercent: amountFloat > 0
      ? ((parseFloat(fee) / amountFloat) * 100).toFixed(2) + "%"
      : "N/A",
    gasFee,
    gasFeeToken,
    estimatedTime,
    crossChainSwap: false,
    status: "ok",
  };
}

// ─── AllbridgeAdapter ─────────────────────────────────────────────

export class AllbridgeAdapter {
  constructor(private readonly config: TasmilClientConfig) {}

  private getSdk(): AllbridgeCoreSdk {
    const rpcUrl =
      this.config.rpcUrl ?? STELLAR_NETWORKS[this.config.network].rpcUrl;
    const horizonUrl = STELLAR_NETWORKS[this.config.network].horizonUrl;
    // Explicit RPC URLs for all chains — nodeRpcUrlsDefault has restricted
    // endpoints that return 403, causing SDK to fail with inaccurate REST fallback
    return new AllbridgeCoreSdk({
      // Stellar
      [ChainSymbol.SRB]: rpcUrl,
      [ChainSymbol.STLR]: horizonUrl,
      // Solana
      [ChainSymbol.SOL]: "https://solana-rpc.publicnode.com",
      // EVM chains
      [ChainSymbol.ETH]: "https://ethereum-rpc.publicnode.com",
      [ChainSymbol.BSC]: "https://bsc-rpc.publicnode.com",
      [ChainSymbol.POL]: "https://polygon-bor-rpc.publicnode.com",
      [ChainSymbol.ARB]: "https://arbitrum-one-rpc.publicnode.com",
      [ChainSymbol.OPT]: "https://optimism-rpc.publicnode.com",
      [ChainSymbol.AVA]: "https://avalanche-c-chain-rpc.publicnode.com",
      [ChainSymbol.BAS]: "https://base-rpc.publicnode.com",
      [ChainSymbol.CEL]: "https://celo-rpc.publicnode.com",
      [ChainSymbol.SNC]: "https://rpc.soniclabs.com",
      [ChainSymbol.LIN]: "https://linea-rpc.publicnode.com",
      [ChainSymbol.UNI]: "https://unichain.drpc.org",
      // Other chains
      [ChainSymbol.TRX]: "https://tron-rpc.publicnode.com",
      [ChainSymbol.SUI]: "https://sui-rpc.publicnode.com",
      [ChainSymbol.ALG]: "https://mainnet-api.algonode.cloud",
      [ChainSymbol.STX]: "https://stacks-node-api.mainnet.stacks.co",
    });
  }

  /**
   * Get a bridge quote. Supports same-token (USDC→USDC) and
   * cross-token (USDT→USDC) bridging. Tries SDK first, falls back to REST API.
   */
  async getQuote(params: {
    fromChain: string;
    toChain: string;
    asset: string;
    assetOut?: string;
    amount: string;
  }): Promise<BridgeQuote> {
    const { fromChain, toChain, asset, amount } = params;
    const assetOut = params.assetOut ?? asset;
    try {
      // Try SDK first
      const sdk = this.getSdk();
      const fromSym = ALLBRIDGE_CHAINS[fromChain.toLowerCase()];
      const toSym = ALLBRIDGE_CHAINS[toChain.toLowerCase()];

      if (!fromSym || !toSym) throw new Error("Chain not in SDK map");

      const chains = await sdk.chainDetailsMap();
      const src = chains[fromSym]?.tokens.find(
        (t) => t.symbol.toUpperCase() === asset.toUpperCase(),
      );
      const dst = chains[toSym]?.tokens.find(
        (t) => t.symbol.toUpperCase() === assetOut.toUpperCase(),
      );

      if (!src || !dst) throw new Error("Token not found via SDK");

      const srcDecimals = src.decimals;
      const dstDecimals = dst.decimals;
      const humanAmount = (parseFloat(amount) / 10 ** srcDecimals).toString();

      const humanOut = await sdk.getAmountToBeReceived(humanAmount, src, dst, Messenger.ALLBRIDGE);
      const transferTime = await sdk.getAverageTransferTime(src, dst, Messenger.ALLBRIDGE);

      // Fetch gas fee (native token fee on source chain)
      let gasFee: string | undefined;
      let gasFeeToken: string | undefined;
      try {
        const gasFeeOptions = await sdk.getGasFeeOptions(src, dst, Messenger.ALLBRIDGE);
        const nativeFee = gasFeeOptions[FeePaymentMethod.WITH_NATIVE_CURRENCY];
        if (nativeFee) {
          gasFee = nativeFee.float;
          gasFeeToken = CHAIN_NATIVE_TOKEN[fromChain.toLowerCase()] ?? fromChain;
        }
      } catch (err) {
        log.warn("Allbridge getGasFeeOptions failed", { err: String(err) });
      }

      const rawOut = (parseFloat(humanOut) * 10 ** dstDecimals).toFixed(0);
      const humanIn = parseFloat(amount) / 10 ** srcDecimals;
      const feeHuman = humanIn - parseFloat(humanOut);
      const feeRaw = (feeHuman * 10 ** dstDecimals).toFixed(0);

      return {
        provider: "allbridge",
        amountIn: amount,
        amountOut: rawOut,
        fee: feeRaw,
        feePercent: humanIn > 0
          ? ((feeHuman / humanIn) * 100).toFixed(2) + "%"
          : "N/A",
        gasFee,
        gasFeeToken,
        estimatedTime: transferTime != null ? `~${Math.ceil(Number(transferTime) / 60_000)}min` : "~5min",
        crossChainSwap: asset.toUpperCase() !== assetOut.toUpperCase(),
        status: "ok",
      };
    } catch {
      // SDK failed — use REST API
      try {
        return await getQuoteViaRest(fromChain, toChain, asset, assetOut, amount);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.warn("Allbridge getQuote failed", { err: msg, fromChain, toChain, asset, assetOut });
        return {
          provider: "allbridge",
          amountIn: amount,
          amountOut: "0",
          fee: "0",
          feePercent: "N/A",
          estimatedTime: "N/A",
          crossChainSwap: false,
          status: "unavailable",
          error: msg,
        };
      }
    }
  }

  /**
   * Get all supported chain details and tokens.
   */
  async getSupportedChains(): Promise<Record<string, unknown>> {
    try {
      const sdk = this.getSdk();
      return (await sdk.chainDetailsMap()) as Record<string, unknown>;
    } catch {
      return getTokenInfo();
    }
  }

  // ─── Allbridge LP (liquidity pools for earning) ───────────────

  readonly lp = new AllbridgeLpAdapter(this);

  // ─── Yield Aggregator interface ────────────────────────────────

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    return this.lp.getYieldOpportunities();
  }

  /** @internal */
  _getConfig(): TasmilClientConfig {
    return this.config;
  }

  /** @internal */
  _getSdk(): AllbridgeCoreSdk {
    return this.getSdk();
  }
}

// ─── AllbridgeLpAdapter ───────────────────────────────────────────

export class AllbridgeLpAdapter {
  constructor(private readonly parent: AllbridgeAdapter) {}

  async listPools(): Promise<Array<{
    chain: string;
    asset: string;
    apr: number | null;
    tvl: string | null;
    poolAddress: string;
    imbalance?: number;
  }>> {
    try {
      const chainsData = await this.parent.getSupportedChains();
      const pools: Array<{
        chain: string;
        asset: string;
        apr: number | null;
        tvl: string | null;
        poolAddress: string;
        imbalance?: number;
      }> = [];

      for (const [chainSym, chainDataRaw] of Object.entries(chainsData)) {
        const chainName = Object.keys(ALLBRIDGE_CHAINS).find(
          (k) => ALLBRIDGE_CHAINS[k] === chainSym,
        ) ?? chainSym;
        const chainData = chainDataRaw as { tokens?: Array<Record<string, unknown>> };

        for (const token of chainData.tokens ?? []) {
          pools.push({
            chain: chainName,
            asset: String(token["symbol"] ?? ""),
            apr: typeof token["apr"] === "number" ? (token["apr"] as number) : null,
            tvl: token["totalValueLocked"] != null
              ? String(token["totalValueLocked"])
              : null,
            poolAddress: String(token["poolAddress"] ?? ""),
            imbalance: typeof token["imbalance"] === "number"
              ? (token["imbalance"] as number)
              : undefined,
          });
        }
      }

      return pools.filter((p) => p.poolAddress);
    } catch (err) {
      log.warn("Allbridge LP listPools failed", { err: String(err) });
      return [];
    }
  }

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    const pools = await this.listPools();
    return pools.map((p) => ({
      protocol: "allbridge" as const,
      type: "lp" as const,
      name: `Allbridge ${p.asset} (${p.chain})`,
      assets: [p.asset],
      apy: {
        base: p.apr,
        reward: null,
        total: p.apr,
      },
      tvl: p.tvl,
      poolAddress: p.poolAddress,
      risk: "medium" as const,
      status: "ok" as const,
    }));
  }
}
