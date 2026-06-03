/**
 * Blend V2 operation builders — build unsigned transaction XDR for pool operations.
 * Each method returns { xdr, estimatedFee } ready for wallet signing.
 */

import { xdr as stellarXdr } from "@stellar/stellar-sdk";
import type { TasmilClientConfig, TxBuildResult } from "../../types/common.js";
import { invokeContract, viewCall, buildScVal } from "../../utils/soroban.js";
import { getBlendContracts } from "../../utils/contracts.js";
import { decodeScVal } from "../../utils/xdr-parser.js";
import { resolveContractSymbol } from "../../utils/asset-resolver.js";
import { getBlendPoolByAddress, getBlendUserPositions } from "./pools.js";
import {
  PrecheckError,
  precheckDeposit,
  precheckBorrow,
  precheckRepay,
  precheckWithdraw,
  precheckToggleCollateral,
  precheckBackstopDeposit,
  precheckBackstopQueue,
  precheckBackstopDequeue,
  precheckBackstopWithdraw,
  precheckCometJoinPool,
  precheckCometExitPool,
} from "./prechecks.js";

// ─── Request types (from Blend pool contract) ───────────────────

const REQUEST_TYPE = {
  Supply: 0,
  Withdraw: 1,
  SupplyCollateral: 2,
  WithdrawCollateral: 3,
  Borrow: 4,
  Repay: 5,
} as const;

// ─── Args builders ──────────────────────────────────────────────

function buildSubmitArgs(
  from: string,
  requestType: number,
  asset: string,
  amount: string,
): stellarXdr.ScVal[] {
  const request = stellarXdr.ScVal.scvMap([
    new stellarXdr.ScMapEntry({ key: buildScVal("symbol", "address"), val: buildScVal("address", asset) }),
    new stellarXdr.ScMapEntry({ key: buildScVal("symbol", "amount"), val: buildScVal("i128", amount) }),
    new stellarXdr.ScMapEntry({ key: buildScVal("symbol", "request_type"), val: buildScVal("u32", requestType) }),
  ]);
  return [
    buildScVal("address", from),
    buildScVal("address", from),
    buildScVal("address", from),
    stellarXdr.ScVal.scvVec([request]),
  ];
}

function buildBatchSubmitArgs(
  from: string,
  asset: string,
  amount: string,
  requestTypes: number[],
): stellarXdr.ScVal[] {
  const requests = requestTypes.map((rt) =>
    stellarXdr.ScVal.scvMap([
      new stellarXdr.ScMapEntry({ key: buildScVal("symbol", "address"), val: buildScVal("address", asset) }),
      new stellarXdr.ScMapEntry({ key: buildScVal("symbol", "amount"), val: buildScVal("i128", amount) }),
      new stellarXdr.ScMapEntry({ key: buildScVal("symbol", "request_type"), val: buildScVal("u32", rt) }),
    ]),
  );
  return [
    buildScVal("address", from),
    buildScVal("address", from),
    buildScVal("address", from),
    stellarXdr.ScVal.scvVec(requests),
  ];
}

// ─── Common params ──────────────────────────────────────────────

export interface BlendOperationParams {
  pool: string;
  asset: string;
  amount: string;
  from: string;
}

// ─── Build helpers ──────────────────────────────────────────────

async function buildPoolOp(
  config: TasmilClientConfig,
  params: BlendOperationParams,
  requestType: number,
): Promise<TxBuildResult> {
  const args = buildSubmitArgs(params.from, requestType, params.asset, params.amount);
  const [result, poolData, positions] = await Promise.all([
    invokeContract(config, params.pool, "submit", args, params.from),
    getBlendPoolByAddress(config, params.pool).catch(() => null),
    getBlendUserPositions(config, params.pool, params.from).catch(() => null),
  ]);

  const reserve = poolData?.reserves.find((r: { assetAddress: string }) => r.assetAddress === params.asset);
  let currentSupplied: number | null = null;
  let currentBorrowed: number | null = null;
  if (positions) {
    const supplyPos = [...(positions.collateral ?? []), ...(positions.supply ?? [])].find(
      (p: { assetAddress: string; amount: number }) => p.assetAddress === params.asset,
    );
    if (supplyPos) currentSupplied = supplyPos.amount;
    const borrowPos = (positions.liabilities ?? []).find((p: { assetAddress: string; amount: number }) => p.assetAddress === params.asset);
    if (borrowPos) currentBorrowed = borrowPos.amount;
  }

  return {
    xdr: result.xdr,
    estimatedFee: result.simulationResult.resourceFee,
    context: {
      symbol: reserve?.symbol,
      reserveApy: reserve
        ? { supplyApy: reserve.supplyApy * 100, borrowApy: reserve.borrowApy * 100 }
        : undefined,
      currentPosition:
        currentSupplied != null || currentBorrowed != null
          ? { suppliedAmount: currentSupplied, borrowedAmount: currentBorrowed }
          : undefined,
    },
  };
}

