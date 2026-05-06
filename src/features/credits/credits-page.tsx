"use client";

import { Coins, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { type CreditLedgerEntry, REASON_LABELS, useCredits, useCreditsLedger } from "./use-credits";

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function ReasonBadge({ reason }: { reason: CreditLedgerEntry["reason"] }) {
  const label = REASON_LABELS[reason] ?? reason.replace(/_/g, " ");
  return (
    <span className="rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs">{label}</span>
  );
}

export function CreditsPage() {
  const snap = useCredits();
  const ledger = useCreditsLedger();

  const credits = snap.data?.credits ?? 0;
  const points = snap.data?.points ?? 0;
  const rows = ledger.data?.items ?? [];

  return (
    <div data-testid="credits-page" className="flex flex-col gap-6 p-6">
      <h1 className="font-semibold text-2xl">Credits & Points</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card data-testid="credits-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4" />
              Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {snap.isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <span data-testid="credits-balance" className="font-bold text-4xl">
                {formatNumber(credits)}
              </span>
            )}
          </CardContent>
        </Card>

        <Card data-testid="points-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            {snap.isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <span data-testid="points-balance" className="font-bold text-4xl">
                {formatNumber(points)}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="ledger-card">
        <CardHeader>
          <CardTitle className="text-base">Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : rows.length === 0 ? (
            <p data-testid="ledger-empty" className="text-muted-foreground text-sm">
              No activity yet.
            </p>
          ) : (
            <Table data-testid="ledger-table">
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} data-testid={`ledger-row-${row.id}`}>
                    <TableCell>{formatTime(row.occurredAt)}</TableCell>
                    <TableCell>
                      <ReasonBadge reason={row.reason} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.deltaCredits > 0 ? `+${row.deltaCredits}` : row.deltaCredits}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.deltaPoints > 0 ? `+${row.deltaPoints}` : row.deltaPoints}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
