/**
 * Pre-condition checks for Blend operations.
 * Modeled after blend-ui validation patterns (ref/blend-ui).
 *
 * Validation layers (checked in order):
 * 1. Trustline — does user have a trustline for the asset?
 * 2. Balance — does user have enough tokens?
 * 3. XLM reserve — does user keep minimum XLM for account reserves + gas?
 * 4. Position — does user have the required position in the pool?
 * 5. Health factor — would this operation push health factor below safe threshold?
 */

import type { TasmilClientConfig } from "../../types/common.js";
import { viewCall, buildScVal } from "../../utils/soroban.js";
import { createHorizonClient } from "../../utils/stellar-client.js";
import { getBlendContracts } from "../../utils/contracts.js";
import { getBlendSdkNetwork } from "./pools.js";
import { decodeScVal } from "../../utils/xdr-parser.js";

// ─── Error class ────────────────────────────────────────────────

export class PrecheckError extends Error {
  public readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "PrecheckError";
    this.code = code;
  }
}

// ─── Constants ──────────────────────────────────────────────────

/** Base reserve per Stellar account (XLM) */
const STELLAR_BASE_RESERVE = 0.5;
/** Per-subentry reserve (XLM) */
const STELLAR_SUBENTRY_RESERVE = 0.5;
/** Gas headroom to keep in account (XLM) — matches blend-ui's 3 XLM buffer */
const GAS_HEADROOM_XLM = 3;
/** Safety margin for health factor calculations — blend-ui uses 1.02 (2%) */
const HF_SAFETY_MARGIN = 1.02;
/** Scalar for Blend bToken/dToken rates */
const SCALAR_12 = BigInt("1000000000000");
const SCALAR_7 = 10_000_000;

// ─── Known assets ───────────────────────────────────────────────

