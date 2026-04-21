/**
 * Adapters that normalize SDK API responses (from /api/allbridge/*) into typed card props.
 */

import {
  type AllbridgePoolCardProps,
  type AllbridgePoolInfoProps,
  type AllbridgeUserBalanceProps,
  type AllbridgeQuoteCardProps,
  type AllbridgeRoute,
  type AllbridgeDepositQuoteProps,
  type AllbridgeWithdrawQuoteProps,
  type AllbridgeSupportedChain,
  allbridgePoolCardPropsSchema,
  allbridgePoolInfoSchema,
  allbridgeUserBalanceSchema,
  allbridgeQuoteCardPropsSchema,
  allbridgeRouteSchema,
  allbridgeDepositQuoteSchema,
  allbridgeWithdrawQuoteSchema,
  allbridgeSupportedChainSchema,
} from "../schemas/allbridge.schema";

// ─── Pools normalization ──────────────────────────────────────────

export function normalizeAllbridgePoolsFromSdk(raw: Record<string, unknown>): AllbridgePoolCardProps[] {
  const pools = (raw.pools ?? []) as Record<string, unknown>[];
  return pools
    .map((p) => {
      const result = allbridgePoolCardPropsSchema.safeParse(p);
      if (!result.success) {
        console.warn("[allbridge-from-sdk] pool normalization errors:", result.error.flatten());
        return null;
      }
      return result.data;
    })
    .filter((p): p is AllbridgePoolCardProps => p !== null);
}

// ─── Pool Info normalization ──────────────────────────────────────

export function normalizeAllbridgePoolInfoFromSdk(raw: Record<string, unknown>): AllbridgePoolInfoProps | null {
  const result = allbridgePoolInfoSchema.safeParse(raw);
  if (!result.success) {
    console.warn("[allbridge-from-sdk] pool info errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── User Balance normalization ───────────────────────────────────

export function normalizeAllbridgeUserBalanceFromSdk(raw: Record<string, unknown>): AllbridgeUserBalanceProps | null {
  const result = allbridgeUserBalanceSchema.safeParse(raw);
  if (!result.success) {
    console.warn("[allbridge-from-sdk] user balance errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Quote normalization ──────────────────────────────────────────

export function normalizeAllbridgeQuoteFromSdk(raw: Record<string, unknown>): AllbridgeQuoteCardProps | null {
  const quote = (raw.quote ?? raw) as Record<string, unknown>;
  const result = allbridgeQuoteCardPropsSchema.safeParse(quote);
  if (!result.success) {
    console.warn("[allbridge-from-sdk] quote errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Routes normalization ─────────────────────────────────────────

export function normalizeAllbridgeRoutesFromSdk(raw: Record<string, unknown>): AllbridgeRoute[] {
  const routes = (raw.routes ?? []) as Record<string, unknown>[];
  return routes
    .map((r) => {
      const result = allbridgeRouteSchema.safeParse(r);
      return result.success ? result.data : null;
    })
    .filter((r): r is AllbridgeRoute => r !== null);
}

// ─── Deposit Quote normalization ──────────────────────────────────

export function normalizeAllbridgeDepositQuoteFromSdk(raw: Record<string, unknown>): AllbridgeDepositQuoteProps | null {
  const result = allbridgeDepositQuoteSchema.safeParse(raw);
  if (!result.success) {
    console.warn("[allbridge-from-sdk] deposit quote errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Withdraw Quote normalization ─────────────────────────────────

export function normalizeAllbridgeWithdrawQuoteFromSdk(raw: Record<string, unknown>): AllbridgeWithdrawQuoteProps | null {
  const result = allbridgeWithdrawQuoteSchema.safeParse(raw);
  if (!result.success) {
    console.warn("[allbridge-from-sdk] withdraw quote errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Supported Chains normalization ───────────────────────────────

export function normalizeAllbridgeSupportedChainsFromSdk(raw: Record<string, unknown>): AllbridgeSupportedChain[] {
  const chains = (raw.chains ?? []) as Record<string, unknown>[];
  return chains
    .map((c) => {
      const result = allbridgeSupportedChainSchema.safeParse(c);
      return result.success ? result.data : null;
    })
    .filter((c): c is AllbridgeSupportedChain => c !== null);
}
