"use client";

import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  FileCode2,
  type LucideIcon,
  MinusCircle,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { presentRow } from "../lib/operation-presentation";
import { formatAmount, signedAmount } from "../lib/format-amount";
import type { AmountDisplay, RowAvatar, RowPresentation, SublineGlyph, TxGroup } from "../lib/types";
import { BorderedGlyphAvatar } from "./avatars/bordered-glyph-avatar";
import { SwapAvatar } from "./avatars/swap-avatar";
import { TokenAvatar } from "./avatars/token-avatar";
import { TransactionDetailPanel } from "./transaction-detail-panel";

const SUBLINE_GLYPHS: Record<SublineGlyph, LucideIcon> = {
  sent: ArrowUpCircle,
  received: ArrowDownCircle,
  swap: RefreshCw,
  contract: FileCode2,
  failed: AlertCircle,
  add: PlusCircle,
  remove: MinusCircle,
  generic: CheckCircle2,
};

function renderAvatar(avatar: RowAvatar) {
  switch (avatar.kind) {
    case "token":
      return <TokenAvatar code={avatar.code} src={avatar.src} />;
    case "bordered-glyph":
      return <BorderedGlyphAvatar glyph={avatar.glyph} corner={avatar.corner} />;
    case "swap-dual":
      return <SwapAvatar src={avatar.src} dst={avatar.dst} />;
  }
}

function renderAmount(amount: AmountDisplay) {
  switch (amount.kind) {
    case "none":
      return null;
    case "multiple":
      return (
        <span
          data-testid="primary-amount"
          className="font-semibold text-base text-foreground leading-none"
        >
          Multiple
        </span>
      );
    case "single": {
      const colour = amount.isCredit ? "text-emerald-400" : "text-foreground";
      return (
        <span
          data-testid="primary-amount"
          className={cn("font-semibold text-base leading-none tabular-nums", colour)}
        >
          {signedAmount(formatAmount(amount.value), amount.isCredit)} {amount.code}
        </span>
      );
    }
  }
}

interface TransactionRowProps {
  group: TxGroup;
  address: string;
}

export function TransactionRow({ group, address }: TransactionRowProps) {
  const [open, setOpen] = useState(false);
  const presentation: RowPresentation = presentRow(group, address);
  const SublineIcon = SUBLINE_GLYPHS[presentation.sublineGlyph];
  const isFailed = !group.successful;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          aria-label={presentation.title}
          className="flex w-full items-center gap-4 px-2 py-4 text-left transition-colors hover:bg-muted/10"
        >
          {renderAvatar(presentation.avatar)}

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base text-foreground">
              {presentation.title}
              {presentation.moreOpsLabel ? (
                <span className="ml-1.5 font-normal text-muted-foreground text-xs">
                  {presentation.moreOpsLabel}
                </span>
              ) : null}
            </p>
            <p
              className={cn(
                "mt-1 flex items-center gap-1.5 truncate text-sm",
                isFailed ? "text-destructive" : "text-muted-foreground",
              )}
            >
              <SublineIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              {presentation.subline}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {renderAmount(presentation.amount)}
            <span className="text-muted-foreground text-sm leading-none tabular-nums">
              {presentation.date}
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
