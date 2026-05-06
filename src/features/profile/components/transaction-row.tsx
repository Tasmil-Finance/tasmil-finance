"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { formatRowDate } from "@/shared/utils/date-group";
import { formatAmount, signedAmount } from "../lib/format-amount";
import { getIconStyle } from "../lib/icons";
import type { DecodedOp, TxGroup } from "../lib/types";
import { TransactionDetailPanel } from "./transaction-detail-panel";

const PROTOCOL_LABEL: Record<string, string> = {
  blend: "Blend",
  soroswap: "Soroswap",
  aquarius: "Aquarius",
  phoenix: "Phoenix",
  stellar: "Stellar",
};

function shortenAddr(a: string | undefined): string {
  if (!a) return "";
  if (a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

/**
 * Decide whether to render "Multiple" in place of an explicit amount.
 * Mirrors Freighter's `assetDiffs.length > 1` rule plus our own multi-op signal.
 */
function isMultiAmount(group: TxGroup): boolean {
  if (group.ops.length > 1) return true;
  const totalDeltas = group.primary.deltas.length;
  if (group.primary.kind === "swap") return false; // swap is always 2 deltas (handled below)
  return totalDeltas > 1;
}

function renderSwapAmount(primary: DecodedOp) {
  const src = primary.deltas.find((d) => !d.isCredit);
  const dst = primary.deltas.find((d) => d.isCredit);
  if (!src || !dst) return null;
  return (
    <div
      data-testid="primary-amount"
      className="flex items-center gap-1.5 text-sm font-semibold leading-none tabular-nums"
    >
      <span className="text-destructive">{signedAmount(formatAmount(src.amount), false)}</span>
      <span className="text-muted-foreground">{src.code}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-emerald-400">{signedAmount(formatAmount(dst.amount), true)}</span>
      <span className="text-muted-foreground">{dst.code}</span>
    </div>
  );
}

function renderSingleAmount(primary: DecodedOp) {
  const delta = primary.deltas[0];
  if (!delta) return null;
  const colour = delta.isCredit ? "text-emerald-400" : "text-destructive";
  return (
    <div
      data-testid="primary-amount"
      className={cn(
        "flex items-center gap-1.5 text-sm font-semibold leading-none tabular-nums",
        colour,
      )}
    >
      <span>{signedAmount(formatAmount(delta.amount), delta.isCredit)}</span>
      <TokenImage alt={delta.code} className="h-4 w-4 shrink-0 rounded-full text-[9px]" />
      <span className="text-foreground">{delta.code}</span>
    </div>
  );
}

interface TransactionRowProps {
  group: TxGroup;
  address: string;
}

export function TransactionRow({ group, address: _address }: TransactionRowProps) {
  const [open, setOpen] = useState(false);
  const { primary, successful, ops } = group;
  const style = getIconStyle(primary.kind, successful);
  const Icon = style.icon;

  const subline =
    style.sublabel ??
    (primary.protocol
      ? PROTOCOL_LABEL[primary.protocol]
      : primary.counterparty
        ? shortenAddr(primary.counterparty)
        : null);

  const showMultiple = isMultiAmount(group);
  const moreOpsLabel = ops.length > 1 ? ` + ${ops.length - 1} ops` : "";
  const dateLabel = formatRowDate(new Date(group.createdAt));

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-label={style.label}
          className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-muted/20"
        >
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              style.bg,
            )}
          >
            <Icon className={cn("h-[15px] w-[15px]", style.fg)} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {style.label}
              {moreOpsLabel && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  {moreOpsLabel}
                </span>
              )}
            </p>
            {subline && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subline}</p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {!successful ? null : showMultiple ? (
              <span className="text-sm font-semibold leading-none text-foreground">Multiple</span>
            ) : primary.kind === "swap" ? (
              renderSwapAmount(primary)
            ) : (
              renderSingleAmount(primary)
            )}
            <span className="text-xs leading-none text-muted-foreground tabular-nums">
              {dateLabel}
            </span>
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <TransactionDetailPanel group={group} />
      </CollapsibleContent>
    </Collapsible>
  );
}
