"use client";

import { activeNetwork, getExplorerUrl } from "@/shared/config/stellar";
import { CopyButton } from "@/shared/ui/copy-button";
import { formatAmount, signedAmount } from "../lib/format-amount";
import { getIconStyle } from "../lib/icons";
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

  return (
    <div data-testid="tx-detail-panel" className="border-t border-border/40 bg-muted/10 px-5 py-4 text-xs">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Tx Hash</dt>
        <dd className="flex items-center gap-2">
          <code className="font-mono break-all text-foreground">{group.txHash}</code>
          <CopyButton text={group.txHash} />
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline whitespace-nowrap"
          >
            View ↗
          </a>
        </dd>

        <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Time</dt>
        <dd className="text-foreground">{new Date(group.createdAt).toISOString()}</dd>

        <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Fee</dt>
        <dd className="text-foreground">{formatFeeXlm(feeChargedStroops)}</dd>

        {ledger !== undefined && (
          <>
            <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Ledger</dt>
            <dd className="text-foreground">
              <a
                href={`${explorerLedgerBase}/ledger/${ledger}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {ledger}
              </a>
            </dd>
          </>
        )}

        {memo && (
          <>
            <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Memo</dt>
            <dd className="break-all text-foreground">
              {memo}
              {memoType ? ` (${memoType})` : ""}
            </dd>
          </>
        )}

        <dt className="font-semibold uppercase tracking-wider text-muted-foreground">Operations</dt>
        <dd className="flex flex-col gap-1">
          {group.ops.map((o) => {
            const style = getIconStyle(o.kind, o.successful);
            return (
              <div key={o.id} className="flex items-center gap-2 text-foreground">
                <span className="font-medium">{style.label}</span>
                {o.deltas.map((d, i) => (
                  <span
                    key={i}
                    className={d.isCredit ? "text-emerald-400" : "text-destructive"}
                  >
                    {signedAmount(formatAmount(d.amount), d.isCredit)} {d.code}
                  </span>
                ))}
                {o.protocol && (
                  <span className="text-muted-foreground">· {o.protocol}</span>
                )}
              </div>
            );
          })}
        </dd>
      </dl>
    </div>
  );
}
