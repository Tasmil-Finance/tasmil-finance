/**
 * Blend V2 pool discovery via @blend-capital/blend-sdk.
 * Adapted from apps/mcp-stellar/src/services/blend-registry.ts
 * Now uses config injection instead of env vars.
 */

import { Backstop, PoolV2, PoolUser, PoolOracle, PositionsEstimate, FixedMath } from "@blend-capital/blend-sdk";
import type { TasmilClientConfig } from "../../types/common.js";
import type { StellarNetwork } from "../../types/common.js";
import { getBlendContracts } from "../../utils/contracts.js";
import { STELLAR_NETWORKS } from "../../utils/network.js";
import { resolveContractSymbol } from "../../utils/asset-resolver.js";
import { viewCall } from "../../utils/soroban.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("blend:pools");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface BlendReserveInfo {
  assetAddress: string;
  symbol: string;
  supplyApy: number;
  borrowApy: number;
  decimals: number;
  collateralFactor: number;
  liabilityFactor: number;
  /** Total tokens supplied (underlying asset units) */
  totalSupplied: number;
  /** Total tokens borrowed (underlying asset units) */
  totalBorrowed: number;
  /** Borrow utilization ratio 0–1 */
  utilization: number;
  /** Supply emission APY (BLND rewards) as decimal */
  supplyEmissionApy: number | null;
  /** Borrow emission APY (BLND rewards) as decimal */
  borrowEmissionApy: number | null;
  /** Oracle contract address */
  oracleAddress: string | null;
  /** Reserve index in pool */
  reserveIndex: number;
}

export interface BlendUserAssetPosition {
  assetAddress: string;
  symbol: string;
  /** Actual token amount (converted from bToken/dToken shares) */
  amount: number;
  apy: number;
}

export interface BlendUserPositions {
  poolAddress: string;
  poolName: string;
  /** Assets supplied as collateral */
  collateral: BlendUserAssetPosition[];
  /** Assets supplied but NOT enabled as collateral */
  supply: BlendUserAssetPosition[];
  /** Assets borrowed */
  liabilities: BlendUserAssetPosition[];
  /** max_positions used — each unique asset across all three maps counts as one slot */
  positionsUsed: number;
  /** USD value totals — null if oracle unavailable on this network */
  totalSuppliedUsd: number | null;
  totalBorrowedUsd: number | null;
  /** Remaining borrow capacity in oracle base currency */
  borrowCapacityUsd: number | null;
  /** 0–1 how full the borrow capacity is (totalEffectiveLiabilities / totalEffectiveCollateral) */
  borrowLimitRatio: number | null;
  /** Weighted net APY across all positions */
  netApy: number | null;
  /** Claimable BLND emissions (in BLND token units), null if unavailable */
  emissions: number | null;
}

export interface BlendPoolInfo {
  address: string;
  name: string;
  status: string;
  reserves: BlendReserveInfo[];
  backstopRate: number;
}

export interface BlendRegistryData {
  backstopAddress: string;
  blndToken: string;
  usdcToken: string;
  cometLpToken: string;
  poolFactory: string;
  emitter: string;
  pools: BlendPoolInfo[];
  network: StellarNetwork;
  timestamp: number;
}

// ─── Extra symbol overrides for contracts not in KNOWN_ASSETS ────

async function resolveReserveSymbol(assetId: string, config: TasmilClientConfig): Promise<string> {
  return resolveContractSymbol(
    assetId,
    config.network,
    (contractId, method, _args) => viewCall(config, contractId, method, []),
  );
}

// ─── Per-network cache ────────────────────────────────────────────

const registryCache = new Map<StellarNetwork, BlendRegistryData>();

export function getBlendSdkNetwork(config: TasmilClientConfig) {
  const netConfig = STELLAR_NETWORKS[config.network];
  return {
    rpc: config.rpcUrl ?? netConfig.rpcUrl,
    passphrase: netConfig.networkPassphrase,
  };
}

function getStaticPoolNameMap(network: StellarNetwork): Map<string, string> {
  const map = new Map<string, string>();
  const pools = getBlendContracts(network).knownPools;
  for (const p of pools) {
    map.set(p.address, p.name);
  }
  return map;
}

function getStatusName(code: number): string {
  switch (code) {
    case 0: return "setup";
    case 1: return "active";
    case 2: case 3: return "on_ice";
    case 4: case 5: return "frozen";
    case 6: case 7: return "admin_frozen";
    default: return `unknown(${code})`;
  }
}

