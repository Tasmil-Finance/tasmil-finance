/**
 * Adapters that normalize Soroswap SDK / API responses into typed card props.
 */

import {
  type SoroswapPoolCardProps,
  type SoroswapQuoteCardProps,
  type SoroswapPositionsCardProps,
  type SoroswapYieldCardProps,
  type SoroswapTxCardProps,
  soroswapPoolCardPropsSchema,
  soroswapQuoteCardPropsSchema,
  soroswapPositionsCardPropsSchema,
  soroswapTxCardPropsSchema,
} from "../schemas/soroswap.schema";

// ─── Helpers ───────────────────────────────────────────────────

function resolveSymbol(raw: string): string {
  if (!raw) return "?";
  if (raw === "native") return "XLM";
  if (raw.includes(":")) return raw.split(":")[0]!;
  // If it looks like a contract address (C..., 56 chars), truncate
  if (raw.length > 20 && raw.startsWith("C")) return `${raw.slice(0, 6)}...`;
  return raw;
}

function num(obj: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    if (obj[k] != null) {
      const n = Number(obj[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

// ─── Pool normalization ────────────────────────────────────────

export function normalizeSoroswapPoolFromSdk(raw: Record<string, unknown>): SoroswapPoolCardProps | null {
  const pool = (raw.pool ?? raw) as Record<string, unknown>;

  const tokenA = String(pool.tokenA ?? pool.token0 ?? "");
  const tokenB = String(pool.tokenB ?? pool.token1 ?? "");

  const fee = pool.fee != null
    ? Number(pool.fee) < 1
      ? `${(Number(pool.fee) * 100).toFixed(2)}%`
      : `${Number(pool.fee).toFixed(0)} bps`
    : pool.totalFeeBps != null
      ? `${Number(pool.totalFeeBps)} bps`
      : undefined;

  const result = soroswapPoolCardPropsSchema.safeParse({
    address: pool.address ?? undefined,
    tokenA: resolveSymbol(tokenA),
    tokenB: resolveSymbol(tokenB),
    tokenAAddress: pool.token0_address ?? (tokenA.startsWith("C") ? tokenA : undefined),
    tokenBAddress: pool.token1_address ?? (tokenB.startsWith("C") ? tokenB : undefined),
    reserveA: pool.reserveA ?? pool.reserve0 ?? null,
    reserveB: pool.reserveB ?? pool.reserve1 ?? null,
    tvl: num(pool, "tvlUsd", "tvl"),
    volume24h: num(pool, "volume_24h", "volume24h"),
    fee,
    feeBps: num(pool, "totalFeeBps", "feeBps"),
    protocol: pool.protocol ?? "soroswap",
    poolType: pool.poolType ?? pool.pool_type ?? undefined,
  });

  if (!result.success) {
    console.warn("[soroswap-from-sdk] pool normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

export function normalizeSoroswapPoolsFromSdk(raw: Record<string, unknown>): SoroswapPoolCardProps[] {
  const pools = (raw.pools ?? []) as Record<string, unknown>[];
  return pools
    .map((p) => normalizeSoroswapPoolFromSdk(p))
    .filter((p): p is SoroswapPoolCardProps => p !== null);
}

// ─── Quote normalization ───────────────────────────────────────

export function normalizeSoroswapQuoteFromSdk(raw: Record<string, unknown>): SoroswapQuoteCardProps | null {
  const q = (raw.quote ?? raw) as Record<string, unknown>;
  const result = soroswapQuoteCardPropsSchema.safeParse({
    amountIn: String(q.amountIn ?? q.amount_in ?? "0"),
    amountOut: String(q.amountOut ?? q.amount_out ?? "0"),
    fee: q.fee != null ? String(q.fee) : undefined,
    feePercent: q.feePercent ?? q.fee_percent ?? undefined,
    route: Array.isArray(q.route) ? q.route.map((r: unknown) => resolveSymbol(String(r))) : undefined,
    estimatedTime: q.estimatedTime ?? q.estimated_time ?? undefined,
    status: q.status ?? undefined,
    protocol: q.protocol ?? "soroswap",
  });

  if (!result.success) return null;
  return result.data;
}

// ─── Positions normalization ───────────────────────────────────

export function normalizeSoroswapPositionsFromSdk(
  raw: Record<string, unknown>,
): SoroswapPositionsCardProps | null {
  const positions = Array.isArray(raw.positions) ? raw.positions : [];
  const mapped = (positions as Record<string, unknown>[]).map((p) => ({
    poolAddress: String(p.poolAddress ?? p.pool_address ?? ""),
    protocol: p.protocol ?? "soroswap",
    tokenA: resolveSymbol(String(p.tokenA ?? p.token0 ?? "")),
    tokenB: resolveSymbol(String(p.tokenB ?? p.token1 ?? "")),
    liquidityTokens: p.liquidityTokens ?? p.liquidity_tokens ?? null,
    amountA: p.amountA ?? p.amount0 ?? null,
    amountB: p.amountB ?? p.amount1 ?? null,
    valueUsd: num(p as Record<string, unknown>, "valueUsd", "value_usd"),
  }));

  const result = soroswapPositionsCardPropsSchema.safeParse({
    hasPosition: mapped.length > 0,
    positions: mapped,
    totalValueUsd: num(raw, "totalValueUsd", "total_value_usd") ??
      (mapped.reduce((s, p) => s + (p.valueUsd ?? 0), 0) || null),
  });

  if (!result.success) return null;
  return result.data;
}

// ─── Yield normalization ───────────────────────────────────────

export function normalizeSoroswapYieldFromSdk(raw: Record<string, unknown>): SoroswapYieldCardProps[] {
  const opps = (raw.opportunities ?? raw.yields ?? []) as Record<string, unknown>[];
  return opps
    .map((opp) => {
      const apy = opp.apy as Record<string, unknown> | undefined;
      return {
        protocol: "soroswap" as const,
        type: "lp" as const,
        name: String(opp.name ?? ""),
        assets: Array.isArray(opp.assets) ? opp.assets.map((a: unknown) => resolveSymbol(String(a))) : [],
        apy: {
          base: apy?.base != null ? Number(apy.base) : null,
          reward: apy?.reward != null ? Number(apy.reward) : null,
          total: apy?.total != null ? Number(apy.total) : null,
        },
        tvl: opp.tvl != null ? String(opp.tvl) : null,
        poolAddress: opp.poolAddress != null ? String(opp.poolAddress) : opp.pool_address != null ? String(opp.pool_address) : undefined,
        risk: opp.risk != null ? String(opp.risk) : undefined,
        status: opp.status != null ? String(opp.status) : undefined,
        fee: opp.fee != null ? String(opp.fee) : undefined,
      } satisfies SoroswapYieldCardProps;
    });
}

// ─── Transaction normalization ─────────────────────────────────

export function normalizeSoroswapTxFromSdk(
  raw: Record<string, unknown>,
  form?: Record<string, string>,
): SoroswapTxCardProps | null {
  const merged = { ...raw, ...(form ?? {}) };
  const tx = (merged.transaction ?? merged) as Record<string, unknown>;
  const result = soroswapTxCardPropsSchema.safeParse({
    operation: String(merged.operation ?? "swap"),
    xdr: String(tx.xdr ?? merged.xdr ?? ""),
    estimatedFee: tx.estimatedFee ?? merged.estimatedFee ?? undefined,
    from: merged.from ?? merged.fromAddress ?? undefined,
    tokenIn: merged.tokenIn ?? merged.assetIn ?? undefined,
    tokenOut: merged.tokenOut ?? merged.assetOut ?? undefined,
    amount: merged.amount ?? undefined,
    amountA: merged.amountA ?? undefined,
    amountB: merged.amountB ?? undefined,
    assetA: merged.assetA ?? undefined,
    assetB: merged.assetB ?? undefined,
    route: Array.isArray(merged.route) ? merged.route.map(String) : undefined,
    context: merged.context ?? undefined,
  });

  if (!result.success) return null;
  return result.data;
}
