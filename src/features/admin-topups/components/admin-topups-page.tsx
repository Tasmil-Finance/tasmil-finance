"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button-v2";
import { useCancelTopup, useFiatPendingTopups, useFulfillTopup } from "../hooks/use-admin-topups";

export function AdminTopupsPage() {
  const { data: topups = [], isLoading, isError, error } = useFiatPendingTopups();
  const fulfill = useFulfillTopup();
  const cancel = useCancelTopup();
  const [refs, setRefs] = useState<Record<string, string>>({});

  const onFulfil = (topupId: string) => {
    const bankTxRef = refs[topupId]?.trim();
    if (!bankTxRef) {
      alert("Enter a bank tx ref before fulfilling");
      return;
    }
    fulfill.mutate({ topupId, bankTxRef });
  };

  const onCancel = (topupId: string) => {
    if (!confirm("Cancel this topup?")) return;
    cancel.mutate({ topupId });
  };

  if (isLoading) {
    return (
      <main
        data-testid="admin-topups-loading"
        className="mx-auto w-full max-w-5xl px-6 py-10 text-muted-foreground text-sm"
      >
        Loading pending fiat topups…
      </main>
    );
  }

  if (isError) {
    return (
      <main
        data-testid="admin-topups-error"
        className="mx-auto w-full max-w-5xl px-6 py-10 text-destructive text-sm"
      >
        Failed to load: {error instanceof Error ? error.message : "unknown"}
      </main>
    );
  }

  return (
    <main data-testid="admin-topups-root" className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="mb-6 font-bold text-2xl tracking-tight">Pending fiat topups</h1>
      {topups.length === 0 ? (
        <p data-testid="admin-topups-empty" className="text-muted-foreground">
          No pending fiat topups.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">ID</th>
              <th>User pubkey</th>
              <th>Package</th>
              <th>USD</th>
              <th>Reference</th>
              <th>Bank Tx Ref</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {topups.map((t) => (
              <tr
                key={t.id}
                data-testid={`admin-topup-row-${t.id}`}
                className="border-b last:border-0"
              >
                <td className="py-2 font-mono">{t.id.slice(-8)}</td>
                <td className="font-mono">{t.user.stellarPubkey.slice(0, 8)}…</td>
                <td>{t.package.id}</td>
                <td>${t.pricingSnapshotUsd}</td>
                <td className="font-mono">{t.reference}</td>
                <td>
                  <input
                    data-testid={`admin-topup-banktxref-${t.id}`}
                    value={refs[t.id] ?? ""}
                    onChange={(e) => setRefs((r) => ({ ...r, [t.id]: e.target.value }))}
                    placeholder="BNK-12345"
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="flex gap-2 py-2">
                  <Button
                    type="button"
                    data-testid={`admin-topup-fulfill-${t.id}`}
                    onClick={() => onFulfil(t.id)}
                    disabled={fulfill.isPending || cancel.isPending}
                  >
                    Fulfill
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid={`admin-topup-cancel-${t.id}`}
                    onClick={() => onCancel(t.id)}
                    disabled={fulfill.isPending || cancel.isPending}
                  >
                    Cancel
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