function buildStaticFallback(
  network: StellarNetwork,
  blendContracts: ReturnType<typeof getBlendContracts>,
): BlendRegistryData {
  return {
    backstopAddress: blendContracts.backstop,
    blndToken: blendContracts.blndToken,
    usdcToken: blendContracts.usdcToken,
    cometLpToken: blendContracts.cometLpPool,
    poolFactory: blendContracts.poolFactory,
    emitter: blendContracts.emitter,
    pools: blendContracts.knownPools.map((p) => ({
      address: p.address,
      name: p.name,
      status: "unknown",
      reserves: [],
      backstopRate: 0,
    })),
    network,
    timestamp: Date.now(),
  };
}

/**
 * Load full Blend registry: backstop config, all pools, all reserves.
 * Results are cached per-network for CACHE_TTL_MS.
 */
export async function loadBlendRegistry(
  config: TasmilClientConfig,
  forceRefresh = false,
): Promise<BlendRegistryData> {
  const { network } = config;
  const cached = registryCache.get(network);

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.timestamp < CACHE_TTL_MS
  ) {
    return cached;
  }

  const blendContracts = getBlendContracts(network);
  const backstopAddress = blendContracts.backstop;

  log.info(`Loading Blend registry for ${network}...`);
  const blendNetwork = getBlendSdkNetwork(config);
  const nameMap = getStaticPoolNameMap(network);

  let backstop: Backstop;
  try {
    backstop = await Backstop.load(blendNetwork, backstopAddress);
  } catch (err) {
    log.warn("Failed to load backstop from chain, using static fallback", { err: String(err) });
    return buildStaticFallback(network, blendContracts);
  }

  const rewardZonePoolIds = backstop.config.rewardZone;
  log.info(`Found ${rewardZonePoolIds.length} pools in rewardZone`);

  // Compute BLND price from backstop token data (80/20 BLND:USDC pool)
  let blndPriceUsd = 0;
  try {
    const bsToken = (backstop as any).backstopToken;
    if (bsToken) {
      const usdcFloat = FixedMath.toFloat(bsToken.usdc, 7);
      const blndFloat = FixedMath.toFloat(bsToken.blnd, 7);
      if (blndFloat > 0) {
        blndPriceUsd = (usdcFloat / 0.2) / (blndFloat / 0.8);
      }
    }
  } catch { /* backstop token unavailable */ }

  const poolResults = await Promise.allSettled(
    rewardZonePoolIds.map(async (poolId) => {
      const pool = await PoolV2.load(blendNetwork, poolId);

      // Load oracle for emission APY calculation (asset prices)
      let oracle: PoolOracle | null = null;
      try {
        const oracleAddr = ((pool.metadata as any)?.oracle as string) ?? "";
        const assetIds = [...pool.reserves.keys()];
        if (oracleAddr) {
          oracle = await PoolOracle.load(blendNetwork, oracleAddr, assetIds);
        }
      } catch { /* oracle unavailable */ }

      const reserves = await Promise.all(
        [...pool.reserves].map(async ([assetId, reserve]) => {
          const symbol = await resolveReserveSymbol(assetId, config);
          const totalSupplied = reserve.totalSupplyFloat();
          const totalBorrowed = reserve.totalLiabilitiesFloat();
          const utilization = totalSupplied > 0 ? totalBorrowed / totalSupplied : 0;

          // Calculate per-reserve emission APY (BLND rewards)
          let supplyEmissionApy: number | null = null;
          let borrowEmissionApy: number | null = null;
          if (blndPriceUsd > 0 && oracle) {
            try {
              const oraclePrice = oracle.getPriceFloat(assetId) ?? 0;
              if (oraclePrice > 0) {
                // Supply emissions
                const supplyEm = (reserve as any).supplyEmissions;
                if (supplyEm?.emissionsPerYearPerToken) {
                  const emPerToken = supplyEm.emissionsPerYearPerToken(
                    (reserve as any).totalSupply(),
                    reserve.config.decimals,
                  );
                  if (emPerToken > 0) {
                    supplyEmissionApy = (emPerToken * blndPriceUsd) / oraclePrice;
                  }
                }
                // Borrow emissions
                const borrowEm = (reserve as any).borrowEmissions;
                if (borrowEm?.emissionsPerYearPerToken) {
                  const emPerToken = borrowEm.emissionsPerYearPerToken(
                    (reserve as any).totalLiabilities(),
                    reserve.config.decimals,
                  );
                  if (emPerToken > 0) {
                    borrowEmissionApy = (emPerToken * blndPriceUsd) / oraclePrice;
                  }
                }
              }
            } catch { /* emission calc failed for this reserve */ }
          }

          return {
            assetAddress: assetId,
            symbol,
            supplyApy: reserve.estSupplyApy ?? 0,
            borrowApy: reserve.estBorrowApy ?? 0,
            decimals: reserve.config.decimals,
            collateralFactor: reserve.getCollateralFactor(),
            liabilityFactor: reserve.getLiabilityFactor(),
            totalSupplied,
            totalBorrowed,
            utilization,
            supplyEmissionApy,
            borrowEmissionApy,
            oracleAddress: (pool.metadata as { oracle?: string }).oracle ?? null,
            reserveIndex: reserve.config.index ?? 0,
          } satisfies BlendReserveInfo;
        }),
      );

      const meta = pool.metadata as unknown as { status?: number; name?: string; backstopRate?: number };
      return {
        address: poolId,
        name: nameMap.get(poolId) ?? meta.name ?? poolId.slice(0, 12) + "...",
        status: getStatusName(meta.status ?? -1),
        reserves,
        backstopRate: (meta.backstopRate ?? 0) / 1e7,
      } satisfies BlendPoolInfo;
    }),
  );

  const pools: BlendPoolInfo[] = [];
  for (let i = 0; i < poolResults.length; i++) {
    const result = poolResults[i]!;
    if (result.status === "fulfilled") {
      pools.push(result.value);
    } else {
      log.warn(`Failed to load pool ${rewardZonePoolIds[i]}`, { err: String(result.reason) });
    }
  }

  const data: BlendRegistryData = {
    backstopAddress,
    blndToken: backstop.config.blndTkn,
    usdcToken: backstop.config.usdcTkn,
    cometLpToken: backstop.config.backstopTkn,
    poolFactory: backstop.config.poolFactory,
    emitter: backstop.config.emitter,
    pools,
    network,
    timestamp: Date.now(),
  };

  registryCache.set(network, data);
  log.info(
    `Blend registry loaded: ${pools.length} pools, ${pools.reduce((n, p) => n + p.reserves.length, 0)} total reserves`,
  );
  return data;
}