// ─── Public API ─────────────────────────────────────────────────

export async function buildDeposit(
  config: TasmilClientConfig,
  params: BlendOperationParams,
): Promise<TxBuildResult> {
  await precheckDeposit(config, params);
  return buildPoolOp(config, params, REQUEST_TYPE.SupplyCollateral);
}

export async function buildWithdraw(
  config: TasmilClientConfig,
  params: BlendOperationParams,
): Promise<TxBuildResult> {
  await precheckWithdraw(config, params);
  // Auto-detect: collateral vs supply
  const isCollateral = await detectIsCollateral(config, params.pool, params.asset, params.from);
  const requestType = isCollateral ? REQUEST_TYPE.WithdrawCollateral : REQUEST_TYPE.Withdraw;
  return buildPoolOp(config, params, requestType);
}

export async function buildBorrow(
  config: TasmilClientConfig,
  params: BlendOperationParams,
): Promise<TxBuildResult> {
  await precheckBorrow(config, params);
  return buildPoolOp(config, params, REQUEST_TYPE.Borrow);
}

export async function buildRepay(
  config: TasmilClientConfig,
  params: BlendOperationParams,
): Promise<TxBuildResult> {
  await precheckRepay(config, params);
  return buildPoolOp(config, params, REQUEST_TYPE.Repay);
}

