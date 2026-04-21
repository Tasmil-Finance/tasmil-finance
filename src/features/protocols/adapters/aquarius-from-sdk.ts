/**
 * Adapters that normalize Aquarius SDK / API responses into typed card props.
 * Handles field name variations across SDK and raw API responses.
 */

import {
  type AquaPoolCardProps,
  type AquaQuoteCardProps,
  type AquaPositionsCardProps,
  type AquaYieldCardProps,
  type AquaTxCardProps,
  aquaPoolCardPropsSchema,
  aquaQuoteCardPropsSchema,
  aquaPositionsCardPropsSchema,
  aquaYieldCardPropsSchema,
  aquaTxCardPropsSchema,
} from "../schemas/aquarius.schema";

// ─── Pool normalization ────────────────────────────────────────

/**
 * Parse Stellar classic asset format to clean symbol.
 * "USDC:GAHPYWLK6YRN7..." → "USDC"
 * "native" → "XLM"
 * "Time Rebased Token" → "Time Rebased Token"
 */
function parseTokenSymbol(raw: string): string {
  if (raw === "native") return "XLM";
  // Classic format: "CODE:ISSUER..."
  const colonIdx = raw.indexOf(":");
  if (colonIdx > 0 && colonIdx <= 12) return raw.slice(0, colonIdx);
  return raw;
}

function normalizeTokensStr(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((s) => parseTokenSymbol(String(s)));
  if (typeof raw === "string") return raw.split("-").map(parseTokenSymbol);
  return [];
}

/**
 * Build tokens array from tokens_addresses + tokens_str (raw API shape).
 * If `tokens` array with symbol already exists (enriched SDK shape), use that.
 */
function buildTokens(pool: Record<string, unknown>): Array<{ address: string; symbol?: string }> | undefined {
  // Already enriched with symbols
  if (Array.isArray(pool.tokens)) {
    return (pool.tokens as Array<Record<string, unknown>>).map((t) => ({
      address: String(t.address ?? ""),
      symbol: t.symbol != null ? String(t.symbol) : undefined,
    }));
  }
  // Raw API: build from tokens_addresses + tokens_str
  const addresses = pool.tokens_addresses ?? pool.tokensAddresses;
  const strs = pool.tokens_str ?? pool.tokensStr;
  if (Array.isArray(addresses) && Array.isArray(strs)) {
    return (addresses as string[]).map((addr, i) => ({
      address: String(addr),
      symbol: parseTokenSymbol(String((strs as string[])[i] ?? "")),
    }));
  }
  return undefined;
}

/**
 * Resolve a numeric field from multiple possible source names.
 * Aquarius /pools/ API uses: liquidity_usd, volume_usd, apy, rewards_apy, total_apy
 * SDK/external API uses: total_value_locked, volume_24h, fee_apy, reward_apy
 */
