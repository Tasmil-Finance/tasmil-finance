"use client";

import { Layers, Wallet } from "lucide-react";
import { fmt } from "../../lib/formatting";
import type { CardMode } from "../../schemas/common.schema";
import type { DefindexUserBalanceProps } from "../../schemas/defindex.schema";
import { CardHeader, MetricBox } from "../base/indicators";
import { EmptyState, ProtocolCard } from "../base/protocol-card";

interface Props {
  balance: DefindexUserBalanceProps;
  mode?: CardMode;
}

export function DefindexBalanceCard({ balance, mode = "playground" }: Props) {
  const shares = Number(balance.dfTokens) / 1e7;
  const hasPosition = shares > 0;

  if (!hasPosition) {
    return (
      <ProtocolCard mode={mode} title="Vault Balance" icon={Wallet}>
        <EmptyState icon={Layers} text="No position in this vault" />
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard
      mode={mode}
      title={mode === "chat" ? "Vault Balance" : undefined}
      icon={mode === "chat" ? Wallet : undefined}
    >
      {mode === "playground" && (
        <CardHeader icon={<Wallet className="h-3.5 w-3.5" />} title="Your Vault Position" />
      )}

      <div className="space-y-3 px-4 py-3">
        {/* Shares */}
        <MetricBox label="Your Shares (dfTokens)" value={fmt(shares, 4)} />

        {/* Underlying balances */}
        {balance.underlyingBalance.length > 0 && (
          <div className="space-y-1.5">
            <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider">
              Underlying Assets
            </p>
            <div className="grid grid-cols-2 gap-2">
              {balance.underlyingBalance.map((amount, i) => {
                const human = amount / 1e7;
                return (
                  <div key={i} className="rounded-lg bg-secondary px-2.5 py-2">
                    <p className="mb-0.5 text-[10px] text-muted-foreground">Asset {i + 1}</p>
                    <p className="font-semibold text-foreground text-sm tabular-nums">
                      {fmt(human, 4)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ProtocolCard>
  );
}
