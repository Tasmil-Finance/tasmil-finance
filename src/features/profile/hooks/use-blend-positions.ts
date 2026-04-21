"use client";

import { useQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";
import type { ProtocolPositionGroup, PositionItem } from "./use-defi-positions";

// ─── Backstop addresses (used to discover ALL active pools dynamically) ──────

const isTestnet = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] !== "mainnet";

const BACKSTOP_ADDRESS = isTestnet
  ? "CBDVWXT433PRVTUNM56C3JREF3HIZHRBA64NB2C3B2UNCKIS65ZYCLZA"
  : "CAQQR5SWBXKIGZKPBZDH3KM5GQ5GUTPKB7JAFCINLZBC5WXPJKRG3IM7";

const FALLBACK_POOLS = isTestnet
  ? ["CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF"]
  : [
      "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
      "CAE7QVOMBLZ53CDRGK3UNRRHG5EZ5NQA7HHTFASEMYBWHG6MDFZTYHXC",
      "CCCCIQSDILITHMM7PBSLVDT5MISSY7R26MNZXCX4H7J5JQ5FPIYOGYFS",
      "CDMAVJPFXPADND3YRL4BSM3AKZWCTFMX27GLLXCML3PD62HEQS5FPVAI",
      "CBYOBT7ZCCLQCBUYYIABZLSEGDPEUWXCUXQTZYOG3YBDR7U357D5ZIRF",
    ];

// Pool name lookup — display name for known pool addresses
const POOL_NAMES: Record<string, string> = {
  // Mainnet
  CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD: "Fixed",
  CAE7QVOMBLZ53CDRGK3UNRRHG5EZ5NQA7HHTFASEMYBWHG6MDFZTYHXC: "Orbit",
  CCCCIQSDILITHMM7PBSLVDT5MISSY7R26MNZXCX4H7J5JQ5FPIYOGYFS: "YieldBlox",
  CDMAVJPFXPADND3YRL4BSM3AKZWCTFMX27GLLXCML3PD62HEQS5FPVAI: "Etherfuse",
  CBYOBT7ZCCLQCBUYYIABZLSEGDPEUWXCUXQTZYOG3YBDR7U357D5ZIRF: "Forex",
  // Testnet
  CCEBVDYM32YNYCVNRXQKDFFPISJJCV557CDZEIRBEE4NCV4KHPQ44HGF: "TestnetV2",
  CAPBMXIQTICKWFPWFDJWMAKBXBPJZUKLNONQH3MLPLLBKQ643CYN5PRW: "RegionalStarterPack",
};

const SCALAR_7 = 10_000_000;
const SCALAR_12 = BigInt("1000000000000");

// ─── SDK loader + Soroban helpers ────────────────────────────────────────────

async function loadSdk() {
  const sdk = await import("@stellar/stellar-sdk");
  const server = new sdk.rpc.Server(activeNetwork.sorobanRpcUrl);
  const source = new sdk.Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );
  return { sdk, server, source };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SdkBundle = Awaited<ReturnType<typeof loadSdk>>;

/** Simulate a read-only contract call. */
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
    // Individual call failures are expected
  }
  return null;
}

// ─── Position parsing ────────────────────────────────────────────────────────

/** Robustly extract [reserveIndex, shares] from Soroban Map / Object / Array. */
function posEntries(raw: unknown): [number, bigint][] {
  if (!raw) return [];

  const result: [number, bigint][] = [];

  try {
    let entries: [unknown, unknown][] = [];

    if (raw instanceof Map) {
      entries = [...raw.entries()];
    } else if (Array.isArray(raw)) {
      // Some SDK versions return maps as array of tuples
      for (const item of raw) {
        if (Array.isArray(item) && item.length >= 2) {
          entries.push([item[0], item[1]]);
        }
      }
    } else if (typeof raw === "object" && raw !== null) {
      entries = Object.entries(raw);
    }

    for (const [k, v] of entries) {
      try {
        const key = Number(k);
        if (Number.isNaN(key)) continue;
        const val = typeof v === "bigint" ? v : BigInt(String(v));
        if (val > 0n) result.push([key, val]);
      } catch {
        // Skip unparseable entries
      }
    }
  } catch (e) {
    console.warn("[blend-positions] posEntries parse error:", e);
  }

  return result;
}

// ─── Core fetcher ────────────────────────────────────────────────────────────

