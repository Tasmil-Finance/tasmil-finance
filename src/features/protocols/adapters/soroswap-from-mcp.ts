/**
 * Adapters that normalize Soroswap MCP tool results into typed card props.
 */

import type {
  SoroswapPoolCardProps,
  SoroswapQuoteCardProps,
  SoroswapPositionsCardProps,
  SoroswapTxCardProps,
} from "../schemas/soroswap.schema";
import { unwrapMcpResult } from "./from-mcp";
import {
  normalizeSoroswapPoolFromSdk,
  normalizeSoroswapPoolsFromSdk,
  normalizeSoroswapQuoteFromSdk,
  normalizeSoroswapPositionsFromSdk,
  normalizeSoroswapTxFromSdk,
} from "./soroswap-from-sdk";

export function normalizeSoroswapPoolFromMcp(result: unknown): SoroswapPoolCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeSoroswapPoolFromSdk(data);
}

export function normalizeSoroswapPoolsFromMcp(result: unknown): SoroswapPoolCardProps[] {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return [];
  return normalizeSoroswapPoolsFromSdk(data);
}

export function normalizeSoroswapQuoteFromMcp(result: unknown): SoroswapQuoteCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeSoroswapQuoteFromSdk(data);
}

export function normalizeSoroswapPositionsFromMcp(result: unknown): SoroswapPositionsCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  return normalizeSoroswapPositionsFromSdk(data);
}

export function normalizeSoroswapTxFromMcp(
  result: unknown,
  args?: Record<string, unknown>,
): SoroswapTxCardProps | null {
  const { data, error } = unwrapMcpResult(result);
  if (error || !data) return null;
  const merged = { ...data, ...(args ?? {}) } as Record<string, unknown>;
  return normalizeSoroswapTxFromSdk(merged);
}
