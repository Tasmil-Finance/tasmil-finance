/**
 * Adapters that normalize SDK API responses (from /api/blend/*) into typed card props.
 * These handle field name differences across SDK versions (totalSupply vs totalSupplied, etc.).
 */

import {
  type PoolCardProps,
  type ReserveCardProps,
  type PositionsCardProps,
  type TxCardProps,
  type BackstopCardProps,
  type BackstopBalanceCardProps,
  poolCardPropsSchema,
  positionsCardPropsSchema,
  txCardPropsSchema,
  backstopCardPropsSchema,
  backstopBalanceCardPropsSchema,
} from "../schemas/blend.schema";

// ─── Reserve normalization ──────────────────────────────────────

function normalizeReserveRaw(r: Record<string, unknown>): ReserveCardProps {
  return {
    assetAddress: String(r.asset ?? r.assetAddress ?? ""),
    symbol: String(r.symbol ?? "?"),
    supplyApy: r.supplyApy != null ? Number(r.supplyApy) : null,
    borrowApy: r.borrowApy != null ? Number(r.borrowApy) : null,
    totalSupplied: r.totalSupply != null
      ? Number(r.totalSupply)
      : r.totalSupplied != null
        ? Number(r.totalSupplied)
        : null,
    totalBorrowed: r.totalBorrow != null
      ? Number(r.totalBorrow)
      : r.totalBorrowed != null
        ? Number(r.totalBorrowed)
        : null,
    utilization: r.utilization != null ? Number(r.utilization) : null,
    collateralFactor: r.collateralFactor != null ? Number(r.collateralFactor) : null,
    liabilityFactor: r.liabilityFactor != null ? Number(r.liabilityFactor) : null,
    decimals: r.decimals != null ? Number(r.decimals) : undefined,
    supplyEmissionApy: r.supplyEmissionApy != null ? Number(r.supplyEmissionApy) : null,
    borrowEmissionApy: r.borrowEmissionApy != null ? Number(r.borrowEmissionApy) : null,
    supplyCap: r.supplyCap != null ? Number(r.supplyCap) : null,
    reserveIndex: r.reserveIndex != null ? Number(r.reserveIndex) : undefined,
  };
}

// ─── Pool normalization ────────────��────────────────────────────

export function normalizePoolFromSdk(raw: Record<string, unknown>): PoolCardProps | null {
  const pool = (raw.pool ?? raw) as Record<string, unknown>;
  const reserves = ((pool.reserves ?? []) as Record<string, unknown>[]).map(normalizeReserveRaw);

  const result = poolCardPropsSchema.safeParse({
    address: String(pool.address ?? pool.poolAddress ?? ""),
    name: String(pool.name ?? "Pool"),
    status: String(pool.status ?? "unknown"),
    reserves,
    backstopRate: pool.backstopRate != null ? Number(pool.backstopRate) : undefined,
  });

  if (!result.success) {
    console.warn("[from-sdk] pool normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

export function normalizePoolsFromSdk(raw: Record<string, unknown>): PoolCardProps[] {
  const pools = (raw.pools ?? []) as Record<string, unknown>[];
  return pools
    .map((p) => normalizePoolFromSdk(p))
    .filter((p): p is PoolCardProps => p !== null);
}

// ─── Reserve normalization (single) ─���───────────────────────────

export function normalizeReserveFromSdk(raw: Record<string, unknown>): ReserveCardProps {
  const r = (raw.reserve ?? raw) as Record<string, unknown>;
  return normalizeReserveRaw(r);
}

// ─── Positions normalization ──────────���─────────────────────────

export function normalizePositionsFromSdk(raw: Record<string, unknown>): PositionsCardProps | null {
  const result = positionsCardPropsSchema.safeParse({
    hasPosition: raw.hasPosition ?? false,
    positions: raw.positions,
    collateral: raw.collateral,
    supply: raw.supply,
    liabilities: raw.liabilities,
    summary: raw.summary,
  });

  if (!result.success) {
    console.warn("[from-sdk] positions normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Transaction normalization ──────────────────────────────────

export function normalizeTxFromSdk(
  raw: Record<string, unknown>,
  form?: Record<string, string>,
): TxCardProps | null {
  const merged = { ...raw, ...(form ?? {}) };
  const result = txCardPropsSchema.safeParse({
    operation: String(merged.operation ?? ""),
    xdr: String(merged.xdr ?? ""),
    estimatedFee: merged.estimatedFee != null ? String(merged.estimatedFee) : undefined,
    asset: merged.asset != null ? String(merged.asset) : undefined,
    symbol: merged.symbol != null ? String(merged.symbol) : undefined,
    amount: merged.amount != null ? String(merged.amount) : undefined,
    pool: merged.pool != null ? String(merged.pool) : undefined,
    from: merged.from != null ? String(merged.from) : undefined,
    context: merged.context != null ? merged.context : undefined,
  });

  if (!result.success) {
    console.warn("[from-sdk] tx normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Backstop normalization ─────────────────────��───────────────

export function normalizeBackstopFromSdk(raw: Record<string, unknown>): BackstopCardProps | null {
  const backstop = (raw.backstop ?? raw) as Record<string, unknown>;
  const result = backstopCardPropsSchema.safeParse(backstop);
  if (!result.success) {
    console.warn("[from-sdk] backstop normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}

// ─── Backstop Balance normalization ────────────────────────────

export function normalizeBackstopBalanceFromSdk(raw: Record<string, unknown>): BackstopBalanceCardProps | null {
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const result = backstopBalanceCardPropsSchema.safeParse(data);
  if (!result.success) {
    console.warn("[from-sdk] backstop balance normalization errors:", result.error.flatten());
    return null;
  }
  return result.data;
}
