"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { activeNetwork } from "@/shared/config/stellar";

export interface StellarOperation {
  id: string;
  type: string;
  createdAt: string;
  transactionHash: string;
  pagingToken: string;
  // payment / create_account
  amount?: string;
  assetCode?: string;
  assetType?: string;
  from?: string;
  to?: string;
  // path_payment
  sourceAmount?: string;
  sourceAsset?: string;
  destinationAmount?: string;
  destinationAsset?: string;
  // manage_sell_offer / manage_buy_offer
  price?: string;
  // account_merge
  into?: string;
}

interface HorizonOperationRecord {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  paging_token: string;
  amount?: string;
  asset_code?: string;
  asset_type?: string;
  from?: string;
  to?: string;
  source_amount?: string;
  source_asset_code?: string;
  source_asset_type?: string;
  destination_amount?: string;
  destination_asset_code?: string;
  destination_asset_type?: string;
  price?: string;
  into?: string;
}

interface HorizonOperationsPage {
  _embedded: { records: HorizonOperationRecord[] };
}

interface OperationsPage {
  operations: StellarOperation[];
  nextCursor: string | null;
}

async function fetchOperations(address: string, cursor?: string): Promise<OperationsPage> {
  const params = new URLSearchParams({
    order: "desc",
    limit: "20",
    include_failed: "false",
  });
  if (cursor) params.set("cursor", cursor);

  const res = await fetch(
    `${activeNetwork.horizonUrl}/accounts/${address}/operations?${params.toString()}`
  );
  if (!res.ok) return { operations: [], nextCursor: null };

  const data: HorizonOperationsPage = await res.json();
  const records = data._embedded?.records ?? [];

  const operations: StellarOperation[] = records.map((r) => ({
    id: r.id,
    type: r.type,
    createdAt: r.created_at,
    transactionHash: r.transaction_hash,
    pagingToken: r.paging_token,
    amount: r.amount,
    assetCode: r.asset_type === "native" ? "XLM" : r.asset_code,
    assetType: r.asset_type,
    from: r.from,
    to: r.to,
    sourceAmount: r.source_amount,
    sourceAsset: r.source_asset_type === "native" ? "XLM" : r.source_asset_code,
    destinationAmount: r.destination_amount,
    destinationAsset: r.destination_asset_type === "native" ? "XLM" : r.destination_asset_code,
    price: r.price,
    into: r.into,
  }));

  const lastPagingToken = records.at(-1)?.paging_token ?? null;

  return {
    operations,
    nextCursor: records.length === 20 ? lastPagingToken : null,
  };
}

export function useStellarTransactions(address: string | null | undefined) {
  return useInfiniteQuery<OperationsPage, Error>({
    queryKey: ["profile", "transactions", address],
    queryFn: ({ pageParam }) =>
      fetchOperations(address!, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!address,
    staleTime: 8_000,
    refetchInterval: 10_000,
  });
}
