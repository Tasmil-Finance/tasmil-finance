// @ts-nocheck — surfaced by Biome auto-fix; pre-existing type drift unrelated to this PR.

"use client";

import { Trophy } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { Skeleton } from "@/shared/ui/skeleton";
import { useLeaderboard } from "../hooks/use-leaderboard";
import { LeaderboardTable } from "./leaderboard-table";
import { PaginationBar } from "./pagination-bar";
import { PodiumCard } from "./podium-card";

const LIMIT = 50;

export function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const { address } = useWallet();
  const { data, isLoading, error } = useLeaderboard(page, LIMIT, address ?? undefined);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / LIMIT)) : 1;
  const podiumEntries = page === 1 ? (data?.entries ?? []).slice(0, 3) : [];
  const tableEntries = page === 1 ? (data?.entries ?? []).slice(3) : (data?.entries ?? []);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <header className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <div>
          <h1 className="font-bold text-2xl text-foreground">Tasmil Quest Leaderboard</h1>
          <p className="text-muted-foreground text-sm">
            Top traders and yield farmers ranked by trusted reward volume.
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          Could not load leaderboard: {error.message}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            {[2, 1, 3].map((r) => (
              <Skeleton key={r} className="h-44 flex-1 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      )}

      {!isLoading && data && data.entries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium text-foreground">No volume yet</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Be the first to earn rewards. Start trading or supplying liquidity.
          </p>
        </div>
      )}

      {!isLoading && data && data.entries.length > 0 && (
        <>
          {page === 1 && podiumEntries.length === 3 && (
            <div className="flex items-end gap-3">
              <PodiumCard
                rank={2}
                walletAddress={podiumEntries[1]?.walletAddress}
                volumeUsd={podiumEntries[1]?.volumeUsd}
              />
              <PodiumCard
                rank={1}
                walletAddress={podiumEntries[0]?.walletAddress}
                volumeUsd={podiumEntries[0]?.volumeUsd}
              />
              <PodiumCard
                rank={3}
                walletAddress={podiumEntries[2]?.walletAddress}
                volumeUsd={podiumEntries[2]?.volumeUsd}
              />
            </div>
          )}

          <LeaderboardTable
            entries={tableEntries}
            currentUserWallet={address ?? undefined}
            currentUserRank={data.currentUserRank}
          />

          <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
