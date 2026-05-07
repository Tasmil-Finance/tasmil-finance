"use client";

import { Address, Contract, rpc, scValToNative, TransactionBuilder } from "@stellar/stellar-sdk";
import { useQueries } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";
import type { SorobanTokenMeta } from "../lib/types";

const SOURCE_ACCOUNT_FOR_SIM = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

async function simulateRead(contractId: string, method: "decimals" | "symbol"): Promise<unknown> {
  const server = new rpc.Server(activeNetwork.sorobanRpcUrl, { allowHttp: false });
  const account = await server.getAccount(SOURCE_ACCOUNT_FOR_SIM).catch(() => ({
    accountId: () => SOURCE_ACCOUNT_FOR_SIM,
    sequenceNumber: () => "0",
    incrementSequenceNumber: () => undefined,
  }));
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account as never, {
    fee: "100",
    networkPassphrase: activeNetwork.networkPassphrase,
  })
    .addOperation(contract.call(method))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if ("error" in sim || sim.result === undefined) {
    throw new Error(
      typeof (sim as { error?: unknown }).error === "string"
        ? (sim as { error: string }).error
        : "simulate failed"
    );
  }
  return scValToNative(sim.result.retval);
}

async function fetchTokenMeta(contractId: string): Promise<SorobanTokenMeta> {
  // Defensive: bad input -> throw, RQ caches the rejected query short-term.
  Address.fromString(contractId);
  const [decimals, symbol] = await Promise.all([
    simulateRead(contractId, "decimals") as Promise<number>,
    simulateRead(contractId, "symbol") as Promise<string>,
  ]);
  const code = symbol === "native" ? "XLM" : String(symbol);
  return { code, decimals: Number(decimals), contractId };
}

export function useSorobanTokenMeta(contractIds: ReadonlyArray<string>) {
  const unique = Array.from(new Set(contractIds.filter(Boolean)));
  const queries = useQueries({
    queries: unique.map((id) => ({
      queryKey: ["soroban", "token-meta", activeNetwork.networkPassphrase, id] as const,
      queryFn: () => fetchTokenMeta(id),
      staleTime: Infinity,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 1,
    })),
  });

  const map = new Map<string, SorobanTokenMeta>();
  unique.forEach((id, i) => {
    const q = queries[i];
    if (q?.data) map.set(id, q.data);
  });

  const lookup = (id: string): SorobanTokenMeta | undefined => map.get(id);
  const isLoading = queries.some((q) => q.isLoading);
  return { lookup, isLoading };
}
