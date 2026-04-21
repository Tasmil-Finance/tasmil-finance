"use client";

import { Shield, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";
import type { CardMode } from "../../schemas/common.schema";
import type { PositionsCardProps } from "../../schemas/blend.schema";
import { ProtocolCard, EmptyState } from "../base/protocol-card";
import { Apy, Tag, MetricBox, CardHeader } from "../base/indicators";
import { fmt, resolveSymbol } from "../../lib/formatting";

interface BlendPositionsCardComponentProps {
  data: PositionsCardProps;
  mode?: CardMode;
}

export function BlendPositionsCard({ data, mode = "playground" }: BlendPositionsCardComponentProps) {
  const positions = data.positions ?? [];
  const summary = data.summary;
  const collateral = data.collateral ?? [];
  const supply = data.supply ?? [];
  const liabilities = data.liabilities ?? [];

  // Normalize: flat positions array or separate SDK arrays
  const supplied: Array<Record<string, unknown>> = positions.length
    ? positions.filter((p) => p.suppliedAmount != null)
    : [
        ...collateral.map((c) => ({ ...c, suppliedAmount: c.amount, isCollateral: true })),
        ...supply.map((s) => ({ ...s, suppliedAmount: s.amount, isCollateral: false })),
      ];
  const borrowed: Array<Record<string, unknown>> = positions.length
    ? positions.filter((p) => p.borrowedAmount != null)
    : liabilities.map((l) => ({ ...l, borrowedAmount: l.amount }));

  if (!data.hasPosition && !supplied.length && !borrowed.length) {
    return (
      <ProtocolCard mode={mode} title="Position" icon={mode === "chat" ? Shield : undefined}>
        <EmptyState icon={Wallet} text="No open positions" />
      </ProtocolCard>
    );
  }

  const hf = Number(summary?.healthFactor);
  const hfColor = !Number.isFinite(hf)
    ? "text-muted-foreground"
    : hf > 1.5
      ? "text-emerald-400"
      : hf > 1.1
        ? "text-amber-400"
        : "text-destructive";

  const isChat = mode === "chat";

  return (
    <ProtocolCard mode={mode} title={isChat ? "Position" : undefined} icon={isChat ? Shield : undefined}>
      {!isChat && <CardHeader icon={<Shield className="h-3.5 w-3.5" />} title="Position" />}
      {summary && (
        <div className="grid grid-cols-4 gap-1.5 px-3 py-3 border-b border-border">
          <MetricBox label="Supplied" value={`$${fmt(summary.totalSuppliedUsd)}`} />
          <MetricBox label="Borrowed" value={`$${fmt(summary.totalBorrowedUsd)}`} />
          <MetricBox label="Available" value={`$${fmt(summary.availableBorrowUsd)}`} />
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Health</p>
            <p className={cn("text-sm font-semibold tabular-nums", hfColor)}>
              {Number.isFinite(hf) ? hf.toFixed(2) : "\u2014"}
            </p>
          </div>
        </div>
      )}
      {supplied.length > 0 && (
        <PositionSection type="supply" positions={supplied} showCollateral />
      )}
      {borrowed.length > 0 && <PositionSection type="borrow" positions={borrowed} />}
    </ProtocolCard>
  );
}

function PositionSection({
  type,
  positions,
  showCollateral,
}: {
  type: string;
  positions: Array<Record<string, unknown>>;
  showCollateral?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-4 py-2.5",
        type === "supply" && positions.length > 0 && "border-b border-border",
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Tag type={type} />
        <span className="text-[10px] text-muted-foreground">{positions.length}</span>
      </div>
      {positions.map((p, i) => {
        const raw = String(p.symbol ?? p.asset ?? "?");
        const sym = raw.length > 12 ? resolveSymbol(raw) : raw;
        const amount = type === "borrow" ? p.borrowedAmount ?? p.amount : p.suppliedAmount;
        const apy = type === "borrow" ? p.borrowApy ?? p.apy : p.supplyApy ?? p.apy;
        return (
          <div key={i} className="flex items-center py-1.5 gap-2">
            <TokenImage src={null} alt={sym} className="h-5 w-5 rounded-full" />
            <span className="text-xs font-medium text-foreground flex-1">{sym}</span>
            {showCollateral && p.isCollateral === true && <Tag type="collateral" />}
            <span className="text-xs text-foreground tabular-nums">{fmt(amount, 2)}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums w-14 text-right">
              <Apy value={apy} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
