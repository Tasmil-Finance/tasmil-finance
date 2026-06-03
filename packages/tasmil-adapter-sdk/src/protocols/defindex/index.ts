/**
 * DeFindex Multi-Strategy Vault Protocol Adapter
 *
 * Uses the DeFindex REST API (https://api.defindex.io) as primary data source
 * with on-chain Soroban RPC calls as fallback.
 *
 * Usage: sdk.defindex.listVaults(), sdk.defindex.getVaultDetail(address)
 */

import { xdr as stellarXdr } from "@stellar/stellar-sdk";
import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import { getAssetPriceMap } from "../../utils/price.js";
import { getDefindexContracts } from "../../utils/contracts.js";
import { invokeContract, viewCall, buildScVal } from "../../utils/soroban.js";
import { decodeScVal } from "../../utils/xdr-parser.js";
import { getAssetSymbol } from "../../utils/asset-resolver.js";
import { createLogger } from "../../utils/logger.js";
import { DefindexApiClient, DefindexApiError } from "./api-client.js";
import type {
  DefindexVault,
  DefindexVaultDetail,
  DefindexUserBalance,
  DefindexVaultHistoryParams,
  DefindexVaultHistory,
  DefindexAccountPerformanceParams,
  DefindexAccountPerformance,
} from "./types.js";

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
} from "./types.js";

export { DefindexApiClient, DefindexApiError } from "./api-client.js";

const log = createLogger("defindex");

// ─── DefindexAdapter ─────────────────────────────────────────────

export class DefindexAdapter {
  private readonly factoryAddress: string;
  private readonly knownVaults: Array<{ name: string; address: string; asset: string }>;
  private readonly api: DefindexApiClient;