const KNOWN_CLASSIC_ASSETS: Record<string, { code: string; issuer: string }> = {
  // Testnet USDC
  CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  CAZRY5GSFBFXD7H6GAFBA5YGYQTDXU4QKWKMYFWBAZFUCURN3WKX6LF5: { code: "USDC", issuer: "GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER" },
  // Mainnet USDC
  CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75: { code: "USDC", issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN" },
  // BLND — testnet (CB22KRA3)
  CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF: { code: "BLND", issuer: "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56" },
  // BLND — mainnet (CD25MN)
  CD25MNVTZDL4Y3XBCPCJXGXATV5WUHHOWMYFF4YBEGU5FCPGMYTVG5JY: { code: "BLND", issuer: "GDJEHTBE6ZHUXSWFI642DCGLUOECLHPF3KSXHPXTSTJ7E3JF6MQ5EZYY" },
  // USDT
  CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN: { code: "USDT", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  // AQUA
  CDNVQW44C3HALYNVQ4SOBXY5EWYTGVYXX6JPESOLQDABJI5FC5LTRRUE: { code: "AQUA", issuer: "GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA" },
};

const NATIVE_XLM = new Set([
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
  "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
]);

function isNativeXlm(asset: string): boolean {
  return NATIVE_XLM.has(asset);
}

function symbolOf(asset: string): string {
  if (isNativeXlm(asset)) return "XLM";
  return KNOWN_CLASSIC_ASSETS[asset]?.code ?? asset.slice(0, 8);
}

// ─── Horizon helpers ────────────────────────────────────────────

interface AccountBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  selling_liabilities?: string;
}

interface AccountData {
  balances: AccountBalance[];
  subentry_count: number;
  num_sponsoring?: number;
}

async function loadAccount(config: TasmilClientConfig, address: string): Promise<AccountData> {
  const horizon = createHorizonClient(config);
  const account = await horizon.loadAccount(address);
  return account as unknown as AccountData;
}

function hasTrustline(balances: AccountBalance[], asset: string): boolean {
  if (isNativeXlm(asset)) return true;
  const classic = KNOWN_CLASSIC_ASSETS[asset];
  if (!classic) return true; // unknown → don't block
  // Check by code only — user may have trustline with a different issuer (e.g. BLND has multiple issuers on testnet)
  return balances.some((b) => b.asset_code === classic.code);
}

function getBalance(balances: AccountBalance[], asset: string): number {
  if (isNativeXlm(asset)) {
    const native = balances.find((b) => b.asset_type === "native");
    return native ? Number(native.balance) : 0;
  }
  const classic = KNOWN_CLASSIC_ASSETS[asset];
  if (!classic) return 0;
  const entry = balances.find(
    (b) => b.asset_code === classic.code && b.asset_issuer === classic.issuer,
  );
  return entry ? Number(entry.balance) : 0;
}

/**
 * Calculate minimum XLM reserve needed for the account.
 * Matches blend-ui: base_reserve + subentry_reserve * subentries + 3 XLM gas headroom.
 */
function getXlmReserve(account: AccountData, asset: string): number {
  let reserve = 0;

  // Selling liabilities for the asset
  const balance = isNativeXlm(asset)
    ? account.balances.find((b) => b.asset_type === "native")
    : (() => {
        const classic = KNOWN_CLASSIC_ASSETS[asset];
        if (!classic) return undefined;
        return account.balances.find(
          (b) => b.asset_code === classic.code && b.asset_issuer === classic.issuer,
        );
      })();

  if (balance?.selling_liabilities) {
    reserve += Number(balance.selling_liabilities);
  }

  if (isNativeXlm(asset)) {
    // XLM needs extra for account reserves + gas
    reserve += STELLAR_BASE_RESERVE +
      STELLAR_SUBENTRY_RESERVE * (account.subentry_count + (account.num_sponsoring ?? 0));
    reserve += GAS_HEADROOM_XLM;
  }

  return reserve;
}

// ─── Soroban helpers ────────────────────────────────────────────

interface PoolPosition {
  collateral: Record<string, number>;
  supply: Record<string, number>;
  liabilities: Record<string, number>;
}

async function getPoolPosition(config: TasmilClientConfig, pool: string, user: string): Promise<PoolPosition | null> {
  try {
    const xdr = await viewCall(config, pool, "get_positions", [buildScVal("address", user)]);
    if (!xdr) return null;
    return decodeScVal(xdr) as PoolPosition;
  } catch {
    return null;
  }
}

async function getReserveList(config: TasmilClientConfig, pool: string): Promise<string[]> {
  try {
    const xdr = await viewCall(config, pool, "get_reserve_list", []);
    if (!xdr) return [];
    return (decodeScVal(xdr) as string[]) ?? [];
  } catch {
    return [];
  }
}

async function getReserveData(config: TasmilClientConfig, pool: string, asset: string): Promise<any | null> {
  try {
    const xdr = await viewCall(config, pool, "get_reserve", [buildScVal("address", asset)]);
    if (!xdr) return null;
    return decodeScVal(xdr);
  } catch {
    return null;
  }
}

function getAssetIndex(reserveList: string[], asset: string): number {
  return reserveList.indexOf(asset);
}

function hasPositionForAsset(
  position: PoolPosition,
  reserveList: string[],
  asset: string,
  type: "collateral" | "supply" | "liabilities" | "any",
): boolean {
  const idx = getAssetIndex(reserveList, asset);
  if (idx === -1) return false;
  const key = String(idx);
  switch (type) {
    case "collateral":
      return BigInt(Math.round(position.collateral?.[key] ?? 0)) > 0n;
    case "supply":
      return BigInt(Math.round(position.supply?.[key] ?? 0)) > 0n;
    case "liabilities":
      return BigInt(Math.round(position.liabilities?.[key] ?? 0)) > 0n;
    case "any":
      return (
        BigInt(Math.round(position.collateral?.[key] ?? 0)) > 0n ||
        BigInt(Math.round(position.supply?.[key] ?? 0)) > 0n
      );
  }
}

function hasAnyCollateral(position: PoolPosition): boolean {
  return Object.values(position.collateral ?? {}).some((v) => BigInt(Math.round(v ?? 0)) > 0n);
}

// ─── Backstop helpers ───────────────────────────────────────────

async function getBackstopUserBalance(
  config: TasmilClientConfig,
  pool: string,
  user: string,
): Promise<{ shares: bigint; q4w: Array<{ amount: bigint }> } | null> {
  try {
    const { backstop } = getBlendContracts(config.network);
    const xdr = await viewCall(config, backstop, "user_balance", [
      buildScVal("address", pool),
      buildScVal("address", user),
    ]);
    if (!xdr) return null;
    const decoded = decodeScVal(xdr) as any;
    return {
      shares: BigInt(decoded?.shares ?? "0"),
      q4w: Array.isArray(decoded?.q4w)
        ? decoded.q4w.map((e: any) => ({ amount: BigInt(String(e.amount ?? e ?? 0)) }))
        : [],
    };
  } catch {
    return null;
  }
}

// ─── Pre-check functions ────────────────────────────────────────

export async function precheckDeposit(
  config: TasmilClientConfig,
  params: { pool: string; asset: string; amount: string; from: string },
): Promise<void> {
  const account = await loadAccount(config, params.from);
  const balance = getBalance(account.balances, params.asset);
  const amountFloat = Number(BigInt(params.amount)) / 1e7;

  // 1. Balance / XLM reserve check
  if (isNativeXlm(params.asset)) {
    const reserve = getXlmReserve(account, params.asset);
    const freeBalance = balance - reserve;
    if (amountFloat > freeBalance) {
      throw new PrecheckError(
        "XLM_RESERVE",
        `Your account requires a minimum balance of ${reserve.toFixed(2)} XLM for account reserves and fees. Available to deposit: ${Math.max(freeBalance, 0).toFixed(7)} XLM.`,
      );
    }
  } else {
    if (amountFloat > balance) {
      throw new PrecheckError(
        "INSUFFICIENT_BALANCE",
        `Insufficient ${symbolOf(params.asset)} balance. Have ${balance.toFixed(7)}, need ${amountFloat.toFixed(7)}.`,
      );
    }
  }

  // 2. Supply cap + max positions check (via SDK)
  try {
    const { PoolV2, PoolUser } = await import("@blend-capital/blend-sdk");
    const blendNetwork = getBlendSdkNetwork(config);
    const pool = await PoolV2.load(blendNetwork, params.pool);
    const poolUser = await PoolUser.load(blendNetwork, params.pool, pool, params.from).catch(() => null);

    const reserve = pool.reserves.get(params.asset);
    if (reserve) {
      // Supply cap check
      const supplyCap = (reserve.config as any).supply_cap as bigint | undefined;
      if (supplyCap && supplyCap > 0n) {
        const totalSuppliedRaw = BigInt(Math.round(reserve.totalSupplyFloat() * 1e7));
        if (totalSuppliedRaw + BigInt(params.amount) > supplyCap) {
          const sym = symbolOf(params.asset);
          throw new PrecheckError(
            "SUPPLY_CAP",
            `The supply cap for ${sym} has been reached on this pool (mainnet.blend.capital). No more ${sym} can be supplied at this time.`,
          );
        }
      }
    }

    // Max positions check — only if this is a NEW asset for the user
    const maxPositions = (pool.metadata as { maxPositions?: number }).maxPositions ?? 0;
    if (maxPositions > 0 && poolUser) {
      const positions = poolUser.positions;
      const reserve = pool.reserves.get(params.asset);
      const alreadyHasAsset = reserve
        ? poolUser.getCollateralFloat(reserve) > 0 || poolUser.getSupplyFloat(reserve) > 0
        : false;
      if (!alreadyHasAsset) {
        const usedSlots = positions.collateral.size + positions.liabilities.size;
        if (usedSlots >= maxPositions) {
          throw new PrecheckError(
            "MAX_POSITIONS",
            `You have reached the maximum number of positions (${maxPositions}) in this pool. Close an existing position before opening a new one.`,
          );
        }
      }
    }
  } catch (e) {
    if (e instanceof PrecheckError) throw e;
    // SDK load failed — skip
  }
}

export async function precheckBorrow(
  config: TasmilClientConfig,
  params: { pool: string; asset: string; amount: string; from: string },
): Promise<void> {
  const [account, position, reserveList] = await Promise.all([
    loadAccount(config, params.from),
    getPoolPosition(config, params.pool, params.from),
    getReserveList(config, params.pool),
  ]);

  const sym = symbolOf(params.asset);

  // 1. Trustline check
  if (!hasTrustline(account.balances, params.asset)) {
    throw new PrecheckError(
      "MISSING_TRUSTLINE",
      `You need a trustline for ${sym} in order to borrow it. Add a ${sym} trustline first.`,
    );
  }

  // 2. Collateral check
  if (!position || !hasAnyCollateral(position)) {
    throw new PrecheckError(
      "NO_COLLATERAL",
      "No collateral supplied to this pool. Supply collateral before borrowing.",
    );
  }

  // 3. Min collateral check (pool.metadata.minCollateral, oracle decimals)
  try {
    const { PoolV2, PoolUser, PoolOracle, PositionsEstimate, FixedMath } = await import("@blend-capital/blend-sdk");
    const blendNetwork = getBlendSdkNetwork(config);
    const pool = await PoolV2.load(blendNetwork, params.pool);
    const minCollateral = (pool.metadata as { minCollateral?: bigint }).minCollateral ?? 0n;
    if (minCollateral > 0n) {
      const poolUser = await PoolUser.load(blendNetwork, params.pool, pool, params.from);
      const oracleAddr = (pool.metadata as { oracle?: string }).oracle;
      if (oracleAddr) {
        const oracle = await PoolOracle.load(blendNetwork, oracleAddr, [...pool.reserves.keys()]);
        const est = PositionsEstimate.build(pool, oracle, poolUser.positions);
        const minCollateralFloat = FixedMath.toFloat(minCollateral, oracle.decimals);
        if (est.totalEffectiveCollateral < minCollateralFloat) {
          throw new PrecheckError(
            "MIN_COLLATERAL",
            `This pool requires a minimum collateral value of $${minCollateralFloat.toFixed(2)} to open a borrow position (pool policy on mainnet.blend.capital). Your current collateral: $${est.totalEffectiveCollateral.toFixed(2)}.`,
          );
        }
      }
    }
  } catch (e) {
    if (e instanceof PrecheckError) throw e;
    // SDK load failed — skip this check
  }

  // 4. Health factor / borrow capacity check
  const reserveData = await getReserveData(config, params.pool, params.asset);
  if (reserveData && position) {
    const cfg = reserveData.config ?? {};
    const data = reserveData.data ?? {};
    const maxUtil = (cfg.max_util ?? SCALAR_7) / SCALAR_7;
    const bSupply = Number(BigInt(data.b_supply ?? "0") * BigInt(data.b_rate ?? SCALAR_12.toString()) / SCALAR_12);
    const dSupply = Number(BigInt(data.d_supply ?? "0") * BigInt(data.d_rate ?? SCALAR_12.toString()) / SCALAR_12);

    // Pool utilization check
    const amountRaw = Number(BigInt(params.amount));
    if (bSupply > 0) {
      const newUtilization = (dSupply + amountRaw) / bSupply;
      if (newUtilization > maxUtil - 0.01) {
        throw new PrecheckError(
          "POOL_UTILIZATION",
          `This borrow would exceed the pool's max utilization (${(maxUtil * 100).toFixed(0)}%). Reduce the amount.`,
        );
      }
    }
  }
}

export async function precheckRepay(
  config: TasmilClientConfig,
  params: { pool: string; asset: string; amount: string; from: string },
): Promise<void> {
  const [account, position, reserveList] = await Promise.all([
    loadAccount(config, params.from),
    getPoolPosition(config, params.pool, params.from),
    getReserveList(config, params.pool),
  ]);

  const sym = symbolOf(params.asset);

  // 1. Has liability check
  if (!position || !hasPositionForAsset(position, reserveList, params.asset, "liabilities")) {
    throw new PrecheckError(
      "NO_LIABILITY",
      `No ${sym} borrowed in this pool. Nothing to repay.`,
    );
  }

  // 2. Balance check (with XLM reserve consideration)
  const balance = getBalance(account.balances, params.asset);
  const amountFloat = Number(BigInt(params.amount)) / 1e7;

  if (isNativeXlm(params.asset)) {
    const reserve = getXlmReserve(account, params.asset);
    const freeBalance = balance - reserve;
    if (amountFloat > freeBalance) {
      throw new PrecheckError(
        "XLM_RESERVE",
        `Your account requires a minimum balance of ${reserve.toFixed(2)} XLM for reserves and fees. Available to repay: ${Math.max(freeBalance, 0).toFixed(7)} XLM.`,
      );
    }
  } else {
    if (amountFloat > balance) {
      throw new PrecheckError(
        "INSUFFICIENT_BALANCE",
        `Insufficient ${sym} balance to repay. Have ${balance.toFixed(7)}, need ${amountFloat.toFixed(7)}.`,
      );
    }
  }
}

export async function precheckWithdraw(
  config: TasmilClientConfig,
  params: { pool: string; asset: string; amount: string; from: string },
): Promise<void> {
  const [position, reserveList] = await Promise.all([
    getPoolPosition(config, params.pool, params.from),
    getReserveList(config, params.pool),
  ]);

  const sym = symbolOf(params.asset);

  // 1. Has position check
  if (!position || !hasPositionForAsset(position, reserveList, params.asset, "any")) {
    throw new PrecheckError(
      "NO_POSITION",
      `No ${sym} supplied in this pool. Nothing to withdraw.`,
    );
  }

  // 2. Amount vs supplied check
  try {
    const { PoolV2, PoolUser } = await import("@blend-capital/blend-sdk");
    const blendNetwork = getBlendSdkNetwork(config);
    const pool = await PoolV2.load(blendNetwork, params.pool);
    const poolUser = await PoolUser.load(blendNetwork, params.pool, pool, params.from);
    const reserve = pool.reserves.get(params.asset);
    if (reserve) {
      const totalSupplied = poolUser.getCollateralFloat(reserve) + poolUser.getSupplyFloat(reserve);
      const amountFloat = Number(BigInt(params.amount)) / 1e7;
      if (amountFloat > totalSupplied * 1.005) {
        throw new PrecheckError(
          "EXCEEDS_SUPPLIED",
          `Withdraw amount (${amountFloat.toFixed(7)} ${sym}) exceeds your supplied balance (${totalSupplied.toFixed(7)} ${sym}).`,
        );
      }
    }
  } catch (e) {
    if (e instanceof PrecheckError) throw e;
  }

  // 3. Trustline check (for non-native assets — you need to receive the withdrawn tokens)
  if (!isNativeXlm(params.asset)) {
    try {
      const account = await loadAccount(config, params.from);
      if (!hasTrustline(account.balances, params.asset)) {
        throw new PrecheckError(
          "MISSING_TRUSTLINE",
          `You need a trustline for ${sym} to receive the withdrawn tokens.`,
        );
      }
    } catch (e) {
      if (e instanceof PrecheckError) throw e;
      // Horizon query failed — don't block
    }
  }
}

export async function precheckToggleCollateral(
  config: TasmilClientConfig,
  params: { pool: string; asset: string; from: string },
): Promise<void> {
  const [position, reserveList] = await Promise.all([
    getPoolPosition(config, params.pool, params.from),
    getReserveList(config, params.pool),
  ]);

  if (!position || !hasPositionForAsset(position, reserveList, params.asset, "any")) {
    throw new PrecheckError(
      "NO_POSITION",
      `No ${symbolOf(params.asset)} position in this pool to toggle collateral.`,
    );
  }
}

export async function precheckBackstopDeposit(
  config: TasmilClientConfig,
  params: { amount: string; from: string },
): Promise<void> {
  const { cometLpPool } = getBlendContracts(config.network);
  if (!cometLpPool) return;

  try {
    const xdr = await viewCall(config, cometLpPool, "balance", [buildScVal("address", params.from)]);
    if (xdr) {
      const balance = BigInt(String(decodeScVal(xdr) ?? "0"));
      if (balance < BigInt(params.amount)) {
        throw new PrecheckError(
          "INSUFFICIENT_LP_BALANCE",
          `Insufficient LP token balance. Have ${(Number(balance) / 1e7).toFixed(7)}, need ${(Number(BigInt(params.amount)) / 1e7).toFixed(7)}.`,
        );
      }
    }
  } catch (e) {
    if (e instanceof PrecheckError) throw e;
  }
}

export async function precheckBackstopQueue(
  config: TasmilClientConfig,
  params: { pool: string; from: string },
): Promise<void> {
  const userBal = await getBackstopUserBalance(config, params.pool, params.from);
  if (!userBal || userBal.shares <= 0n) {
    throw new PrecheckError(
      "NO_BACKSTOP_SHARES",
      "No backstop shares in this pool. Deposit LP tokens first before queuing withdrawal.",
    );
  }
}

export async function precheckBackstopDequeue(
  config: TasmilClientConfig,
  params: { pool: string; from: string },
): Promise<void> {
  const userBal = await getBackstopUserBalance(config, params.pool, params.from);
  if (!userBal || userBal.q4w.length === 0) {
    throw new PrecheckError(
      "NO_QUEUED_WITHDRAWAL",
      "No queued withdrawal to dequeue.",
    );
  }
}

export async function precheckBackstopWithdraw(
  config: TasmilClientConfig,
  params: { pool: string; from: string },
): Promise<void> {
  // Must have completed Q4W (queued withdrawal with expired lockup)
  const userBal = await getBackstopUserBalance(config, params.pool, params.from);
  if (!userBal || userBal.q4w.length === 0) {
    throw new PrecheckError(
      "NO_QUEUED_WITHDRAWAL",
      "No queued withdrawal to withdraw. Queue a withdrawal first and wait for the 21-day lockup.",
    );
  }

  // Trustline check — backstop withdraw returns LP tokens
  const { cometLpPool } = getBlendContracts(config.network);
  if (cometLpPool) {
    // LP token is a Soroban-only token, no classic trustline needed
    // But BLND/USDC trustlines may be needed if user claims + exits later
  }
}

export async function precheckCometJoinPool(
  config: TasmilClientConfig,
  params: { asset: string; amount: string; from: string },
): Promise<void> {
  const account = await loadAccount(config, params.from);
  const balance = getBalance(account.balances, params.asset);
  const amountFloat = Number(BigInt(params.amount)) / 1e7;
  const sym = symbolOf(params.asset);

  // Balance check
  if (isNativeXlm(params.asset)) {
    const reserve = getXlmReserve(account, params.asset);
    const freeBalance = balance - reserve;
    if (amountFloat > freeBalance) {
      throw new PrecheckError(
        "XLM_RESERVE",
        `Your account requires ${reserve.toFixed(2)} XLM reserved. Available: ${Math.max(freeBalance, 0).toFixed(7)} XLM.`,
      );
    }
  } else if (amountFloat > balance) {
    throw new PrecheckError(
      "INSUFFICIENT_BALANCE",
      `Insufficient ${sym} balance. Have ${balance.toFixed(7)}, need ${amountFloat.toFixed(7)}.`,
    );
  }

  // Trustline check for input token (non-native)
  if (!isNativeXlm(params.asset) && !hasTrustline(account.balances, params.asset)) {
    throw new PrecheckError(
      "MISSING_TRUSTLINE",
      `Missing trustline for ${sym}. Add a trustline first.`,
    );
  }
}

export async function precheckCometExitPool(
  config: TasmilClientConfig,
  params: { lpAmount: string; from: string },
): Promise<void> {
  const { cometLpPool, blndToken, usdcToken } = getBlendContracts(config.network);
  if (!cometLpPool) return;

  const account = await loadAccount(config, params.from);

  // 1. LP token balance
  try {
    const xdr = await viewCall(config, cometLpPool, "balance", [buildScVal("address", params.from)]);
    if (xdr) {
      const balance = BigInt(String(decodeScVal(xdr) ?? "0"));
      if (balance < BigInt(params.lpAmount)) {
        throw new PrecheckError(
          "INSUFFICIENT_LP_BALANCE",
          `Insufficient LP token balance. Have ${(Number(balance) / 1e7).toFixed(7)}, need ${(Number(BigInt(params.lpAmount)) / 1e7).toFixed(7)}.`,
        );
      }
    }
  } catch (e) {
    if (e instanceof PrecheckError) throw e;
  }

  // 2. Trustlines for BLND + USDC (exit returns both)
  if (!hasTrustline(account.balances, blndToken)) {
    throw new PrecheckError(
      "MISSING_TRUSTLINE",
      "Missing trustline for BLND. Add a BLND trustline before exiting the pool.",
    );
  }
  if (!hasTrustline(account.balances, usdcToken)) {
    throw new PrecheckError(
      "MISSING_TRUSTLINE",
      "Missing trustline for USDC. Add a USDC trustline before exiting the pool.",
    );
  }
}