export async function getBlendReserveInfo(
  config: TasmilClientConfig,
  poolAddress: string,
  assetAddress: string,
): Promise<BlendReserveInfo | null> {
  const pool = await getBlendPoolByAddress(config, poolAddress);
  if (!pool) return null;
  return pool.reserves.find((r) => r.assetAddress === assetAddress) ?? null;
}

export async function getAllBlendPools(config: TasmilClientConfig): Promise<BlendPoolInfo[]> {
  const reg = await loadBlendRegistry(config);
  return reg.pools;
}

export async function getBlendPoolByAddress(
  config: TasmilClientConfig,
  address: string,
): Promise<BlendPoolInfo | undefined> {
  const reg = await loadBlendRegistry(config);
  return reg.pools.find((p) => p.address === address);
}

export async function getBlendPoolsByAsset(
  config: TasmilClientConfig,
  assetSymbolOrAddress: string,
): Promise<BlendPoolInfo[]> {
  const reg = await loadBlendRegistry(config);
  const search = assetSymbolOrAddress.toUpperCase();
  return reg.pools.filter((p) =>
    p.reserves.some(
      (r) => r.symbol.toUpperCase() === search || r.assetAddress === assetSymbolOrAddress,
    ),
  );
}

/**
 * Get a user's current positions in a Blend pool.
 * Returns actual token amounts (converted from bToken/dToken shares via current exchange rates).
 * USD estimates (totalSuppliedUsd, borrowCapacityUsd, netApy) require the pool oracle —
 * they are null if the oracle is unreachable or has no prices for the reserve assets.
 */