export async function buildToggleCollateral(
  config: TasmilClientConfig,
  params: BlendOperationParams & { enable: boolean },
): Promise<TxBuildResult> {
  await precheckToggleCollateral(config, params);

  // Detect current state to choose correct request types
  const isCurrentlyCollateral = await detectIsCollateral(config, params.pool, params.asset, params.from);

  if (params.enable && isCurrentlyCollateral) {
    throw new PrecheckError("ALREADY_COLLATERAL", "This asset is already used as collateral.");
  }
  if (!params.enable && !isCurrentlyCollateral) {
    throw new PrecheckError("ALREADY_SUPPLY", "This asset is already in supply (non-collateral) mode.");
  }

  // enable=true: currently supply → withdraw supply + deposit as collateral
  // enable=false: currently collateral → withdraw collateral + deposit as supply
  const requestTypes = params.enable
    ? [REQUEST_TYPE.Withdraw, REQUEST_TYPE.SupplyCollateral]
    : [REQUEST_TYPE.WithdrawCollateral, REQUEST_TYPE.Supply];

  const args = buildBatchSubmitArgs(params.from, params.asset, params.amount, requestTypes);
  const result = await invokeContract(config, params.pool, "submit", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

async function detectIsCollateral(
  config: TasmilClientConfig,
  pool: string,
  asset: string,
  user: string,
): Promise<boolean> {
  try {
    const [posXdr, listXdr] = await Promise.all([
      viewCall(config, pool, "get_positions", [buildScVal("address", user)]),
      viewCall(config, pool, "get_reserve_list", []),
    ]);
    if (!posXdr || !listXdr) return true; // default to collateral
    const position = decodeScVal(posXdr) as any;
    const reserveList = decodeScVal(listXdr) as string[];
    const idx = reserveList.indexOf(asset);
    if (idx === -1) return true;
    const key = String(idx);
    return BigInt(Math.round(position.collateral?.[key] ?? 0)) > 0n;
  } catch {
    return true;
  }
}

// ─── Backstop operations ────────────────────────────────────────

export interface BackstopOperationParams {
  pool: string;
  amount: string;
  from: string;
}

export async function buildBackstopDeposit(
  config: TasmilClientConfig,
  params: BackstopOperationParams,
): Promise<TxBuildResult> {
  await precheckBackstopDeposit(config, params);
  const { backstop } = getBlendContracts(config.network);
  const args = [
    buildScVal("address", params.from),
    buildScVal("address", params.pool),
    buildScVal("i128", params.amount),
  ];
  const result = await invokeContract(config, backstop, "deposit", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

export async function buildBackstopQueueWithdrawal(
  config: TasmilClientConfig,
  params: BackstopOperationParams,
): Promise<TxBuildResult> {
  await precheckBackstopQueue(config, params);
  const { backstop } = getBlendContracts(config.network);
  const args = [
    buildScVal("address", params.from),
    buildScVal("address", params.pool),
    buildScVal("i128", params.amount),
  ];
  const result = await invokeContract(config, backstop, "queue_withdrawal", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

export async function buildBackstopDequeueWithdrawal(
  config: TasmilClientConfig,
  params: BackstopOperationParams,
): Promise<TxBuildResult> {
  await precheckBackstopDequeue(config, params);
  const { backstop } = getBlendContracts(config.network);
  const args = [
    buildScVal("address", params.from),
    buildScVal("address", params.pool),
    buildScVal("i128", params.amount),
  ];
  const result = await invokeContract(config, backstop, "dequeue_withdrawal", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

export async function buildBackstopWithdraw(
  config: TasmilClientConfig,
  params: BackstopOperationParams,
): Promise<TxBuildResult> {
  await precheckBackstopWithdraw(config, params);
  const { backstop } = getBlendContracts(config.network);
  const args = [
    buildScVal("address", params.from),
    buildScVal("address", params.pool),
    buildScVal("i128", params.amount),
  ];
  const result = await invokeContract(config, backstop, "withdraw", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

// ─── Comet LP operations ────────────────────────────────────────

export interface CometJoinParams {
  asset: string;
  amount: string;
  from: string;
  minLpOut?: string;
}

export async function buildCometJoinPool(
  config: TasmilClientConfig,
  params: CometJoinParams,
): Promise<TxBuildResult> {
  await precheckCometJoinPool(config, params);
  const { cometLpPool } = getBlendContracts(config.network);
  if (!cometLpPool) throw new Error("Comet LP pool not configured for this network");
  const args = [
    buildScVal("address", params.asset),
    buildScVal("i128", params.amount),
    buildScVal("i128", params.minLpOut ?? "0"),
    buildScVal("address", params.from),
  ];
  const result = await invokeContract(config, cometLpPool, "dep_tokn_amt_in_get_lp_tokns_out", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

export interface CometExitParams {
  lpAmount: string;
  from: string;
  minBlndOut?: string;
  minUsdcOut?: string;
}

export async function buildCometExitPool(
  config: TasmilClientConfig,
  params: CometExitParams,
): Promise<TxBuildResult> {
  await precheckCometExitPool(config, params);
  const { cometLpPool } = getBlendContracts(config.network);
  if (!cometLpPool) throw new Error("Comet LP pool not configured for this network");
  const args = [
    buildScVal("i128", params.lpAmount),
    stellarXdr.ScVal.scvVec([
      buildScVal("i128", params.minBlndOut ?? "0"),
      buildScVal("i128", params.minUsdcOut ?? "0"),
    ]),
    buildScVal("address", params.from),
  ];
  const result = await invokeContract(config, cometLpPool, "exit_pool", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}

export async function buildClaimEmissions(
  config: TasmilClientConfig,
  params: { pool: string; from: string; reserveTokenIds: number[] },
): Promise<TxBuildResult> {
  const args = [
    buildScVal("address", params.from),
    stellarXdr.ScVal.scvVec(params.reserveTokenIds.map((id) => buildScVal("u32", String(id)))),
    buildScVal("address", params.from),
  ];
  const result = await invokeContract(config, params.pool, "claim", args, params.from);
  return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
}
