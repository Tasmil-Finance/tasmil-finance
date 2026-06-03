/**
 * DeFindex REST API Client
 *
 * HTTP client for the DeFindex API at https://api.defindex.io.
 * Uses native fetch (Node 18+), no external dependencies.
 */

import type { StellarNetwork } from "../../types/common.js";
import type {
  DefindexVaultDetail,
  DefindexUserBalance,
  DefindexVaultHistoryParams,
  DefindexVaultHistory,
  DefindexAccountPerformanceParams,
  DefindexAccountPerformance,
} from "./types.js";

// ─── API Response Types ──────────────────────────────────────────

export interface DefindexApiDiscoverVault {
  address: string;
  apy: number | null;
  totalManagedFunds: Array<{ asset: string; total_amount: string }> | null;
}

export interface DefindexApiDiscoverResponse {
  totalVaults: number;
  vaults: DefindexApiDiscoverVault[];
}

export interface DefindexApiTxResponse {
  xdr: string | null;
  simulationResponse: unknown;
  operationXDR?: string;
  isSmartWallet?: boolean;
}

export interface DefindexApiApyResponse {
  apy: number;
}

// ─── Error ───────────────────────────────────────────────────────

export class DefindexApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "DefindexApiError";
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

// ─── Client ──────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "https://api.defindex.io";
const FRONTEND_API_URL = "https://www.defindex.io/api";
const DEFAULT_TIMEOUT = 15_000;

export class DefindexApiClient {
  private readonly baseUrl: string;
  private readonly frontendUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;

  constructor(baseUrl?: string, apiKey?: string, timeoutMs?: number) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.frontendUrl = FRONTEND_API_URL;
    this.apiKey = apiKey || undefined;
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT;
  }

  // ── Internal fetch helper ──────────────────────────────────────

  private async _fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options?.headers as Record<string, string> ?? {}) },
        signal: controller.signal,
      });

      if (!res.ok) {
        let body: unknown;
        try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
        throw new DefindexApiError(
          `DeFindex API ${res.status}: ${typeof body === "object" && body !== null && "message" in body ? (body as any).message : res.statusText}`,
          res.status,
          body,
        );
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof DefindexApiError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new DefindexApiError(`DeFindex API timeout after ${this.timeoutMs}ms`, 0, null);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private _qs(network: StellarNetwork, extra?: Record<string, string | undefined>): string {
    const params = new URLSearchParams({ network });
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (v !== undefined) params.set(k, v);
      }
    }
    return params.toString();
  }

  // ── Discovery ──────────────────────────────────────────────────

  async discover(network: StellarNetwork): Promise<DefindexApiDiscoverResponse> {
    return this._fetch(`/vault/discover?${this._qs(network)}`);
  }

  // ── Vault Info ─────────────────────────────────────────────────

  async getVaultInfo(address: string, network: StellarNetwork): Promise<DefindexVaultDetail> {
    // Try the authenticated API first, then fall back to the DeFindex frontend API
    try {
      const raw = await this._fetch<any>(`/vault/${address}?${this._qs(network)}`);
      return this._parseVaultDetail(address, raw);
    } catch (err) {
      // Fall back to www.defindex.io/api/vaultInfo (uses vaultId header, response in {data:...})
      return this._getVaultInfoFromFrontend(address, network);
    }
  }

  private async _getVaultInfoFromFrontend(
    address: string,
    network: StellarNetwork,
  ): Promise<DefindexVaultDetail> {
    const url = `${this.frontendUrl}/vaultInfo?network=${network}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json", vaultId: address },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new DefindexApiError(`DeFindex frontend API ${res.status}`, res.status, null);
      }
      const json = (await res.json()) as any;
      const raw = json.data ?? json;
      return this._parseVaultDetail(address, raw);
    } catch (err) {
      if (err instanceof DefindexApiError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new DefindexApiError(`DeFindex frontend API timeout`, 0, null);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  private _parseVaultDetail(address: string, raw: any): DefindexVaultDetail {
    return {
      address,
      name: raw.name ?? "",
      symbol: raw.symbol ?? "",
      roles: raw.roles ?? { manager: "", emergencyManager: "", rebalanceManager: "", feeReceiver: "" },
      assets: raw.assets ?? [],
      totalManagedFunds: raw.totalManagedFunds ?? [],
      feesBps: raw.feesBps ?? { vaultFee: 0, defindexFee: 0 },
      apy: raw.apy ?? null,
      status: "ok",
    };
  }

  // ── Balance ────────────────────────────────────────────────────

  async getVaultBalance(
    address: string,
    user: string,
    network: StellarNetwork,
  ): Promise<DefindexUserBalance> {
    const raw = await this._fetch<any>(
      `/vault/${address}/balance?${this._qs(network, { from: user })}`,
    );
    return {
      dfTokens: String(raw.dfTokens ?? "0"),
      underlyingBalance: raw.underlyingBalance ?? [],
    };
  }

  // ── APY ────────────────────────────────────────────────────────

  async getVaultApy(address: string, network: StellarNetwork): Promise<DefindexApiApyResponse> {
    return this._fetch(`/vault/${address}/apy?${this._qs(network)}`);
  }

  // ── Transaction Building ───────────────────────────────────────

  async buildDeposit(
    address: string,
    network: StellarNetwork,
    body: { amounts: number[]; caller: string; slippageBps?: number; invest?: boolean },
  ): Promise<DefindexApiTxResponse> {
    return this._fetch(`/vault/${address}/deposit?${this._qs(network)}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async buildWithdraw(
    address: string,
    network: StellarNetwork,
    body: { amounts: number[]; caller: string; slippageBps?: number },
  ): Promise<DefindexApiTxResponse> {
    return this._fetch(`/vault/${address}/withdraw?${this._qs(network)}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async buildWithdrawShares(
    address: string,
    network: StellarNetwork,
    body: { shares: number; caller: string; slippageBps?: number },
  ): Promise<DefindexApiTxResponse> {
    return this._fetch(`/vault/${address}/withdraw-shares?${this._qs(network)}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  // ── History & Performance ──────────────────────────────────────

  async getVaultHistory(
    address: string,
    network: StellarNetwork,
    params?: DefindexVaultHistoryParams,
  ): Promise<DefindexVaultHistory> {
    const extra: Record<string, string | undefined> = {
      period: params?.period,
      interval: params?.interval,
      startDate: params?.startDate,
      endDate: params?.endDate,
    };
    return this._fetch(`/vault/${address}/history?${this._qs(network, extra)}`);
  }

  async getAccountPerformance(
    wallet: string,
    vault: string,
    network: StellarNetwork,
    params?: DefindexAccountPerformanceParams,
  ): Promise<DefindexAccountPerformance> {
    const extra: Record<string, string | undefined> = {
      interval: params?.interval,
      startDate: params?.startDate,
      endDate: params?.endDate,
      includeEvents: params?.includeEvents != null ? String(params.includeEvents) : undefined,
    };
    return this._fetch(`/account/${wallet}/vault/${vault}?${this._qs(network, extra)}`);
  }
}