export async function getBlendUserPositions(
  config: TasmilClientConfig,
  poolAddress: string,
  userAddress: string,
): Promise<BlendUserPositions> {
  const blendNetwork = getBlendSdkNetwork(config);
  const { network } = config;

  // Load pool, then user (user depends on pool)
  const pool = await PoolV2.load(blendNetwork, poolAddress);
  const poolUser = await PoolUser.load(blendNetwork, poolAddress, pool, userAddress);

  const nameMap = getStaticPoolNameMap(network);
  const poolName = nameMap.get(poolAddress) ?? (pool.metadata as { name?: string }).name ?? poolAddress.slice(0, 12) + "...";

  // Run symbol resolution, oracle, and emissions in parallel
  const reserveEntries = [...pool.reserves];
  const oracleAddr = (pool.metadata as { oracle?: string }).oracle;

  const [symbolResults, oracleResult, emissionsResult] = await Promise.allSettled([
    // 1. Resolve all symbols in parallel
    Promise.all(reserveEntries.map(([assetId]) => resolveReserveSymbol(assetId, config))),
    // 2. Load oracle
    oracleAddr
      ? (async () => {
          const reserveAssetIds = [...pool.reserves.keys()];
          const oracle = await PoolOracle.load(blendNetwork, oracleAddr, reserveAssetIds);
          return PositionsEstimate.build(pool, oracle, poolUser.positions);
        })()
      : Promise.resolve(null),
    // 3. Estimate emissions
    (async () => {
      const reserveArray = Array.from(pool.reserves.values());
      const est = poolUser.estimateEmissions(reserveArray);
      return est.emissions > 0 ? est.emissions : null;
    })(),
  ]);

  // Process positions from symbol results
  const collateral: BlendUserAssetPosition[] = [];
  const supply: BlendUserAssetPosition[] = [];
  const liabilities: BlendUserAssetPosition[] = [];

  const symbols = symbolResults.status === "fulfilled" ? symbolResults.value : [];
  for (let i = 0; i < reserveEntries.length; i++) {
    const [assetId, reserve] = reserveEntries[i]!;
    const symbol = symbols[i] ?? assetId.slice(0, 6);
    const col = poolUser.getCollateralFloat(reserve);
    const sup = poolUser.getSupplyFloat(reserve);
    const lia = poolUser.getLiabilitiesFloat(reserve);
    if (col > 0) collateral.push({ assetAddress: assetId, symbol, amount: col, apy: reserve.estSupplyApy ?? 0 });
    if (sup > 0) supply.push({ assetAddress: assetId, symbol, amount: sup, apy: reserve.estSupplyApy ?? 0 });
    if (lia > 0) liabilities.push({ assetAddress: assetId, symbol, amount: lia, apy: reserve.estBorrowApy ?? 0 });
  }

  const positionsUsed = collateral.length + liabilities.length;

  // Extract oracle results
  let totalSuppliedUsd: number | null = null;
  let totalBorrowedUsd: number | null = null;
  let borrowCapacityUsd: number | null = null;
  let borrowLimitRatio: number | null = null;
  let netApy: number | null = null;

  if (oracleResult.status === "fulfilled" && oracleResult.value) {
    const est = oracleResult.value;
    totalSuppliedUsd = est.totalSupplied;
    totalBorrowedUsd = est.totalBorrowed;
    borrowCapacityUsd = est.borrowCap;
    borrowLimitRatio = est.borrowLimit;
    netApy = est.netApy;
  }

  // Extract emissions
  const emissions = emissionsResult.status === "fulfilled" ? emissionsResult.value : null;

  return {
    poolAddress,
    poolName,
    collateral,
    supply,
    liabilities,
    positionsUsed,
    totalSuppliedUsd,
    totalBorrowedUsd,
    borrowCapacityUsd,
    borrowLimitRatio,
    netApy,
    emissions,
  };
}

export function clearBlendRegistryCache(network?: StellarNetwork): void {
  if (network) {
    registryCache.delete(network);
  } else {
    registryCache.clear();
  }
}

export interface BlendBackstopInfo {
  poolAddress: string;
  poolName: string;
  /** Interest APR as decimal (e.g. 0.0002 = 0.02%) */
  interestApr: number;
  /** Emission APR as decimal */
  emissionApr: number;
  /** Total APR as decimal */
  totalApr: number;
  /** Q4W percentage as decimal (0-1) */
  q4wPct: number;
  /** Total deposited USD */
  totalDepositedUsd: number;
  /** LP token price in USD */
  lpTokenPrice: number;
  /** Total shares (raw bigint as string) */
  shares: string;
}

