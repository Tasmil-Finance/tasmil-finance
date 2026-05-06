"use client";

import { Database } from "lucide-react";
import { TokenImage } from "@/shared/components/token-image";
import { fmt, formatNumber, pct } from "../../lib/formatting";
import type { ReserveCardProps } from "../../schemas/blend.schema";
import type { CardMode } from "../../schemas/common.schema";
import { APYDisplay, Bar, MetricBox, Row } from "../base/indicators";
import { ProtocolCard } from "../base/protocol-card";

interface BlendReserveCardComponentProps {
  reserve: ReserveCardProps;
  mode?: CardMode;
}

export function BlendReserveCard({ reserve, mode = "playground" }: BlendReserveCardComponentProps) {
  const sym = reserve.symbol;
  const isChat = mode === "chat";

  if (isChat) {
    return (
      <ProtocolCard
        mode="chat"
        title={`Reserve: ${sym}`}
        icon={Database}
        iconColor="text-indigo-500"
        iconBg="bg-indigo-500/10"
      >
        <div className="space-y-1.5">
          {reserve.supplyApy != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Supply APY</span>
              <APYDisplay value={reserve.supplyApy} />
            </div>
          )}
          {reserve.borrowApy != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Borrow APY</span>
              <span className="text-orange-500">{Number(reserve.borrowApy).toFixed(2)}%</span>
            </div>
          )}
          {reserve.collateralFactor != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Collateral Factor</span>
              <span>{`${(Number(reserve.collateralFactor) * 100).toFixed(0)}%`}</span>
            </div>
          )}
          {reserve.utilization != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilization</span>
              <span>{`${(Number(reserve.utilization) * 100).toFixed(2)}%`}</span>
            </div>
          )}
          {reserve.totalSupplied != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Supply</span>
              <span>
                {formatNumber(reserve.totalSupplied)} {sym}
              </span>
            </div>
          )}
          {reserve.totalBorrowed != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Borrow</span>
              <span>
                {formatNumber(reserve.totalBorrowed)} {sym}
              </span>
            </div>
          )}
          {(reserve.supplyEmissionApy != null || reserve.borrowEmissionApy != null) && (
            <div className="mt-1 border-t pt-1.5">
              {reserve.supplyEmissionApy != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supply Emission</span>
                  <APYDisplay value={reserve.supplyEmissionApy} />
                </div>
              )}
              {reserve.borrowEmissionApy != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Borrow Emission</span>
                  <APYDisplay value={reserve.borrowEmissionApy} />
                </div>
              )}
            </div>
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode — rich card
  return (
    <ProtocolCard mode="playground">
      <div className="flex items-center gap-3 border-border border-b px-4 py-3">
        <TokenImage src={null} alt={sym} className="h-7 w-7 rounded-full" />
        <div>
          <p className="font-medium text-foreground text-sm">{sym}</p>
          <p className="text-[10px] text-muted-foreground">Reserve Detail</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2">
          <MetricBox label="Supply APY" value={pct(reserve.supplyApy)} />
          <MetricBox label="Borrow APY" value={pct(reserve.borrowApy)} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px]">
            <span className="text-muted-foreground">Utilization</span>
            <span className="text-foreground tabular-nums">{pct(reserve.utilization)}</span>
          </div>
          <Bar value={reserve.utilization} />
        </div>
        <div className="space-y-1.5 text-xs">
          <Row label="Total Supply" value={`${fmt(reserve.totalSupplied)} ${sym}`} />
          <Row label="Total Borrow" value={`${fmt(reserve.totalBorrowed)} ${sym}`} />
          <Row label="C-Factor" value={pct(reserve.collateralFactor)} />
          <Row label="L-Factor" value={pct(reserve.liabilityFactor)} />
        </div>
      </div>
    </ProtocolCard>
  );
}
