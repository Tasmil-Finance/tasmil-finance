/**
 * Stellar on-chain operations — execute swaps, submit transactions,
 * verify on-chain, and manage trustlines.
 *
 * Used by frontend API routes and MCP server alike.
 */

import type { TasmilClientConfig, TxSubmitResult } from "../types/common.js";
import { STELLAR_NETWORKS } from "../utils/network.js";
import { resolveAsset } from "../utils/asset-resolver.js";

// ─── Protocol → Soroswap API protocol filter ──────────────────────

const PROTOCOL_MAP: Record<string, string[]> = {
  soroswap: ["soroswap"],
  aquarius: ["aqua"],
  phoenix: ["phoenix"],
  sdex: ["sdex"],
};

// ─── StellarOperations ────────────────────────────────────────────

export class StellarOperations {
  private readonly horizonUrl: string;
  private readonly networkPassphrase: string;

  constructor(private readonly config: TasmilClientConfig) {
    const defaults = STELLAR_NETWORKS[config.network];
    this.horizonUrl = config.horizonUrl ?? defaults.horizonUrl;
    this.networkPassphrase = defaults.networkPassphrase;
  }

  // ── Submit signed XDR to Horizon ─────────────────────────────

  async submitTransaction(signedXdr: string): Promise<TxSubmitResult> {
    const res = await fetch(`${this.horizonUrl}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `tx=${encodeURIComponent(signedXdr)}`,
    });

    const data = (await res.json()) as Record<string, unknown>;

    if (!res.ok) {
      const extras = data.extras as Record<string, unknown> | undefined;
      const resultCodes = extras?.result_codes as Record<string, unknown> | undefined;
      const ops = resultCodes?.operations as string[] | undefined;
      const detail =
        ops?.join(", ") ||
        (resultCodes?.transaction as string) ||
        (data.detail as string) ||
        `Horizon error ${res.status}`;
      return { success: false, error: detail, hash: data.hash as string | undefined };
    }

    return { success: true, hash: data.hash as string };
  }

  // ── Verify transaction on-chain ──────────────────────────────

  async verifyTransaction(hash: string): Promise<{ successful: boolean; hash?: string; error?: string }> {
    const res = await fetch(`${this.horizonUrl}/transactions/${hash}`);
    if (!res.ok) {
      return { successful: false, error: `Transaction not found: ${res.status}` };
    }
    const data = (await res.json()) as Record<string, unknown>;
    return { successful: data.successful !== false, hash: data.hash as string };
  }

  // ── Check if trustline exists ────────────────────────────────

  async checkTrustline(address: string, assetCode: string): Promise<{ hasTrustline: boolean }> {
    if (assetCode === "XLM" || assetCode === "native") {
      return { hasTrustline: true };
    }

    try {
      const res = await fetch(`${this.horizonUrl}/accounts/${address}`);
      if (!res.ok) return { hasTrustline: false };

      const data = (await res.json()) as { balances?: { asset_code?: string }[] };
      const balances = data.balances ?? [];
      const has = balances.some(
        (b) => b.asset_code?.toUpperCase() === assetCode.toUpperCase(),
      );
      return { hasTrustline: has };
    } catch {
      return { hasTrustline: false };
    }
  }

  // ── Build trustline XDR ──────────────────────────────────────

  async buildTrustlineXdr(
    address: string,
    assetCode: string,
    assetIssuer?: string,
  ): Promise<{ xdr: string }> {
    // Resolve issuer from KNOWN_ASSETS (contracts.ts, network-aware) if not provided.
    // This centralises issuer data to a single source of truth, avoiding the
    // stale/invalid addresses that plagued the old hardcoded KNOWN_ISSUERS map.
    let issuer = assetIssuer || "";
    if (!issuer) {
      const classic = resolveAsset(assetCode, "classic", this.config.network);
      if (classic && classic.includes(":")) {
        const parts = classic.split(":");
        issuer = parts[1]!;
      }
    }
    if (!issuer) {
      throw new Error(`Cannot resolve issuer for ${assetCode}. Provide assetIssuer explicitly or ensure ${assetCode} is in KNOWN_ASSETS.`);
    }
    if (!issuer.startsWith("G") || issuer.length !== 56) {
      throw new Error(`Invalid issuer address for ${assetCode}: "${issuer}" (${issuer.length} chars, expected 56)`);
    }

    const { Horizon, TransactionBuilder, Operation, Asset } = await import(
      "@stellar/stellar-sdk"
    );
    const server = new Horizon.Server(this.horizonUrl);
    const account = await server.loadAccount(address);

    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({ asset: new Asset(assetCode, issuer) }),
      )
      .setTimeout(300)
      .build();

    return { xdr: tx.toXDR() };
  }
}
