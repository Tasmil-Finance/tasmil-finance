"use client";

import { Clock } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityItem } from "@/features/account/types";
import { Skeleton } from "@/shared/ui/skeleton";
import { type DatedItem, groupByDate } from "@/shared/utils/date-group";
import { useAccountActivityInfinite } from "../hooks/use-account-activity-infinite";
import { ActivityRow } from "./activity-row";
import { FilterChips, type FilterChip } from "./filter-chips";

type ProtocolFilter = "all" | "blend" | "soroswap" | "aquarius" | "phoenix";
type AssetFilter = "all" | "USDC" | "XLM";

const PROTOCOL_CHIPS: FilterChip<ProtocolFilter>[] = [
  { value: "all", label: "All" },
  { value: "blend", label: "Blend" },
  { value: "soroswap", label: "Soroswap" },
  { value: "aquarius", label: "Aquarius" },
  { value: "phoenix", label: "Phoenix" },
];

const ASSET_CHIPS: FilterChip<AssetFilter>[] = [
  { value: "all", label: "All assets" },
  { value: "USDC", label: "USDC" },
  { value: "XLM", label: "XLM" },
];

export interface ProtocolHistoryViewProps {
  walletAddress: string;
}

export function ProtocolHistoryView({ walletAddress }: ProtocolHistoryViewProps) {
  const {
    activities,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useAccountActivityInfinite(walletAddress, "protocol");
  const [protocol, setProtocol] = useState<ProtocolFilter>("all");
  const [asset, setAsset] = useState<AssetFilter>("all");

  const filtered = useMemo(
    () =>
      activities.filter((a) => {
        if (protocol !== "all" && a.pool?.protocol?.toLowerCase() !== protocol) {
          return false;
        }
        if (asset !== "all" && a.token !== asset) return false;
        return true;
      }),
    [activities, protocol, asset]
  );

  if (isLoading) return <ActivityListSkeleton />;
  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Could not load activity: {error.message}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <FilterChips
          ariaLabel="Filter by protocol"
          chips={PROTOCOL_CHIPS}
          active={protocol}
          onChange={setProtocol}
        />
        <FilterChips
          ariaLabel="Filter by asset"
          chips={ASSET_CHIPS}
          active={asset}
          onChange={setAsset}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState protocol={protocol} />
      ) : (
        <ActivityGroups items={filtered} />
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={fetchNextPage}
          disabled={isFetchingNextPage}
          className="self-center rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/30 disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

function ActivityGroups({ items }: { items: ActivityItem[] }) {
  const dated: (ActivityItem & DatedItem)[] = items.map((a) => ({ ...a }));
  const groups = groupByDate(dated);
  return (
    <>
      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-2">
          <h3 className="px-1 pt-2 text-sm font-semibold text-muted-foreground">
            {group.label}
          </h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col divide-y divide-border">
              {group.items.map((a) => (
                <ActivityRow key={a.id} activity={a} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

function EmptyState({ protocol }: { protocol: string }) {
  const copy =
    protocol === "all" ? "No protocol activity yet" : `No ${protocol} activity yet`;
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
      <Clock className="h-8 w-8 opacity-40" />
      <p className="text-sm">{copy}</p>
    </div>
  );
}

function ActivityListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-6 py-3.5">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
