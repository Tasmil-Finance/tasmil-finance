"use client";

import { useQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";
import type { ProtocolPositionGroup, PositionItem } from "./use-defi-positions";

// ─── API config ──────────────────────────────────────────────────────────────

const API_BASE = "/api/aquarius";
const SCALAR_7 = 10_000_000;

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiPool {
  address: string;
  pool_type?: string;
  tokens?: { address: string; symbol?: string }[];
  tokens_str?: string | string[];
  total_value_locked?: string | number;
  fee_apy?: string | number;
  reward_apy?: string | number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTokenSymbol(raw: string): string {
  if (raw === "native") return "XLM";
  const colonIdx = raw.indexOf(":");
  return colonIdx > 0 ? raw.slice(0, colonIdx) : raw;
}

function poolPairName(pool: ApiPool): string {
  if (Array.isArray(pool.tokens_str) && pool.tokens_str.length > 0) {
    return pool.tokens_str.map(parseTokenSymbol).join("/");
  }
  if (typeof pool.tokens_str === "string")
    return pool.tokens_str.replace(/-/g, "/");
  if (Array.isArray(pool.tokens) && pool.tokens.length > 0) {
    return pool.tokens.map((t) => t.symbol ?? t.address.slice(0, 4)).join("/");
  }
  return `Pool ${pool.address.slice(0, 6)}…`;
}

async function fetchPoolList(): Promise<ApiPool[]> {
  const pools: ApiPool[] = [];
  for (let page = 1; page <= 10; page++) {
    try {
      const url = `${API_BASE}/pools/?page=${page}&page_size=50&ordering=-total_value_locked`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const results = data?.results ?? data;
      if (!Array.isArray(results) || results.length === 0) break;
      pools.push(...results);
      if (!data?.next) break;
    } catch {
      break;
    }
  }
  return pools;
}

// ─── Soroban helper ─────────────────────────────────────────────────────────

type SdkBundle = {
  sdk: typeof import("@stellar/stellar-sdk");
  server: InstanceType<(typeof import("@stellar/stellar-sdk"))["rpc"]["Server"]>;
  source: InstanceType<(typeof import("@stellar/stellar-sdk"))["Account"]>;
};

async function loadSdk(): Promise<SdkBundle> {
  const sdk = await import("@stellar/stellar-sdk");
  const server = new sdk.rpc.Server(activeNetwork.sorobanRpcUrl);
  const source = new sdk.Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );
  return { sdk, server, source };
}

async function viewCall<T = unknown>(
  { sdk, server, source }: SdkBundle,
  contractId: string,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[] = [],
): Promise<T | null> {
  try {
    const contract = new sdk.Contract(contractId);
    const tx = new sdk.TransactionBuilder(source, {
      fee: "100",
      networkPassphrase: activeNetwork.networkPassphrase,
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .addOperation(contract.call(method, ...(args as any[])))
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (sdk.rpc.Api.isSimulationSuccess(sim) && sim.result?.retval) {
      return sdk.scValToNative(sim.result.retval) as T;
    }
  } catch {
    // Expected for pools that don't support a method
  }
  return null;
}

// ─── Discover concentrated tick ranges from Horizon tx history ──────────────

interface TickRange {
  tickLower: number;
  tickUpper: number;
}

/**
 * Decode a base64-encoded XDR I32 ScVal → number.
 * Format: 4 bytes type (0x00000004) + 4 bytes i32 value (big-endian).
 */
function decodeI32(b64: string): number | null {
  try {
    const raw = atob(b64);
    if (raw.length < 8) return null;
    // Read big-endian i32 from bytes 4..7
    const b0 = raw.charCodeAt(4);
    const b1 = raw.charCodeAt(5);
    const b2 = raw.charCodeAt(6);
    const b3 = raw.charCodeAt(7);
    const unsigned = ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3) >>> 0;
    // Convert to signed i32
    return unsigned > 0x7fffffff ? unsigned - 0x100000000 : unsigned;
  } catch {
    return null;
  }
}

/**
 * Decode a base64-encoded XDR Sym ScVal → string.
 * Format: 4 bytes type (0x0000000f) + 4 bytes length + N bytes string + padding.
 */
function decodeSym(b64: string): string | null {
  try {
    const raw = atob(b64);
    if (raw.length < 8) return null;
    // Read string length from bytes 4..7
    const len =
      (raw.charCodeAt(4) << 24) |
      (raw.charCodeAt(5) << 16) |
      (raw.charCodeAt(6) << 8) |
      raw.charCodeAt(7);
    if (len <= 0 || len > raw.length - 8) return null;
    let s = "";
    for (let i = 0; i < len; i++) s += raw[8 + i];
    return s;
  } catch {
    return null;
  }
}

/**
 * Scan user's Horizon operations for `deposit_position` calls.
 * Extract all unique (tick_lower, tick_upper) pairs.
 */
async function discoverTickRanges(userAddress: string): Promise<TickRange[]> {
  const ranges: TickRange[] = [];
  const seen = new Set<string>();

  try {
    const res = await fetch(
      `${activeNetwork.horizonUrl}/accounts/${userAddress}/operations?limit=200&order=desc&include_failed=false`,
    );
    if (!res.ok) {
      console.warn("[aquarius] Horizon operations fetch failed:", res.status);
      return ranges;
    }
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = data?._embedded?.records ?? [];

    for (const op of records) {
      if (op.type !== "invoke_host_function") continue;
      const params = op.parameters;
      if (!Array.isArray(params) || params.length < 5) continue;

      // param[1] must be Sym = "deposit_position"
      const fnName = decodeSym(params[1]?.value ?? "");
      if (fnName !== "deposit_position") continue;

      // param[3] = tick_lower, param[4] = tick_upper
      const tickLower = decodeI32(params[3]?.value ?? "");
      const tickUpper = decodeI32(params[4]?.value ?? "");
      if (tickLower == null || tickUpper == null) continue;

      const key = `${tickLower}:${tickUpper}`;
      if (!seen.has(key)) {
        seen.add(key);
        ranges.push({ tickLower, tickUpper });
        console.warn(`[aquarius] Found deposit_position ticks=[${tickLower}, ${tickUpper}]`);
      }
    }
  } catch (e) {
    console.warn("[aquarius] Failed to scan Horizon operations:", e);
  }

  console.warn(`[aquarius] Discovered ${ranges.length} tick ranges`);
  return ranges;
}

// ─── Core fetcher ────────────────────────────────────────────────────────────

async function fetchAquariusPositions(
  userAddress: string,
): Promise<ProtocolPositionGroup | null> {
  const bundle = await loadSdk();
  const { sdk } = bundle;

  // 1. Fetch all pools from Aquarius API
  const pools = await fetchPoolList();
  console.warn(`[aquarius] Fetched ${pools.length} pools from API`);
  if (pools.length === 0) return null;

  const userScVal = new sdk.Address(userAddress).toScVal();
  const items: PositionItem[] = [];

  // Separate classic and concentrated pools
  // Also detect concentrated by checking if share_id === pool address
  const classicPools: ApiPool[] = [];
  const concentratedPools: ApiPool[] = [];
  const poolByAddr = new Map<string, ApiPool>();

  for (const pool of pools) {
    poolByAddr.set(pool.address, pool);
    if (pool.pool_type === "concentrated") {
      concentratedPools.push(pool);
    } else {
      classicPools.push(pool);
    }
  }
  console.warn(`[aquarius] Classic: ${classicPools.length}, Concentrated: ${concentratedPools.length}`);

  // ── 2a. Classic pools: share_id → balance on LP token ───────────────────
  const BATCH = 8;
  for (let i = 0; i < classicPools.length; i += BATCH) {
    const batch = classicPools.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (pool) => {
        const shareId = await viewCall<string>(
          bundle,
          pool.address,
          "share_id",
        );
        if (!shareId || shareId === pool.address) return { pool, shares: 0n };

        const rawBal = await viewCall<unknown>(bundle, shareId, "balance", [
          userScVal,
        ]);
        const shares =
          rawBal != null
            ? typeof rawBal === "bigint"
              ? rawBal
              : BigInt(String(rawBal))
            : 0n;

        return { pool, shares };
      }),
    );

    for (const r of results) {
      if (r.status !== "fulfilled" || r.value.shares <= 0n) continue;
      const { pool, shares } = r.value;
      const name = poolPairName(pool);
      const humanShares = Number(shares) / SCALAR_7;

      items.push({
        name: `${name} LP`,
        type: "lp",
        asset: name,
        valueUsd: 0,
        extra: `${humanShares.toLocaleString("en-US", { maximumFractionDigits: 4 })} shares`,
      });
    }
  }

  // ── 2b. Concentrated pools ──────────────────────────────────────────────
  if (concentratedPools.length > 0) {
    const tickRanges = await discoverTickRanges(userAddress);

    if (tickRanges.length > 0) {
      // Try each pool × tick_range combination
      const checks: {
        pool: ApiPool;
        tickLower: number;
        tickUpper: number;
      }[] = [];
      for (const pool of concentratedPools) {
        for (const range of tickRanges) {
          checks.push({
            pool,
            tickLower: range.tickLower,
            tickUpper: range.tickUpper,
          });
        }
      }
      console.warn(`[aquarius] Checking ${checks.length} concentrated position combos`);

      const concResults = await Promise.allSettled(
        checks.map(async (check) => {
          const tickLowerVal = sdk.nativeToScVal(check.tickLower, {
            type: "i32",
          });
          const tickUpperVal = sdk.nativeToScVal(check.tickUpper, {
            type: "i32",
          });
          const posData = await viewCall<Record<string, unknown>>(
            bundle,
            check.pool.address,
            "get_position",
            [userScVal, tickLowerVal, tickUpperVal],
          );
          return { check, posData };
        }),
      );

      for (const r of concResults) {
        if (r.status !== "fulfilled" || !r.value.posData) continue;
        const { check, posData } = r.value;

        const liquidity =
          typeof posData.liquidity === "bigint"
            ? posData.liquidity
            : BigInt(String(posData.liquidity ?? "0"));
        if (liquidity <= 0n) continue;

        const name = poolPairName(check.pool);
        const humanLiq = Number(liquidity) / SCALAR_7;
        console.warn(`[aquarius] Found concentrated position: ${name} liq=${humanLiq}`);

        items.push({
          name: `${name} LP`,
          type: "lp",
          asset: name,
          valueUsd: 0,
          extra: `${humanLiq.toLocaleString("en-US", { maximumFractionDigits: 4 })} liq`,
        });
      }
    }
  }

  console.warn(`[aquarius] Total positions found: ${items.length}`);
  if (items.length === 0) return null;

  return {
    protocol: "aquarius",
    displayName: "Aquarius AMM",
    icon: null,
    totalValueUsd: 0,
    positions: items,
  };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAquariusPositions(address: string | null | undefined) {
  return useQuery<ProtocolPositionGroup | null>({
    queryKey: ["profile", "aquarius-positions", address],
    queryFn: () => fetchAquariusPositions(address!),
    enabled: !!address,
    staleTime: 8_000,
    refetchInterval: 10_000,
    retry: 1,
  });
}
