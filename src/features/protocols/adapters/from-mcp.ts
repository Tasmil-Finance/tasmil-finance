/**
 * Adapters that normalize MCP tool results into typed card props.
 * Handles the [{type:"text", text:"JSON"}] unwrapping pattern.
 */

import type {
  PoolCardProps,
  ReserveCardProps,
  PositionsCardProps,
  TxCardProps,
  BackstopCardProps,
  BackstopBalanceCardProps,
} from "../schemas/blend.schema";
import {
  normalizePoolFromSdk,
  normalizePoolsFromSdk,
  normalizeReserveFromSdk,
  normalizePositionsFromSdk,
  normalizeTxFromSdk,
  normalizeBackstopFromSdk,
  normalizeBackstopBalanceFromSdk,
} from "./from-sdk";

// ─── MCP result unwrapping ──────────────────────────────────────

/**
 * Unwrap MCP tool result from various formats:
 * - Array: [{type:"text", text:"JSON string"}]
 * - String: raw JSON string
 * - Object: already parsed
 */
export function unwrapMcpResult<T = Record<string, unknown>>(
  result: unknown,
): { data: T | null; error: string | null } {
  let parsed: unknown = result;

  // Handle MCP array format: [{type:"text", text: "..."}]
  if (Array.isArray(result)) {
    const textBlock = (result as Array<{ type?: string; text?: string }>).find(
      (b) => b?.type === "text" && typeof b?.text === "string",
    );
    if (textBlock?.text) {
      try {
        parsed = JSON.parse(textBlock.text);
      } catch {
        parsed = textBlock.text;
      }
    }
  }

  // Handle raw JSON string
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return { data: null, error: String(parsed) };
    }
  }

  // Check for error responses
  const obj = parsed as Record<string, unknown> | null;
  if (obj && (obj.success === false || obj.error != null)) {
    return {
      data: null,
      error: String(obj.error ?? obj.message ?? "Operation failed"),
    };
  }

  return { data: (obj?.data ?? obj) as T, error: null };
}

// ─── MCP APY conversion ────────────────────────────────────────
// MCP returns APY as percentages (0.16 = 0.16%) but SDK normalizers
// + pct() display expect raw decimals (0.001 = 0.10%).
// Convert: if all APY values in a reserve are < 50, they're already
// percentage format → divide by 100 to get decimal.

const APY_FIELDS = ["supplyApy", "borrowApy", "supplyEmissionApy", "borrowEmissionApy"] as const;

function convertMcpApyToDecimal(reserve: Record<string, unknown>): Record<string, unknown> {
  const out = { ...reserve };
  for (const key of APY_FIELDS) {
    const v = out[key];
    if (typeof v === "number" && v !== 0) {
      // MCP percentages: 0.16 means 0.16%. SDK decimals: 0.0016 means 0.16%.
      // Heuristic: if value is between 0.001 and 99, it's likely a percentage → /100
      // If it's already < 0.001 (like SDK's 0.0010), it's already decimal
      if (v >= 0.01 && v < 100) {
        out[key] = v / 100;
      }
    }
  }
  return out;
}

function convertMcpPoolReserves(data: Record<string, unknown>): Record<string, unknown> {
  // Convert reserves APY in pool data
  const pool = (data.pool ?? data) as Record<string, unknown>;
  if (pool.reserves && Array.isArray(pool.reserves)) {
    pool.reserves = (pool.reserves as Record<string, unknown>[]).map(convertMcpApyToDecimal);
  }
  // Handle pools array (resolve_pool returns multiple)
  if (data.pools && Array.isArray(data.pools)) {
    data.pools = (data.pools as Record<string, unknown>[]).map((p) => {
      if (p.reserves && Array.isArray(p.reserves)) {
        return { ...p, reserves: (p.reserves as Record<string, unknown>[]).map(convertMcpApyToDecimal) };
      }
      return p;
    });
  }
  return data;
}

// ─── Pool ──────────────────────────────────────────────────────

export function normalizePoolFromMcp(result: unknown): PoolCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizePoolFromSdk(convertMcpPoolReserves(data));
}

export function normalizePoolsFromMcp(result: unknown): PoolCardProps[] {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return [];
  return normalizePoolsFromSdk(convertMcpPoolReserves(data));
}

// ─── Reserve ───────────────────────────────────────────────────

export function normalizeReserveFromMcp(result: unknown): ReserveCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  // Convert single reserve APY
  const reserve = (data as Record<string, unknown>).reserve ?? data;
  const converted = { ...data as Record<string, unknown>, reserve: convertMcpApyToDecimal(reserve as Record<string, unknown>) };
  return normalizeReserveFromSdk(converted);
}

// ─── Positions ──────────��───────────────────────────────────────

export function normalizePositionsFromMcp(result: unknown): PositionsCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizePositionsFromSdk(data);
}

// ─── Transaction ───────────���────────────────────────────────────

export function normalizeTxFromMcp(
  result: unknown,
  args?: Record<string, unknown>,
): TxCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;

  // Merge args (tool call arguments) into the data for form fields
  const merged = { ...data, ...(args ?? {}) } as Record<string, unknown>;
  return normalizeTxFromSdk(merged);
}

// ─── Backstop ───────────��───────────────────────────────���───────

export function normalizeBackstopFromMcp(result: unknown): BackstopCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeBackstopFromSdk(data);
}

// ─── Backstop Balance ──────────────────────────────────────────

export function normalizeBackstopBalanceFromMcp(result: unknown): BackstopBalanceCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeBackstopBalanceFromSdk(data);
}
