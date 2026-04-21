"use client";

import { Wallet, Clock } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { BackstopBalanceCardProps } from "../../schemas/blend.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { MetricBox, Row, CardHeader, DetailRow } from "../base/indicators";
import { trunc } from "../../lib/formatting";

interface BlendBackstopBalanceCardProps {
  data: BackstopBalanceCardProps;
  mode?: CardMode;
}

export function BlendBackstopBalanceCard({ data, mode = "playground" }: BlendBackstopBalanceCardProps) {
  const shares = data.sharesHuman ?? (data.shares != null ? (Number(data.shares) / 1e7).toFixed(7) : null);
  const queued = data.queuedWithdrawals ?? [];
  const isChat = mode === "chat";

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="Backstop Balance" icon={Wallet} iconColor="text-indigo-500" iconBg="bg-indigo-500/10">
        <div className="space-y-1.5">
          {data.pool && <DetailRow label="Pool" value={<span className="font-mono text-xs">{trunc(String(data.pool), 12, 0)}</span>} />}
          {shares != null && (
            <DetailRow label="Backstop Shares" value={<span className="font-semibold">{shares}</span>} />
          )}
          {data.hasPosition === false && (
            <div className="text-muted-foreground text-xs">No backstop position in this pool.</div>
          )}
          {queued.length > 0 && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <div className="mb-1 text-muted-foreground text-xs">Queued Withdrawals ({queued.length})</div>
              {queued.map((q, i) => (
                <div key={i} className="space-y-1 rounded border p-2 text-xs">
                  <DetailRow label="Amount" value={<span className="font-semibold">{String(q.amountHuman ?? q.amount)}</span>} />
                  {q.expiration != null && <DetailRow label="Expiration (ledger)" value={String(q.expiration)} />}
                </div>
              ))}
            </div>
          )}
          {queued.length === 0 && data.hasPosition && (
            <div className="text-muted-foreground text-xs">No queued withdrawals.</div>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode — rich card
  if (data.hasPosition === false && !shares) {
    return (
      <ProtocolCard mode="playground">
        <CardHeader icon={<Wallet className="h-3.5 w-3.5" />} title="Backstop Balance" />
        <EmptyState icon={Wallet} text="No backstop position in this pool" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <CardHeader icon={<Wallet className="h-3.5 w-3.5" />} title="Backstop Balance" />
      <div className="p-4 space-y-3 text-xs">
        {/* Pool */}
        {data.pool && (
          <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">Pool</span>
            <span className="text-foreground tabular-nums">
              {data.poolName ? (
                <span>{data.poolName} <span className="font-mono text-muted-foreground">{trunc(String(data.pool), 4, 4)}</span></span>
              ) : (
                <span className="font-mono">{trunc(String(data.pool))}</span>
              )}
            </span>
          </div>
        )}

        {/* Shares */}
        {shares != null && (
          <MetricBox label="Backstop Shares" value={String(shares)} />
        )}

        {/* Queued withdrawals */}
        {queued.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">
                Queued Withdrawals ({queued.length})
              </span>
            </div>
            {queued.map((q, i) => (
              <div key={i} className="rounded-lg bg-secondary px-3 py-2 space-y-1">
                <Row label="Amount" value={String(q.amountHuman ?? q.amount)} />
                {q.expiration != null && (
                  <Row label="Expiration (ledger)" value={String(q.expiration)} />
                )}
              </div>
            ))}
          </div>
        )}

        {queued.length === 0 && data.hasPosition && (
          <div className="text-muted-foreground">No queued withdrawals.</div>
        )}
      </div>
    </ProtocolCard>
  );
}
