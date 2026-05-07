"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { activeNetwork, getExplorerUrl } from "@/shared/config/stellar";
import { CopyButton } from "@/shared/ui/copy-button";
import { formatAmount, signedAmount } from "../lib/format-amount";
import { getOpLabel } from "../lib/operation-presentation";
import type { TxGroup } from "../lib/types";

const explorerLedgerBase = activeNetwork.explorerUrl;

function formatFeeXlm(stroops: string | undefined): string {
  if (!stroops) return "—";
  const n = Number(stroops);
  if (Number.isNaN(n)) return stroops;
  return `${(n / 10_000_000).toFixed(7)} XLM`;
}

interface Props {
  group: TxGroup;
}

export function TransactionDetailPanel({ group }: Props) {
  const explorerUrl = getExplorerUrl("tx", group.txHash);
  const { feeChargedStroops, memo, memoType, ledger } = group.attrs;

  const rows: { label: string; value: React.ReactNode }[] = [
    {
      label: "Tx Hash",
      value: (
        <div className="flex min-w-0 items-center gap-2">
          <code className="min-w-0 truncate font-mono text-foreground">{group.txHash}</code>
          <CopyButton text={group.txHash} />
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap text-primary hover:underline"
          >
            View ↗
          </a>
        </div>
      ),
    },
    { label: "Time", value: <span className="text-foreground">{new Date(group.createdAt).toISOString()}</span> },
    { label: "Fee", value: <span className="text-foreground">{formatFeeXlm(feeChargedStroops)}</span> },
  ];

  if (ledger !== undefined) {
    rows.push({
      label: "Ledger",
      value: (
        <a
          href={`${explorerLedgerBase}/ledger/${ledger}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {ledger}
        </a>
      ),
    });
  }

  if (memo) {
    rows.push({
      label: "Memo",
      value: (
        <span className="break-all text-foreground">
          {memo}
          {memoType ? ` (${memoType})` : ""}
        </span>
      ),
    });
  }

  rows.push({
    label: "Operations",
    value: (
      <div className="flex flex-col gap-1">
        {group.ops.map((o) => {
          const label = getOpLabel(o.kind);
          return (
            <div key={o.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-foreground">
              <span className="font-medium">{label}</span>
              {o.deltas.map((d, i) => (
                <span
                  key={i}
                  className={cn(
                    "font-medium tabular-nums",
                    d.isCredit ? "text-emerald-400" : "text-destructive",
                  )}
                >
                  {signedAmount(formatAmount(d.amount), d.isCredit)} {d.code}
                </span>
              ))}
              {o.protocol && <span className="text-muted-foreground">· {o.protocol}</span>}
            </div>
          );
        })}
      </div>
    ),
  });

  return (
    <div
      data-testid="tx-detail-panel"
      className="mx-3 mt-1 mb-2 rounded-lg bg-muted/15 px-4 py-3 text-xs"
    >
      <dl className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 gap-y-2.5">
        {rows.map((r) => (
          <Fragment key={r.label}>
            <dt className="font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              {r.label}
            </dt>
            <dd className="min-w-0">{r.value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
