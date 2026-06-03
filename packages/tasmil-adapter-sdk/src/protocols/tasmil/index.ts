/**
 * Tasmil Protocol Adapter
 *
 * Adapter for Tasmil Finance's own managed-strategy system.
 * Uses the Tasmil backend REST API (port 6756) for all data.
 *
 * Usage: sdk.tasmil.getPresets(), sdk.tasmil.getAccountStatus(wallet)
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { TxBuildResult } from "../../types/common.js";
import { createLogger } from "../../utils/logger.js";
import { TasmilApiClient, TasmilApiError } from "./api-client.js";
import type {
  TasmilPreset,
  AccountStrategyStatus,
  PresetCardData,
} from "./types.js";

export type { TasmilPreset, AccountStrategyStatus, AccountPosition } from "./types.js";
export { TasmilApiClient, TasmilApiError } from "./api-client.js";

const log = createLogger("tasmil");

// ─── Risk mapping ──────────────────────────────────────────────────

const RISK_MAP: Record<string, "low" | "medium" | "high"> = {
  SAFE: "low",
  BALANCED: "medium",
  AGGRESSIVE: "high",
};

// ─── TasmilAdapter ──────────────────────────────────────────────────

export class TasmilAdapter {
  private readonly api: TasmilApiClient;
  private readonly network: string;

  constructor(private readonly config: TasmilClientConfig) {
    this.api = new TasmilApiClient(
      config.tasmilApiUrl ?? process.env["TASMIL_API_URL"],
      config.tasmilApiKey ?? process.env["TASMIL_API_KEY"],
    );
    this.network = config.network;
  }

  // ── Query: Presets ──────────────────────────────────────────────

  /**
   * Get the 3 strategy presets with live APY estimates from the backend.
   */
  async getPresets(asset?: string): Promise<TasmilPreset[]> {
    const raw = await this.api.getPresets(asset);
    return raw.map((p: PresetCardData) => ({
      name: p.name,
      estimatedApy: p.estimatedApy,
      poolCount: p.poolCount,
      poolTypes: p.poolTypes,
      risks: p.risks,
      topPools: (p.topPools ?? []).map((tp) => ({
        name: tp.name,
        apy: tp.apy,
        weightPercent: tp.weight,
      })),
    }));
  }

  // ── Query: Account Status ───────────────────────────────────────

  /**
   * Check if a wallet has a Tasmil smart account and return its status.
   * Returns null-like object with hasAccount=false when no account exists.
   */
  async getAccountStatus(walletAddress: string): Promise<AccountStrategyStatus> {
    try {
      const pos = await this.api.getAccountPosition(walletAddress);
      if (!pos) {
        return { hasAccount: false, nextStep: "deploy" };
      }

      const nextStep = deriveNextStep(pos.status, pos.sessionKeyStale);
      return {
        hasAccount: true,
        status: pos.status as AccountStrategyStatus["status"],
        preset: pos.preset as AccountStrategyStatus["preset"],
        baseAsset: pos.baseAsset,
        activeAssets: pos.activeAssets,
        totalValueUsd: pos.totalValueUsd,
        totalDepositedUsd: pos.totalDepositedUsd,
        currentApy: pos.currentApy,
        profitUsd: pos.profitUsd,
        profitPercent: pos.profitPercent,
        positions: (pos.positions ?? []).map((p) => ({
          poolName: p.poolName,
          protocol: p.protocol,
          valueUsd: p.valueUsd,
          apy: p.apy,
          allocationPercent: p.allocationPercent,
        })),
        nextStep,
      };
    } catch (err) {
      log.warn("getAccountStatus failed", { wallet: walletAddress.slice(0, 12), err: String(err) });
      return { hasAccount: false, nextStep: "deploy" };
    }
  }

  // ── Yield Aggregator Interface ──────────────────────────────────

  /**
   * Return Tasmil's 3 strategy presets as YieldOpportunity objects.
   * The yield aggregator scores these alongside Blend/Aquarius pools.
   */
  async getYieldOpportunities(assetFilter?: string): Promise<YieldOpportunity[]> {
    try {
      const presets = await this.getPresets(assetFilter);
      return presets.map((p) => ({
        protocol: "tasmil" as any, // ProtocolId union will be extended
        type: "vault" as const,
        name: `Tasmil ${p.name} · Auto-Rebalancing`,
        assets: assetFilter ? [assetFilter] : ["USDC"],
        apy: {
          base: p.estimatedApy,
          reward: null,
          total: p.estimatedApy,
        },
        tvl: null, // Backend doesn't expose aggregate TVL per preset
        poolAddress: `tasmil:preset:${p.name.toLowerCase()}:${(assetFilter ?? "usdc").toLowerCase()}`,
        risk: RISK_MAP[p.name] ?? "medium",
        status: "ok" as const,
        meta: {
          poolCount: p.poolCount,
          poolTypes: p.poolTypes,
          topPools: p.topPools,
          isTasmilManaged: true,
        },
      }));
    } catch (err) {
      log.warn("getYieldOpportunities failed", { err: String(err) });
      return [];
    }
  }

  // ── Execute: Deploy Account ─────────────────────────────────────

  async buildDeployAccount(ownerAddress: string): Promise<TxBuildResult> {
    const res = await this.api.buildDeploy(ownerAddress);
    return { xdr: res.xdr, estimatedFee: res.estimatedFee ?? "0.5" };
  }

  // ── Execute: Setup Account ──────────────────────────────────────

  async buildSetupAccount(ownerAddress: string): Promise<TxBuildResult> {
    const res = await this.api.buildSetup(ownerAddress);
    return { xdr: res.xdr, estimatedFee: res.estimatedFee ?? "0.3" };
  }

  // ── Execute: Fund Account ───────────────────────────────────────

  async buildFundAccount(
    ownerAddress: string,
    amount: string,
    token: string,
  ): Promise<TxBuildResult> {
    const res = await this.api.buildFund(ownerAddress, amount, token);
    return { xdr: res.xdr, estimatedFee: res.estimatedFee ?? "0.01" };
  }

  // ── Execute: Withdraw ───────────────────────────────────────────

  async buildWithdraw(
    ownerAddress: string,
    amount: string,
    token: string,
  ): Promise<TxBuildResult> {
    const res = await this.api.buildWithdraw(ownerAddress, amount, token);
    return { xdr: res.xdr, estimatedFee: res.estimatedFee ?? "0.01" };
  }

  // ── Config: Apply Preset ────────────────────────────────────────

  async applyPreset(
    walletAddress: string,
    preset: string,
  ): Promise<{ success: boolean }> {
    const res = await this.api.applyPreset(walletAddress, preset);
    return { success: res.success };
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Derive the next step in the account setup flow from the backend status.
 */
export function deriveNextStep(
  status: string,
  sessionKeyStale?: boolean,
): AccountStrategyStatus["nextStep"] {
  switch (status) {
    case "DEPLOYING":
      return sessionKeyStale ? "setup" : "setup";
    case "AWAITING_FUND":
      return "fund";
    case "ACTIVE":
      return "active";
    case "HALTED":
      return "halted";
    case "REVOKED":
      return "revoked";
    default:
      return "deploy";
  }
}
