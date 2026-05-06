"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";
import type { RawHorizonOp } from "../lib/decode-operation";
import type { TxAttrs } from "../lib/types";

export type { RawHorizonOp };

interface HorizonTransactionAttrs {
  fee_charged?: string;
  memo?: string;
  memo_type?: string;
  ledger?: number;
  envelope_xdr?: string;
  operation_count?: number;
  successful?: boolean;
}

interface HorizonOperationRecord extends RawHorizonOp {
  transaction?: HorizonTransactionAttrs;
}

interface HorizonOperationsPage {
  _embedded: { records: HorizonOperationRecord[] };
}

export interface OperationsPage {
  ops: RawHorizonOp[];
  attrsByTx: Record<string, TxAttrs>;
  nextCursor: string | null;
}

const PAGE_SIZE = 20;

function attrsFromTx(tx: HorizonTransactionAttrs | undefined): TxAttrs {
  if (!tx) return {};
  const memoType = tx.memo_type === "none" ? null : (tx.memo_type ?? null);
  return {
    feeChargedStroops: tx.fee_charged,
    memo: tx.memo ?? null,
    memoType,
    ledger: tx.ledger,
    envelopeXdr: tx.envelope_xdr,
    operationCount: tx.operation_count,
  };
}

async function fetchOperations(address: string, cursor?: string): Promise<OperationsPage> {
  const params = new URLSearchParams({
    order: "desc",
    limit: String(PAGE_SIZE),
    include_failed: "true",
    join: "transactions",
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(
    `${activeNetwork.horizonUrl}/accounts/${address}/operations?${params.toString()}`
  );
  if (!res.ok) return { ops: [], attrsByTx: {}, nextCursor: null };

  const data: HorizonOperationsPage = await res.json();
  const records = data._embedded?.records ?? [];

  const attrsByTx: Record<string, TxAttrs> = {};
  const ops: RawHorizonOp[] = records.map((r) => {
    const { transaction, ...op } = r;
    if (transaction && !attrsByTx[op.transaction_hash]) {
      attrsByTx[op.transaction_hash] = attrsFromTx(transaction);
    }
    if (transaction?.successful !== undefined && op.transaction_successful === undefined) {
      op.transaction_successful = transaction.successful;
    }
    return op;
  });

  const lastPagingToken = records.at(-1)?.paging_token ?? null;
  return {
    ops,
    attrsByTx,
    nextCursor: records.length === PAGE_SIZE ? lastPagingToken : null,
  };
}

export function useStellarTransactions(address: string | null | undefined) {
  return useInfiniteQuery<OperationsPage, Error>({
    queryKey: ["profile", "transactions", address],
    queryFn: ({ pageParam }) => fetchOperations(address!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!address,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
