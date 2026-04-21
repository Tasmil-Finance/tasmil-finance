/**
 * Adapters that normalize MCP tool results into typed card props for Allbridge.
 * MCP results are wrapped differently than SDK — unwrap and delegate to SDK adapter.
 */

import type {
  AllbridgePoolCardProps,
  AllbridgePoolInfoProps,
  AllbridgeUserBalanceProps,
  AllbridgeQuoteCardProps,
  AllbridgeRoute,
  AllbridgeTxCardProps,
} from "../schemas/allbridge.schema";
import {
  normalizeAllbridgePoolsFromSdk,
  normalizeAllbridgePoolInfoFromSdk,
  normalizeAllbridgeUserBalanceFromSdk,
  normalizeAllbridgeQuoteFromSdk,
  normalizeAllbridgeRoutesFromSdk,
} from "./allbridge-from-sdk";

function extractMcpContent(result: unknown): Record<string, unknown> {
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    // MCP wraps in content[0].text
    if (Array.isArray(r.content)) {
      const text = (r.content[0] as any)?.text;
      if (typeof text === "string") {
        try { return JSON.parse(text); } catch { /* fallthrough */ }
      }
    }
    return r;
  }
  return {};
}

export function normalizeAllbridgePoolsFromMcp(result: unknown): AllbridgePoolCardProps[] {
  return normalizeAllbridgePoolsFromSdk(extractMcpContent(result));
}

export function normalizeAllbridgePoolInfoFromMcp(result: unknown): AllbridgePoolInfoProps | null {
  return normalizeAllbridgePoolInfoFromSdk(extractMcpContent(result));
}

export function normalizeAllbridgeUserBalanceFromMcp(result: unknown): AllbridgeUserBalanceProps | null {
  return normalizeAllbridgeUserBalanceFromSdk(extractMcpContent(result));
}

export function normalizeAllbridgeQuoteFromMcp(result: unknown): AllbridgeQuoteCardProps | null {
  return normalizeAllbridgeQuoteFromSdk(extractMcpContent(result));
}

export function normalizeAllbridgeRoutesFromMcp(result: unknown): AllbridgeRoute[] {
  return normalizeAllbridgeRoutesFromSdk(extractMcpContent(result));
}

export function normalizeAllbridgeTxFromMcp(result: unknown, args?: Record<string, unknown>): AllbridgeTxCardProps | null {
  const data = { ...extractMcpContent(result), ...(args ?? {}) };
  return {
    operation: String(data.operation ?? ""),
    xdr: data.xdr != null ? String(data.xdr) : null,
    transaction: data.transaction,
    chain: data.chain != null ? String(data.chain) : undefined,
    symbol: data.symbol != null ? String(data.symbol) : undefined,
    amount: data.amount != null ? String(data.amount) : undefined,
    fromChain: data.fromChain != null ? String(data.fromChain) : undefined,
    toChain: data.toChain != null ? String(data.toChain) : undefined,
    asset: data.asset != null ? String(data.asset) : undefined,
    fromAddress: data.fromAddress != null ? String(data.fromAddress) : undefined,
    toAddress: data.toAddress != null ? String(data.toAddress) : undefined,
    poolAddress: data.poolAddress != null ? String(data.poolAddress) : undefined,
    provider: data.provider != null ? String(data.provider) : undefined,
    earnedRewards: data.earnedRewards != null ? String(data.earnedRewards) : undefined,
    note: data.note != null ? String(data.note) : undefined,
  };
}
