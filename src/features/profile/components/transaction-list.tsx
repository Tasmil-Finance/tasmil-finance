"use client";

import { Clock, Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/shared/ui/skeleton";
import { groupByMonth } from "@/shared/utils/date-group";
import { useSorobanTokenMeta } from "../hooks/use-soroban-token-meta";
import { useStellarTransactions } from "../hooks/use-stellar-transactions";
import { decodeOperation } from "../lib/decode-operation";
import { groupByTransaction } from "../lib/group-by-transaction";
import type { DecodedOp, OpKind, TxGroup } from "../lib/types";
import {
  type FilterCategory,
  type FilterState,
  TransactionFilterBar,
} from "./transaction-filter-bar";
import { TransactionRow } from "./transaction-row";

const KIND_TO_CATEGORY: Record<OpKind, FilterCategory> = {
  send: "transfer",
  receive: "transfer",
  "create-account": "transfer",
  swap: "swap",
  "lp-deposit": "defi",
  "lp-withdraw": "defi",
  "lend-deposit": "defi",
  "lend-withdraw": "defi",
  harvest: "defi",
  "trustline-add": "other",
  "trustline-remove": "other",
  "merge-account": "other",
  "claim-balance": "other",
  "lock-balance": "other",
  "dex-offer": "other",
  "contract-other": "other",
  "classic-other": "other",
};

function passesFilters(group: TxGroup, state: FilterState): boolean {
  if (state.filters.length > 0) {
    const cat = KIND_TO_CATEGORY[group.primary.kind];
    const failedMatched = !group.successful && state.filters.includes("failed");
    const catMatched = state.filters.includes(cat);
    if (!failedMatched && !catMatched) return false;
  }
  if (state.query) {
    const q = state.query.toLowerCase();
    const inHash = group.txHash.toLowerCase().includes(q);
    const inAddr = group.ops.some((o) => o.counterparty?.toLowerCase().includes(q));
    const inAsset = group.ops.some((o) => o.deltas.some((d) => d.code.toLowerCase().includes(q)));
    if (!inHash && !inAddr && !inAsset) return false;
  }
  return true;
}

function parseFilters(value: string | null): FilterCategory[] {
  if (!value) return [];
  const valid: FilterCategory[] = ["transfer", "swap", "defi", "other", "failed"];
  return value.split(",").filter((v): v is FilterCategory => (valid as string[]).includes(v));
}

type DatedGroup = TxGroup;

export function TransactionList({ address }: { address: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterState = useMemo<FilterState>(
    () => ({
      filters: parseFilters(searchParams.get("filter")),
      query: searchParams.get("q") ?? "",
    }),
    [searchParams],
  );

  const setFilterState = useCallback(
    (next: FilterState) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.filters.length === 0) params.delete("filter");
      else params.set("filter", next.filters.join(","));
      if (!next.query) params.delete("q");
      else params.set("q", next.query);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams],
  );

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useStellarTransactions(address);

  const allRaw = data?.pages.flatMap((p) => p.ops) ?? [];
  const allAttrs = (data?.pages ?? []).reduce<Record<string, NonNullable<TxGroup["attrs"]>>>(
    (acc, p) => Object.assign(acc, p.attrsByTx),
    {},
  );

  const contractIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRaw) {
      for (const c of r.asset_balance_changes ?? []) {
        if (c.asset_type !== "native" && c.asset_issuer) set.add(c.asset_issuer);
      }
    }
    return Array.from(set);
  }, [allRaw]);

  const { lookup } = useSorobanTokenMeta(contractIds);

  const decoded: DecodedOp[] = useMemo(
    () => allRaw.map((r) => decodeOperation(r, address, lookup)),
    [allRaw, address, lookup],
  );

  const groups = useMemo(() => groupByTransaction(decoded, allAttrs), [decoded, allAttrs]);
  const filtered = useMemo(
    () => groups.filter((g) => passesFilters(g, filterState)),
    [groups, filterState],
  );

  const datedGroups = useMemo(() => groupByMonth<DatedGroup>(filtered), [filtered]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-6 w-52" />
        {[4, 3].map((count, gi) => (
          <div key={gi} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="w-44 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <div className="flex flex-1 items-center gap-2.5">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <p className="font-medium text-foreground">No transactions yet</p>
          <p className="max-w-xs text-center text-sm text-muted-foreground">
            Stellar operations will appear here as you transact on-chain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <TransactionFilterBar
        value={filterState}
        onChange={setFilterState}
        totalCount={groups.length}
      />

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No transactions match these filters.
        </div>
      )}

      {datedGroups.map((dateGroup) => (
        <div key={dateGroup.key} className="flex flex-col gap-2">
          <p className="px-1 pt-2 text-sm font-semibold text-muted-foreground">{dateGroup.label}</p>
          <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border/60">
            {dateGroup.items.map((g) => (
              <TransactionRow key={g.txHash} group={g} address={address} />
            ))}
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more…
            </div>
          )}
        </div>
      )}

      {!hasNextPage && groups.length > 0 && (
        <p className="py-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground/30">
          End of history
        </p>
      )}
    </div>
  );
}