async function fetchBlendPositions(
  userAddress: string,
): Promise<ProtocolPositionGroup[]> {
  const bundle = await loadSdk();
  const { sdk } = bundle;

  // ── Step 1: Discover all active pools from backstop ────────────────────
  let poolAddresses: string[] = [];

  // Try multiple possible function names for the reward zone
  for (const fn of ["get_reward_zone", "reward_zone", "get_rz"]) {
    if (poolAddresses.length > 0) break;
    const result = await viewCall<string[]>(bundle, BACKSTOP_ADDRESS, fn);
    if (result && Array.isArray(result) && result.length > 0) {
      poolAddresses = result;
      // Discovered pools via backstop
    }
  }

  // Fallback to static list
  if (poolAddresses.length === 0) {
    poolAddresses = FALLBACK_POOLS;
    // Backstop discovery failed, using fallback pools
  }

  const groups: ProtocolPositionGroup[] = [];

  // ── Step 2: Check each pool for user positions ─────────────────────────
  for (const poolAddr of poolAddresses) {
    try {
      const userScVal = new sdk.Address(userAddress).toScVal();
      const rawPos = await viewCall<Record<string, unknown>>(
        bundle,
        poolAddr,
        "get_positions",
        [userScVal],
      );
      if (!rawPos) continue;

      // Parse position struct fields

      // Handle both plain object and Map for the struct
      const getField = (obj: unknown, field: string): unknown => {
        if (obj instanceof Map) return obj.get(field);
        if (typeof obj === "object" && obj !== null) return (obj as Record<string, unknown>)[field];
        return undefined;
      };

      const rawSupply = getField(rawPos, "supply");
      const rawCollateral = getField(rawPos, "collateral");
      const rawLiabilities = getField(rawPos, "liabilities");
      // Extract position entries

      const supplyEntries = posEntries(rawSupply);
      const collateralEntries = posEntries(rawCollateral);
      const liabilityEntries = posEntries(rawLiabilities);
      // Skip pools with no positions

      if (
        supplyEntries.length === 0 &&
        collateralEntries.length === 0 &&
        liabilityEntries.length === 0
      )
        continue;

      // ── Get reserve list (asset contract addresses, ordered by index) ──
      const reserveList = await viewCall<string[]>(
        bundle,
        poolAddr,
        "get_reserve_list",
      );
      if (!reserveList) continue;

      // ── For each active index: resolve symbol + rates ──────────────────
      const activeIndices = new Set<number>();
      for (const [idx] of [...supplyEntries, ...collateralEntries, ...liabilityEntries]) {
        activeIndices.add(idx);
      }

      const reserveInfo = new Map<
        number,
        { symbol: string; bRate: bigint; dRate: bigint; supplyApy: number; borrowApy: number }
      >();

      for (const idx of activeIndices) {
        const assetAddr = reserveList[idx];
        if (!assetAddr) continue;

        const rawSymbol = await viewCall<string>(bundle, assetAddr, "symbol");
        const symbol =
          rawSymbol === "native"
            ? "XLM"
            : (rawSymbol ?? `${assetAddr.slice(0, 6)}…`);

        // Reserve data — pass asset Address (not u32 index)
        const reserveData = await viewCall<Record<string, unknown>>(
          bundle,
          poolAddr,
          "get_reserve",
          [new sdk.Address(assetAddr).toScVal()],
        );

        let bRate = SCALAR_12;
        let dRate = SCALAR_12;
        let supplyApy = 0;
        let borrowApy = 0;

        if (reserveData) {
          // Extract nested data/config structs
          const dataObj = getField(reserveData, "data");
          const configObj = getField(reserveData, "config");

          const bRaw = dataObj ? getField(dataObj, "b_rate") : getField(reserveData, "b_rate");
          const dRaw = dataObj ? getField(dataObj, "d_rate") : getField(reserveData, "d_rate");
          try {
            if (bRaw != null) bRate = typeof bRaw === "bigint" ? bRaw : BigInt(String(bRaw));
          } catch { /* keep default */ }
          try {
            if (dRaw != null) dRate = typeof dRaw === "bigint" ? dRaw : BigInt(String(dRaw));
          } catch { /* keep default */ }

          // Compute APY from utilization + 3-tier interest rate model
          try {
            const bSupply = BigInt(String(dataObj ? getField(dataObj, "b_supply") ?? 0 : 0));
            const dSupply = BigInt(String(dataObj ? getField(dataObj, "d_supply") ?? 0 : 0));
            const irModRaw = Number(String(dataObj ? getField(dataObj, "ir_mod") ?? SCALAR_7 : SCALAR_7));
            const irMod = irModRaw / SCALAR_7;

            // Rates use SCALAR_12, amounts use token decimals (7 for Stellar)
            const totalSupplyUnderlying = Number(bSupply * bRate / SCALAR_12) / 1e7;
            const totalBorrowUnderlying = Number(dSupply * dRate / SCALAR_12) / 1e7;
            const u = totalSupplyUnderlying > 0 ? totalBorrowUnderlying / totalSupplyUnderlying : 0;

            if (configObj) {
              const S7 = SCALAR_7;
              const rBase = Number(getField(configObj, "r_base") ?? 0) / S7;
              const rOne = Number(getField(configObj, "r_one") ?? 0) / S7;
              const rTwo = Number(getField(configObj, "r_two") ?? 0) / S7;
              const rThree = Number(getField(configObj, "r_three") ?? 0) / S7;
              const uTarget = Number(getField(configObj, "util") ?? 5_000_000) / S7;

              // 3-tier piecewise interest rate
              let baseRate: number;
              if (u <= uTarget) {
                baseRate = rBase + (uTarget > 0 ? (u / uTarget) * rOne : 0);
              } else if (u <= 0.95) {
                const denom = 0.95 - uTarget;
                baseRate = rBase + rOne + (denom > 0 ? ((u - uTarget) / denom) * rTwo : 0);
              } else {
                baseRate = rBase + rOne + rTwo + ((u - 0.95) / 0.05) * rThree;
              }

              // Apply dynamic rate modifier
              const borrowRate = baseRate * irMod;

              // Continuous compounding → APY as percentage
              const BACKSTOP_TAKE_RATE = 0.2;
              borrowApy = Math.round((Math.exp(borrowRate) - 1) * 100 * 100) / 100;
              const supplyRate = borrowRate * u * (1 - BACKSTOP_TAKE_RATE);
              supplyApy = Math.round((Math.exp(supplyRate) - 1) * 100 * 100) / 100;
            }
          } catch { /* APY calc failed, leave as 0 */ }
        }

        reserveInfo.set(idx, { symbol, bRate, dRate, supplyApy, borrowApy });
      }

      // ── Build PositionItems ────────────────────────────────────────────
      const items: PositionItem[] = [];

      const toHuman = (shares: bigint, rate: bigint): string => {
        // shares × rate / SCALAR_12 = underlying in smallest unit
        // then / 1e7 for Stellar's 7-decimal tokens
        const underlying = Number((shares * rate) / SCALAR_12) / 1e7;
        return underlying.toLocaleString("en-US", {
          maximumFractionDigits: 4,
        });
      };

      for (const [idx, shares] of supplyEntries) {
        const info = reserveInfo.get(idx);
        if (!info) continue;
        items.push({
          name: `${info.symbol} Supply`,
          type: "supply",
          asset: info.symbol,
          valueUsd: 0,
          apy: info.supplyApy > 0 ? info.supplyApy : undefined,
          extra: `${toHuman(shares, info.bRate)} ${info.symbol}`,
        });
      }

      for (const [idx, shares] of collateralEntries) {
        const info = reserveInfo.get(idx);
        if (!info) continue;
        items.push({
          name: `${info.symbol} Collateral`,
          type: "supply",
          asset: info.symbol,
          valueUsd: 0,
          apy: info.supplyApy > 0 ? info.supplyApy : undefined,
          extra: `${toHuman(shares, info.bRate)} ${info.symbol}`,
        });
      }

      for (const [idx, shares] of liabilityEntries) {
        const info = reserveInfo.get(idx);
        if (!info) continue;
        items.push({
          name: `${info.symbol} Borrow`,
          type: "borrow",
          asset: info.symbol,
          valueUsd: 0,
          apy: info.borrowApy > 0 ? info.borrowApy : undefined,
          extra: `${toHuman(shares, info.dRate)} ${info.symbol}`,
        });
      }

      if (items.length > 0) {
        // Resolve pool name: static lookup → on-chain config → truncated address
        let poolName = POOL_NAMES[poolAddr];
        if (!poolName) {
          // Try multiple ways to read pool name from the contract
          poolName = await viewCall<string>(bundle, poolAddr, "name")
            ?? await viewCall<string>(bundle, poolAddr, "get_name")
            ?? undefined;

          // Try reading from pool config struct
          if (!poolName) {
            const config = await viewCall<Record<string, unknown>>(bundle, poolAddr, "get_config");
            if (config) {
              const getField = (obj: unknown, field: string): unknown => {
                if (obj instanceof Map) return obj.get(field);
                if (typeof obj === "object" && obj !== null) return (obj as Record<string, unknown>)[field];
                return undefined;
              };
              const rawName = getField(config, "name") ?? getField(config, "pool_name");
              if (typeof rawName === "string" && rawName.length > 0) poolName = rawName;
            }
          }

          if (!poolName) poolName = `Pool ${poolAddr.slice(0, 8)}…`;
        }
        groups.push({
          protocol: "blend",
          displayName: `Blend · ${poolName}`,
          icon: null,
          totalValueUsd: 0,
          positions: items,
        });
      }
    } catch (e) {
      console.warn(`[blend-positions] Pool ${poolAddr.slice(0, 8)} failed:`, e);
      continue;
    }
  }

  return groups;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBlendPositions(address: string | null | undefined) {
  return useQuery<ProtocolPositionGroup[]>({
    queryKey: ["profile", "blend-positions-soroban", address],
    queryFn: () => fetchBlendPositions(address!),
    enabled: !!address,
    staleTime: 8_000,
    refetchInterval: 10_000,
    retry: 1,
  });
}
