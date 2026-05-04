"use client";

import type { TxGroup } from "../lib/types";

interface Props {
  group: TxGroup;
}

export function TransactionDetailPanel({ group }: Props) {
  return (
    <div
      data-testid="tx-detail-panel"
      className="border-t border-border/40 bg-muted/10 px-5 py-4 text-xs"
    >
      <p className="text-muted-foreground">Tx: {group.txHash}</p>
    </div>
  );
}
