/**
 * Soroban contract invocation helpers.
 * Adapted from apps/mcp-stellar/src/services/soroban-service.ts
 * Now accepts explicit config instead of reading env vars.
 */

import {
  TransactionBuilder,
  Account,
  xdr,
  Address,
  nativeToScVal,
  Contract,
} from "@stellar/stellar-sdk";
import { rpc } from "@stellar/stellar-sdk";
import type { TasmilClientConfig, SimulationResult, XDR } from "../types/common.js";
import { createSorobanClient, createHorizonClient } from "./stellar-client.js";
import { getNetworkPassphrase } from "./network.js";

export class SimulationError extends Error {
  public readonly details?: string;
  constructor(message: string, details?: string) {
    super(message);
    this.name = "SimulationError";
    this.details = details;
  }
}

/**
 * Build and simulate a contract invocation. Returns assembled (unsigned) XDR.
 */
export async function invokeContract(
  config: TasmilClientConfig,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  sourceAddress: string,
): Promise<{ xdr: XDR; simulationResult: SimulationResult }> {
  const soroban = createSorobanClient(config);
  const horizon = createHorizonClient(config);
  const networkPassphrase = getNetworkPassphrase(config.network);

  const account = await horizon.loadAccount(sourceAddress);
  const contract = new Contract(contractId);
  const operation = contract.call(method, ...args);

  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simulation = await soroban.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new SimulationError(
      `Contract simulation failed: ${simulation.error}`,
      simulation.error,
    );
  }

  if (!rpc.Api.isSimulationSuccess(simulation)) {
    throw new SimulationError("Simulation returned unexpected result");
  }

  const preparedTx = rpc.assembleTransaction(tx, simulation).build();
  return {
    xdr: preparedTx.toXDR(),
    simulationResult: extractSimulationResult(simulation),
  };
}

/**
 * Read-only contract call. No Horizon account load needed.
 */
export async function viewCall(
  config: TasmilClientConfig,
  contractId: string,
  method: string,
  args: xdr.ScVal[],
): Promise<string | null> {
  const soroban = createSorobanClient(config);
  const networkPassphrase = getNetworkPassphrase(config.network);

  const account = new Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0",
  );

  const contract = new Contract(contractId);
  const operation = contract.call(method, ...args);

  const tx = new TransactionBuilder(account, {
    fee: "10000000",
    networkPassphrase,
  })
    .addOperation(operation)
    .setTimeout(300)
    .build();

  const simulation = await soroban.simulateTransaction(tx);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new SimulationError(
      `View call failed: ${simulation.error}`,
      simulation.error,
    );
  }

  if (!rpc.Api.isSimulationSuccess(simulation)) {
    throw new SimulationError("View call returned unexpected result");
  }

  if (simulation.result?.retval) {
    return simulation.result.retval.toXDR("base64");
  }
  return null;
}

function extractSimulationResult(
  sim: rpc.Api.SimulateTransactionSuccessResponse,
): SimulationResult {
  const footprint: SimulationResult["footprint"] = {
    readOnly: [],
    readWrite: [],
  };

  if (sim.transactionData) {
    const data = sim.transactionData.build();
    const ro = data.resources().footprint().readOnly();
    const rw = data.resources().footprint().readWrite();
    footprint.readOnly = ro.map((k: xdr.LedgerKey) => k.toXDR("base64"));
    footprint.readWrite = rw.map((k: xdr.LedgerKey) => k.toXDR("base64"));
  }

  return {
    result: sim.result?.retval?.toXDR("base64") ?? null,
    resourceFee: sim.minResourceFee ?? "0",
    auth: sim.result?.auth?.map((a) => a.toXDR("base64")) ?? [],
    footprint,
    cost: {
      cpuInsns: String((sim as unknown as { cost?: { cpuInsns?: string } }).cost?.cpuInsns ?? "0"),
      memBytes: String((sim as unknown as { cost?: { memBytes?: string } }).cost?.memBytes ?? "0"),
    },
  };
}

export function buildScVal(type: string, value: unknown): xdr.ScVal {
  switch (type) {
    case "address": {
      if (
        typeof value === "string" &&
        (value.startsWith("G") || value.startsWith("M"))
      ) {
        return nativeToScVal(value, { type: "address" });
      }
      return new Address(value as string).toScVal();
    }
    case "i128":
      return nativeToScVal(BigInt(value as string | number | bigint), { type: "i128" });
    case "u128":
      return nativeToScVal(BigInt(value as string | number | bigint), { type: "u128" });
    case "u64":
      return nativeToScVal(BigInt(value as string | number | bigint), { type: "u64" });
    case "i64":
      return nativeToScVal(BigInt(value as string | number | bigint), { type: "i64" });
    case "u32":
      return nativeToScVal(Number(value), { type: "u32" });
    case "i32":
      return nativeToScVal(Number(value), { type: "i32" });
    case "bool":
      return nativeToScVal(Boolean(value), { type: "bool" });
    case "string":
      return nativeToScVal(String(value), { type: "string" });
    case "symbol":
      return nativeToScVal(String(value), { type: "symbol" });
    case "bytes": {
      const buf =
        typeof value === "string"
          ? Buffer.from(value, "hex")
          : Buffer.from(value as ArrayBuffer);
      return xdr.ScVal.scvBytes(buf);
    }
    default:
      return nativeToScVal(value);
  }
}