export async function getBlendBackstopInfo(
  config: TasmilClientConfig,
  poolAddress: string,
): Promise<BlendBackstopInfo> {
  const { Backstop, BackstopPoolV2, BackstopPoolEst, PoolV2, PoolOracle, PoolEstimate, FixedMath } =
    await import("@blend-capital/blend-sdk");
  const blendNetwork = getBlendSdkNetwork(config);
  const blendContracts = getBlendContracts(config.network);
  const backstopAddress = blendContracts.backstop;
  const nameMap = getStaticPoolNameMap(config.network);

  const timestamp = Math.floor(Date.now() / 1000);

  const [backstop, backstopPoolData, pool] = await Promise.all([
    Backstop.load(blendNetwork, backstopAddress),
    BackstopPoolV2.load(blendNetwork, backstopAddress, poolAddress, timestamp),
    PoolV2.load(blendNetwork, poolAddress),
  ]);

  const backstopPoolEst = BackstopPoolEst.build(backstop.backstopToken, backstopPoolData.poolBalance);

  // Interest APR — mirrors blend-ui BackstopAPR component
  let interestApr = 0;
  try {
    const oracleAddr = (pool.metadata as { oracle?: string }).oracle;
    if (oracleAddr) {
      const reserveAssetIds = [...pool.reserves.keys()];
      const oracle = await PoolOracle.load(blendNetwork, oracleAddr, reserveAssetIds);
      const poolEst = PoolEstimate.build(pool.reserves, oracle);
      const backstopRate = FixedMath.toFloat(BigInt(pool.metadata.backstopRate ?? 0), 7);
      interestApr =
        (backstopRate * poolEst.avgBorrowApy * poolEst.totalBorrowed) /
        backstopPoolEst.totalSpotValue;
    }
  } catch {
    // oracle unavailable
  }

  // Emission APR — mirrors blend-ui estSingleSidedDeposit('blnd', ...)
  let emissionApr = 0;
  try {
    const emissionPerToken = backstopPoolData.emissionPerYearPerBackstopToken();
    if (emissionPerToken > 0) {
      const amountFloat = FixedMath.toFloat(FixedMath.toFixed(emissionPerToken, 7), 7);
      const weight = 0.8;
      const swapFee = 0.03;
      const amountNetFees = amountFloat * (1.0 - (1.0 - weight) * swapFee);
      const blndInPool = FixedMath.toFloat(backstop.backstopToken.blnd, 7);
      const ratio = 1.0 + amountNetFees / blndInPool;
      const weightedRatio = Math.pow(ratio, weight) - 1;
      emissionApr = FixedMath.toFloat(backstop.backstopToken.shares, 7) * weightedRatio;
    }
  } catch {
    // emissions unavailable
  }

  return {
    poolAddress,
    poolName: nameMap.get(poolAddress) ?? poolAddress.slice(0, 12) + "...",
    interestApr,
    emissionApr,
    totalApr: interestApr + emissionApr,
    q4wPct: backstopPoolEst.q4wPercentage,
    totalDepositedUsd: backstopPoolEst.totalSpotValue,
    lpTokenPrice: backstopPoolEst.totalSpotValue > 0
      ? backstopPoolEst.totalSpotValue / (Number(backstopPoolData.poolBalance.shares) / 1e7)
      : 0,
    shares: backstopPoolData.poolBalance.shares.toString(),
  };
}

export interface BlendBackstopUserBalance {
  pool: string;
  user: string;
  /** Shares held (raw bigint as string) */
  shares: string;
  /** Q4W entries */
  q4w: { amount: string; exp: number }[];
  /** Total shares queued for withdrawal */
  totalQ4w: string;
}

export async function getBlendBackstopUserBalance(
  config: TasmilClientConfig,
  poolAddress: string,
  userAddress: string,
): Promise<BlendBackstopUserBalance> {
  const { BackstopPoolUser } = await import("@blend-capital/blend-sdk");
  const blendNetwork = getBlendSdkNetwork(config);
  const blendContracts = getBlendContracts(config.network);
  const timestamp = Math.floor(Date.now() / 1000);

  const poolUser = await BackstopPoolUser.load(
    blendNetwork,
    blendContracts.backstop,
    poolAddress,
    userAddress,
    timestamp,
  );

  const q4wEntries = (poolUser.balance.q4w ?? []).map((entry: any) => ({
    amount: entry.amount?.toString() ?? "0",
    exp: Number(entry.exp ?? 0),
  }));

  const totalQ4w = q4wEntries.reduce(
    (sum: bigint, e: any) => sum + BigInt(e.amount),
    0n,
  ).toString();

  return {
    pool: poolAddress,
    user: userAddress,
    shares: poolUser.balance.shares?.toString() ?? "0",
    q4w: q4wEntries,
    totalQ4w,
  };
}
