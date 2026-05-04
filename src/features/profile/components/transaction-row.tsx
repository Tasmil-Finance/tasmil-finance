"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function shortenAddr(a: string | undefined): string {
  if (!a) return "";
  if (a.length < 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function renderSwapAmounts(primary: DecodedOp) {
  const src = primary.deltas.find((d) => !d.isCredit);
  const dst = primary.deltas.find((d) => d.isCredit);
  if (!src || !dst) return null;
  return (
    <div
      data-testid="primary-amount"
      className="flex items-center gap-2 text-sm font-semibold leading-none"
    >
      <span className="text-destructive">{signedAmount(formatAmount(src.amount), false)}</span>
      <TokenImage alt={src.code} className="h-5 w-5 rounded-full text-[10px]" />
      <span>{src.code}</span>
      <span className="text-muted-foreground">→</span>
      <span className="text-emerald-400">{signedAmount(formatAmount(dst.amount), true)}</span>
      <TokenImage alt={dst.code} className="h-5 w-5 rounded-full text-[10px]" />
      <span>{dst.code}</span>
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
        "flex items-center gap-2 text-sm font-semibold leading-none",
        colour
      )}
    >
      <span>{signedAmount(formatAmount(delta.amount), delta.isCredit)}</span>
      <TokenImage alt={delta.code} className="h-5 w-5 rounded-full text-[10px]" />
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

  const subLabel = primary.protocol
    ? PROTOCOL_LABEL[primary.protocol]
    : primary.counterparty
      ? shortenAddr(primary.counterparty)
      : null;

  const moreOps = ops.length - 1;

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
              style.bg
            )}
          >
            <Icon className={cn("h-[15px] w-[15px]", style.fg)} />
          </div>

          <div className="min-w-0 w-44 shrink-0">
            <p className="truncate text-sm font-medium text-foreground">
              {style.label}
              {moreOps > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  + {moreOps} ops
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {subLabel ? `${subLabel} · ` : ""}
              {formatTime(group.createdAt)}
            </p>
          </div>

          <div className="flex flex-1 items-center gap-2.5">
            {!successful
              ? null
              : primary.kind === "swap"
                ? renderSwapAmounts(primary)
                : renderSingleAmount(primary)}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <TransactionDetailPanel group={group} />
      </CollapsibleContent>
    </Collapsible>
  );
}