  constructor(private readonly config: TasmilClientConfig) {
    const contracts = getDefindexContracts(config.network);
    this.factoryAddress = contracts.factory;
    this.knownVaults = (contracts.knownVaults ?? []) as Array<{
      name: string;
      address: string;
      asset: string;
    }>;
    this.api = new DefindexApiClient(
      config.defindexApiUrl ?? process.env["DEFINDEX_API_URL"],
      config.defindexApiKey ?? process.env["DEFINDEX_API_KEY"],
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private async _withApiFallback<T>(
    apiCall: () => Promise<T>,
    fallback: () => Promise<T>,
    label: string,
  ): Promise<T> {
    try {
      return await apiCall();
    } catch (err) {
      // Only fall back on auth/network errors — NOT on business logic errors (simulation failures, validation)
      const isApiBizError =
        err instanceof DefindexApiError && err.status >= 400 && err.status < 403;
      if (isApiBizError) throw err;

      log.warn(`DeFindex API failed for ${label}, falling back to on-chain`, {
        err: err instanceof Error ? err.message : String(err),
      });
      return fallback();
    }
  }

  // ─── Vault Discovery ──────────────────────────────────────────

  /**
   * List all DeFindex vaults. Uses REST API with on-chain/known-vaults fallback.
   */
  async listVaults(): Promise<DefindexVault[]> {
    return this._withApiFallback(
      () => this._listVaultsFromApi(),
      () => this._listVaultsOnChain(),
      "listVaults",
    );
  }

  private async _listVaultsFromApi(): Promise<DefindexVault[]> {
    const response = await this.api.discover(this.config.network);
    const vaults = response.vaults.map((v) => {
      const funds = v.totalManagedFunds ?? [];
      const firstAssetAddr = funds[0]?.asset;
      const asset = firstAssetAddr
        ? getAssetSymbol(firstAssetAddr, this.config.network)
        : "unknown";
      const totalRaw = funds.reduce((acc, f) => acc + BigInt(f.total_amount || "0"), 0n);
      return {
        address: v.address,
        name: v.address.slice(0, 12) + "...",
        symbol: undefined as string | undefined,
        asset,
        assetAddress: firstAssetAddr,
        totalSupply: totalRaw.toString(),
        tvl: totalRaw.toString(),
        apy: v.apy,
        status: "ok" as const,
      };
    });

    // Resolve actual vault names + symbols from on-chain in parallel
    const enrichResults = await Promise.allSettled(
      vaults.map(async (v) => {
        const [nameXdr, symbolXdr] = await Promise.all([
          viewCall(this.config, v.address, "name", []).catch(() => null),
          viewCall(this.config, v.address, "symbol", []).catch(() => null),
        ]);
        return {
          name: nameXdr ? (decodeScVal(nameXdr) as string) : null,
          symbol: symbolXdr ? (decodeScVal(symbolXdr) as string) : null,
        };
      }),
    );
    for (let i = 0; i < vaults.length; i++) {
      const r = enrichResults[i];
      if (r && r.status === "fulfilled") {
        if (r.value.name) vaults[i]!.name = r.value.name;
        if (r.value.symbol) vaults[i]!.symbol = r.value.symbol;
      }
    }

    return vaults;
  }

  private async _listVaultsOnChain(): Promise<DefindexVault[]> {
    // Testnet: use known vaults
    if (this.config.network === "testnet" && this.knownVaults.length > 0) {
      const results: DefindexVault[] = [];
      for (const v of this.knownVaults) {
        const vault = await this._getVaultOnChain(v.address, v.name, v.asset);
        results.push(vault);
      }
      return results;
    }

    // Mainnet: try factory (may fail if contract upgraded)
    try {
      const xdr = await viewCall(this.config, this.factoryAddress, "deployed_defindexes", []);
      if (!xdr) return [];
      const addresses = decodeScVal(xdr) as string[];
      const results: DefindexVault[] = [];
      for (const address of addresses) {
        try {
          results.push(await this._getVaultOnChain(address));
        } catch (err) {
          log.warn(`Failed to load vault ${address}`, { err: String(err) });
          results.push({ address, name: address.slice(0, 8) + "...", asset: "unknown", status: "unavailable" });
        }
      }
      return results;
    } catch (err) {
      log.warn("DeFindex factory fallback also failed", { err: String(err) });
      return [];
    }
  }

  // ─── Vault Info ────────────────────────────────────────────────

  /**
   * Get basic vault info (backward-compatible).
   */
  async getVault(address: string): Promise<DefindexVault> {
    return this._withApiFallback<DefindexVault>(
      async () => {
        const detail = await this.api.getVaultInfo(address, this.config.network);
        const firstAsset = detail.assets?.[0];
        return {
          address,
          name: detail.name,
          symbol: detail.symbol,
          asset: firstAsset?.symbol ?? "unknown",
          assetAddress: firstAsset?.address,
          totalSupply: detail.totalManagedFunds?.[0]?.total_amount,
          tvl: null,
          apy: detail.apy,
          status: "ok" as const,
        };
      },
      () => this._getVaultOnChain(address),
      "getVault",
    );
  }

  /**
   * Get full vault detail from the API (strategies, roles, fund breakdown, fees, APY).
   * No on-chain fallback — this data is only available from the API.
   */
  async getVaultDetail(address: string): Promise<DefindexVaultDetail> {
    return this.api.getVaultInfo(address, this.config.network);
  }

  private async _getVaultOnChain(
    address: string,
    knownName?: string,
    knownAsset?: string,
  ): Promise<DefindexVault> {
    try {
      let name = knownName;
      if (!name) {
        try {
          const nameXdr = await viewCall(this.config, address, "name", []);
          if (nameXdr) name = decodeScVal(nameXdr) as string;
        } catch {
          name = address.slice(0, 12) + "...";
        }
      }

      let totalSupply: string | undefined;
      try {
        const supplyXdr = await viewCall(this.config, address, "total_supply", []);
        if (supplyXdr) totalSupply = String(decodeScVal(supplyXdr));
      } catch {}

      let assetAddress: string | undefined;
      if (!knownAsset) {
        try {
          const assetXdr = await viewCall(this.config, address, "asset", []);
          if (assetXdr) assetAddress = decodeScVal(assetXdr) as string;
        } catch {}
      }

      const asset = knownAsset ?? (assetAddress
        ? getAssetSymbol(assetAddress, this.config.network)
        : "unknown");

      return {
        address,
        name: name ?? address.slice(0, 12) + "...",
        asset,
        assetAddress,
        totalSupply,
        tvl: null,
        apy: null,
        status: "ok",
      };
    } catch (err) {
      log.warn(`DeFindex _getVaultOnChain failed for ${address}`, { err: String(err) });
      return {
        address,
        name: knownName ?? address.slice(0, 12) + "...",
        asset: knownAsset ?? "unknown",
        status: "unavailable",
      };
    }
  }

  // ─── User Balance ──────────────────────────────────────────────

  /**
   * Get user balance with underlying asset values (API-first).
   */
  async getVaultBalance(vaultAddress: string, userAddress: string): Promise<DefindexUserBalance> {
    return this._withApiFallback(
      () => this.api.getVaultBalance(vaultAddress, userAddress, this.config.network),
      async () => {
        const shares = await this.getUserShares(vaultAddress, userAddress);
        return { dfTokens: shares, underlyingBalance: [] };
      },
      "getVaultBalance",
    );
  }

  /**
   * Get user's share balance (on-chain, backward-compatible).
   */
  async getUserShares(vaultAddress: string, userAddress: string): Promise<string> {
    try {
      const balanceXdr = await viewCall(
        this.config,
        vaultAddress,
        "balance",
        [buildScVal("address", userAddress)],
      );
      if (!balanceXdr) return "0";
      return String(decodeScVal(balanceXdr));
    } catch {
      return "0";
    }
  }

  // ─── APY ───────────────────────────────────────────────────────

  /**
   * Get 7-day APY from the API.
   */
  async getVaultApy(address: string): Promise<number | null> {
    try {
      const res = await this.api.getVaultApy(address, this.config.network);
      return res.apy ?? null;
    } catch {
      return null;
    }
  }

  // ─── Transaction Building ─────────────────────────────────────

  /**
   * Build deposit TX (API-first with on-chain fallback).
   */
  async buildDeposit(params: {
    vaultAddress: string;
    amounts: string[];
    from: string;
    slippageBps?: number;
    invest?: boolean;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    return this._withApiFallback(
      async () => {
        const res = await this.api.buildDeposit(
          params.vaultAddress,
          this.config.network,
          {
            amounts: params.amounts.map(Number),
            caller: params.from,
            slippageBps: params.slippageBps ?? 100,
            invest: params.invest ?? true,
          },
        );
        if (!res.xdr) throw new Error("API returned null XDR");
        return { xdr: res.xdr, estimatedFee: "0" };
      },
      () => this._buildDepositOnChain(params),
      "buildDeposit",
    );
  }

  private async _buildDepositOnChain(params: {
    vaultAddress: string;
    amounts: string[];
    from: string;
    slippageBps?: number;
    invest?: boolean;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    if (params.amounts.length === 0) throw new Error("Amounts array cannot be empty");
    const amountsScVal = stellarXdr.ScVal.scvVec(
      params.amounts.map((a) => buildScVal("i128", a)),
    );
    const slippage = params.slippageBps ?? 100;
    const totalAmount = params.amounts.reduce((acc, a) => acc + BigInt(a), 0n);
    const minSharesOut = totalAmount - (totalAmount * BigInt(slippage)) / 10000n;
    const args = [
      amountsScVal,
      buildScVal("i128", minSharesOut.toString()),
      buildScVal("address", params.from),
      buildScVal("bool", params.invest ?? true),
    ];
    const result = await invokeContract(this.config, params.vaultAddress, "deposit", args, params.from);
    return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
  }

  /**
   * Build withdraw TX by burning shares (API-first with on-chain fallback).
   */
  async buildWithdraw(params: {
    vaultAddress: string;
    shares: string;
    from: string;
    slippageBps?: number;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    return this._withApiFallback(
      async () => {
        const res = await this.api.buildWithdrawShares(
          params.vaultAddress,
          this.config.network,
          {
            shares: Number(params.shares),
            caller: params.from,
            slippageBps: params.slippageBps,
          },
        );
        if (!res.xdr) throw new Error("API returned null XDR");
        return { xdr: res.xdr, estimatedFee: "0" };
      },
      async () => {
        if (BigInt(params.shares) <= 0n) throw new Error("Shares must be positive");
        const args = [buildScVal("i128", params.shares), buildScVal("address", params.from)];
        const result = await invokeContract(this.config, params.vaultAddress, "withdraw", args, params.from);
        return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
      },
      "buildWithdraw",
    );
  }

  /**
   * Build withdraw TX by specifying exact asset amounts (API only).
   */
  async buildWithdrawByAmounts(params: {
    vaultAddress: string;
    amounts: string[];
    from: string;
    slippageBps?: number;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    const res = await this.api.buildWithdraw(
      params.vaultAddress,
      this.config.network,
      {
        amounts: params.amounts.map(Number),
        caller: params.from,
        slippageBps: params.slippageBps,
      },
    );
    if (!res.xdr) throw new Error("API returned null XDR for withdraw-by-amounts");
    return { xdr: res.xdr, estimatedFee: "0" };
  }

  // ─── History & Performance ────────────────────────────────────

  /**
   * Get vault historical performance data (API only).
   */
  async getVaultHistory(
    address: string,
    params?: DefindexVaultHistoryParams,
  ): Promise<DefindexVaultHistory> {
    return this.api.getVaultHistory(address, this.config.network, params);
  }

  /**
   * Get account position performance in a vault (API only).
   */
  async getAccountPerformance(
    wallet: string,
    vault: string,
    params?: DefindexAccountPerformanceParams,
  ): Promise<DefindexAccountPerformance> {
    return this.api.getAccountPerformance(wallet, vault, this.config.network, params);
  }

  // ─── Yield Aggregator interface ────────────────────────────────

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    const vaults = await this.listVaults();
    const priceMap = await getAssetPriceMap();

    return vaults.map((v) => {
      // TVL from API is in stroops (7 decimals) — convert to USD
      let tvlUsd: string | null = null;
      if (v.tvl != null) {
        const tokenAmount = parseFloat(v.tvl) / 1e7;
        const sym = (v.asset ?? "").toUpperCase();
        const price = priceMap.get(sym);
        if (price != null) {
          tvlUsd = String(Math.round(tokenAmount * price));
        }
      }

      return {
        protocol: "defindex" as const,
        type: "vault" as const,
        name: v.name,
        symbol: v.symbol ?? "",
        assets: [v.asset],
        apy: { base: v.apy ?? null, reward: null, total: v.apy ?? null },
        tvl: tvlUsd,
        poolAddress: v.address,
        risk: "low" as const,
        status: v.status,
      };
    });
  }
}
