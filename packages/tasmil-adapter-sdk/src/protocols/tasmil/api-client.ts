/**
 * Tasmil Backend REST API Client
 *
 * HTTP client for the Tasmil Finance backend (NestJS, port 6756).
 * Uses native fetch (Node 18+), no external dependencies.
 *
 * Backend wraps all responses in {success: boolean, data: T}.
 * This client unwraps the envelope transparently.
 */

import type { StellarNetwork } from "../../types/common.js";
import type {
  BackendEnvelope,
  PresetCardData,
  PositionResponse,
  BackendTxResponse,
  BackendPresetResponse,
} from "./types.js";

// ─── Error ──────────────────────────────────────────────────────────

export class TasmilApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "TasmilApiError";
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 429;
  }
}

// ─── Client ─────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = "http://localhost:6756";
const DEFAULT_TIMEOUT = 15_000;

export class TasmilApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly timeoutMs: number;

  constructor(baseUrl?: string, apiKey?: string, timeoutMs?: number) {
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.apiKey = apiKey || undefined;
    this.timeoutMs = timeoutMs ?? DEFAULT_TIMEOUT;
  }

  // ── Internal fetch helper ─────────────────────────────────────────

  /**
   * Fetch from the Tasmil backend, unwrapping the {success, data} envelope.
   * On success returns `data` directly.  On failure throws TasmilApiError.
   */
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
        throw new TasmilApiError(
          `Tasmil API ${res.status}: ${
            typeof body === "object" && body !== null && "message" in body
              ? (body as any).message
              : res.statusText
          }`,
          res.status,
          body,
        );
      }

      const json = (await res.json()) as BackendEnvelope<T>;

      // Backend TransformInterceptor wraps all successes in {success: true, data: ...}
      if (json && typeof json === "object" && "success" in json && json.success === true) {
        return (json.data ?? (json as unknown as T)) as T;
      }

      // If the backend returned an error envelope
      if (json && typeof json === "object" && "success" in json && json.success === false) {
        throw new TasmilApiError(
          (json as any).message ?? "Backend returned failure",
          (json as any).statusCode ?? 500,
          json,
        );
      }

      // Fallback — return raw response (endpoint may not use envelope)
      return json as unknown as T;
    } catch (err) {
      if (err instanceof TasmilApiError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new TasmilApiError(`Tasmil API timeout after ${this.timeoutMs}ms`, 0, null);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Query: Presets ────────────────────────────────────────────────

  /**
   * Get the 3 strategy presets with live APY data.
   * GET /api/account/presets?baseAsset=USDC
   * Public endpoint — no auth required.
   */
  async getPresets(asset?: string): Promise<PresetCardData[]> {
    const params = asset ? `?baseAsset=${encodeURIComponent(asset)}` : "";
    return this._fetch<PresetCardData[]>(`/api/account/presets${params}`);
  }

  // ── Query: Account Position ───────────────────────────────────────

  /**
   * Get account position, P&L, and strategy status.
   * GET /api/account/position/:publicKey
   * Requires auth (JWT or API key).
   */
  async getAccountPosition(publicKey: string): Promise<PositionResponse | null> {
    try {
      return await this._fetch<PositionResponse>(`/api/account/position/${publicKey}`);
    } catch (err) {
      // 404 means no account yet — not an error
      if (err instanceof TasmilApiError && err.status === 404) return null;
      throw err;
    }
  }

  // ── Execute: Deploy ───────────────────────────────────────────────

  /**
   * Build unsigned deploy-keeper-wallet transaction.
   * POST /api/account/deploy  body: {publicKey}
   * Requires auth.
   */
  async buildDeploy(publicKey: string): Promise<BackendTxResponse> {
    return this._fetch<BackendTxResponse>("/api/account/deploy", {
      method: "POST",
      body: JSON.stringify({ publicKey }),
    });
  }

  // ── Execute: Setup ────────────────────────────────────────────────

  /**
   * Build unsigned setup TXs for session key registration.
   * POST /api/account/setup  body: {publicKey}
   * Requires auth.
   */
  async buildSetup(publicKey: string): Promise<BackendTxResponse> {
    return this._fetch<BackendTxResponse>("/api/account/setup", {
      method: "POST",
      body: JSON.stringify({ publicKey }),
    });
  }

  // ── Execute: Fund ─────────────────────────────────────────────────

  /**
   * Build unsigned fund transaction to keeper wallet.
   * POST /api/account/fund  body: {publicKey, amount, token}
   * Requires auth.
   */
  async buildFund(
    publicKey: string,
    amount: string,
    token: string,
  ): Promise<BackendTxResponse> {
    return this._fetch<BackendTxResponse>("/api/account/fund", {
      method: "POST",
      body: JSON.stringify({ publicKey, amount, token }),
    });
  }

  // ── Execute: Withdraw ─────────────────────────────────────────────

  /**
   * Build unsigned withdraw transaction from keeper wallet.
   * POST /api/account/withdraw  body: {publicKey, amount, token}
   * Requires auth.
   */
  async buildWithdraw(
    publicKey: string,
    amount: string,
    token: string,
  ): Promise<BackendTxResponse> {
    return this._fetch<BackendTxResponse>("/api/account/withdraw", {
      method: "POST",
      body: JSON.stringify({ publicKey, amount, token }),
    });
  }

  // ── Execute: Submit TX ────────────────────────────────────────────

  /**
   * Submit a signed transaction to Stellar via the backend.
   * POST /api/account/submit  body: {publicKey, signedXdr}
   * Requires auth.
   */
  async submitTx(publicKey: string, signedXdr: string): Promise<{ hash: string }> {
    return this._fetch<{ hash: string }>("/api/account/submit", {
      method: "POST",
      body: JSON.stringify({ publicKey, signedXdr }),
    });
  }

  // ── Config: Preset ────────────────────────────────────────────────

  /**
   * Update risk preset for a managed account.
   * PUT /api/account/preset/:publicKey  body: {preset}
   * Requires auth.
   */
  async applyPreset(
    publicKey: string,
    preset: string,
  ): Promise<BackendPresetResponse> {
    return this._fetch<BackendPresetResponse>(`/api/account/preset/${publicKey}`, {
      method: "PUT",
      body: JSON.stringify({ preset }),
    });
  }
}