function num(pool: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    if (pool[k] != null) {
      const n = Number(pool[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

export function normalizeAquaPoolFromSdk(raw: Record<string, unknown>): AquaPoolCardProps | null {
  const pool = (raw.pool ?? raw) as Record<string, unknown>;

  // APY: /pools/ API has apy (fee), rewards_apy, total_apy as decimals (0.0016 = 0.16%)
  //      Multiply by 100 to get percentage for display
  const rawFeeApy = num(pool, "apy", "fee_apy", "feeApy");
  const rawRewardsApy = num(pool, "rewards_apy", "reward_apy", "rewardApy");
  const rawTotalApy = num(pool, "total_apy", "totalApy");

  // Detect if values are in decimal (< 1) or already percentage (> 1)
  const feeApy = rawFeeApy != null ? (rawFeeApy < 1 ? rawFeeApy * 100 : rawFeeApy) : null;
  const rewardApy = rawRewardsApy != null ? (rawRewardsApy < 1 ? rawRewardsApy * 100 : rawRewardsApy) : null;
  const totalApy = rawTotalApy != null
    ? (rawTotalApy < 1 ? rawTotalApy * 100 : rawTotalApy)
    : feeApy != null || rewardApy != null
      ? (feeApy ?? 0) + (rewardApy ?? 0)
      : null;

  // TVL & Volume: /pools/ API returns liquidity_usd and volume_usd in stroops (7 decimals).
  // Divide by 1e7 to get actual USD.
  const rawTvl = num(pool, "liquidity_usd");
  const tvl = rawTvl != null
    ? rawTvl / 1e7
    : num(pool, "total_value_locked", "tvl");

  const rawVolume = num(pool, "volume_usd");
  const volume24h = rawVolume != null
    ? rawVolume / 1e7
    : num(pool, "volume_24h", "volume24h");

  const tokens = buildTokens(pool);
  const tokensStr = normalizeTokensStr(pool.tokens_str ?? pool.tokensStr);

  // Fee rate as percentage string (e.g. "0.0030" → "0.30%")
  const feeRaw = pool.fee;
  const feeDisplay = feeRaw != null
    ? `${(Number(feeRaw) * 100).toFixed(2)}%`
    : undefined;

  const result = aquaPoolCardPropsSchema.safeParse({
    address: String(pool.address ?? ""),
    poolType: pool.pool_type ?? pool.poolType ?? undefined,
    tokens,
    tokensStr,
    fee: feeDisplay,
    tvl,
    volume24h,
    feeApy,
    rewardApy,
    totalApy,
  });

  if (!result.success) {
    console.warn("[aquarius-from-sdk] pool normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

export function normalizeAquaPoolsFromSdk(raw: Record<string, unknown>): AquaPoolCardProps[] {
  const pools = (raw.pools ?? []) as Record<string, unknown>[];
  return pools
    .map((p) => normalizeAquaPoolFromSdk(p))
    .filter((p): p is AquaPoolCardProps => p !== null);
}

// ─── Quote normalization ───────────────────────────────────────

export function normalizeAquaQuoteFromSdk(raw: Record<string, unknown>): AquaQuoteCardProps | null {
  const q = (raw.quote ?? raw) as Record<string, unknown>;
  const result = aquaQuoteCardPropsSchema.safeParse({
    protocol: "aquarius",
    amountIn: String(q.amountIn ?? q.amount_in ?? "0"),
    amountOut: String(q.amountOut ?? q.amount_out ?? q.amount ?? "0"),
    fee: q.fee != null ? String(q.fee) : undefined,
    feePercent: q.feePercent ?? q.fee_percent ?? undefined,
    route: Array.isArray(q.route) ? q.route.map(String) : undefined,
    estimatedTime: q.estimatedTime ?? q.estimated_time ?? undefined,
    status: q.status ?? undefined,
  });

  if (!result.success) {
    console.warn("[aquarius-from-sdk] quote normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Positions normalization ───────────────────────────────────

export function normalizeAquaPositionsFromSdk(
  raw: Record<string, unknown>,
): AquaPositionsCardProps | null {
  const result = aquaPositionsCardPropsSchema.safeParse({
    hasPosition: raw.hasPosition ?? (Array.isArray(raw.positions) && raw.positions.length > 0),
    positions: Array.isArray(raw.positions)
      ? (raw.positions as Record<string, unknown>[]).map((p) => ({
          poolAddress: String(p.poolAddress ?? p.pool_address ?? ""),
          tokens: Array.isArray(p.tokens) ? p.tokens.map(String) : undefined,
          tokensStr: normalizeTokensStr(p.tokens_str ?? p.tokensStr),
          shares: p.shares ?? null,
          valueUsd: p.valueUsd != null || p.value_usd != null
            ? Number(p.valueUsd ?? p.value_usd)
            : null,
          poolType: p.pool_type ?? p.poolType ?? undefined,
          feeApy: p.fee_apy != null || p.feeApy != null ? Number(p.fee_apy ?? p.feeApy) : null,
          rewardApy: p.reward_apy != null || p.rewardApy != null
            ? Number(p.reward_apy ?? p.rewardApy)
            : null,
        }))
      : undefined,
    totalValueUsd: raw.totalValueUsd ?? raw.total_value_usd ?? null,
  });

  if (!result.success) {
    console.warn("[aquarius-from-sdk] positions normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Yield normalization ───────────────────────────────────────

export function normalizeAquaYieldFromSdk(raw: Record<string, unknown>): AquaYieldCardProps[] {
  const opportunities = (raw.opportunities ?? raw.yields ?? []) as Record<string, unknown>[];
  return opportunities
    .map((opp) => {
      const apy = opp.apy as Record<string, unknown> | undefined;
      const result = aquaYieldCardPropsSchema.safeParse({
        protocol: "aquarius",
        type: "lp",
        name: String(opp.name ?? ""),
        assets: Array.isArray(opp.assets) ? opp.assets.map(String) : [],
        apy: {
          base: apy?.base != null ? Number(apy.base) : null,
          reward: apy?.reward != null ? Number(apy.reward) : null,
          total: apy?.total != null ? Number(apy.total) : null,
          rewardToken: apy?.rewardToken != null ? String(apy.rewardToken) : undefined,
        },
        tvl: opp.tvl ?? null,
        poolAddress: opp.poolAddress ?? opp.pool_address ?? undefined,
        risk: opp.risk ?? undefined,
        status: opp.status ?? undefined,
        fee: opp.fee != null ? String(opp.fee) : undefined,
        poolType: opp.poolType ?? opp.pool_type ?? undefined,
      });
      if (!result.success) return null;
      return result.data;
    })
    .filter((o): o is AquaYieldCardProps => o !== null);
}

// ─── Transaction normalization ─────────────────────────────────

export function normalizeAquaTxFromSdk(
  raw: Record<string, unknown>,
  form?: Record<string, string>,
): AquaTxCardProps | null {
  const merged = { ...raw, ...(form ?? {}) };
  const result = aquaTxCardPropsSchema.safeParse({
    operation: String(merged.operation ?? ""),
    xdr: String(merged.xdr ?? ""),
    estimatedFee: merged.estimatedFee != null ? String(merged.estimatedFee) : undefined,
    pool: merged.pool ?? merged.poolAddress ?? undefined,
    from: merged.from ?? undefined,
    amounts: Array.isArray(merged.amounts) ? merged.amounts.map(String) : undefined,
    shares: merged.shares != null ? String(merged.shares) : undefined,
    tokenIn: merged.tokenIn ?? merged.token_in ?? undefined,
    tokenOut: merged.tokenOut ?? merged.token_out ?? undefined,
    amount: merged.amount != null ? String(merged.amount) : undefined,
    route: merged.route ?? undefined,
    context: merged.context ?? undefined,
  });

  if (!result.success) {
    console.warn("[aquarius-from-sdk] tx normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}
