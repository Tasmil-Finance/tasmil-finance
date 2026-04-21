"use client";

import { Shield } from "lucide-react";
import type { CardMode } from "../../schemas/common.schema";
import type { BackstopCardProps } from "../../schemas/blend.schema";
import { ProtocolCard } from "../base/protocol-card";
import { MetricBox, Bar, Row, CardHeader, APYDisplay, DetailRow } from "../base/indicators";
import { fmt, trunc, formatNumber } from "../../lib/formatting";

interface BlendBackstopInfoCardProps {
  backstop: BackstopCardProps;
  mode?: CardMode;
}

export function BlendBackstopInfoCard({ backstop, mode = "playground" }: BlendBackstopInfoCardProps) {
  const isChat = mode === "chat";

  if (isChat) {
    return (
      <ProtocolCard mode="chat" title="Backstop Info" subtitle="blend" icon={Shield} iconColor="text-indigo-500" iconBg="bg-indigo-500/10">
        <div className="space-y-1.5">
          {backstop.poolAddress && (
            <DetailRow label="Pool" value={<span className="font-mono text-xs">{trunc(backstop.poolAddress, 12, 0)}</span>} />
          )}
          {backstop.totalApr != null && (
            <DetailRow label="Total APR" value={<APYDisplay value={backstop.totalApr} />} />
          )}
          {backstop.interestApr != null && (
            <DetailRow label="Interest APR" value={<APYDisplay value={backstop.interestApr} />} />
          )}
          {backstop.emissionApr != null && (
            <DetailRow label="Emission APR" value={<APYDisplay value={backstop.emissionApr} />} />
          )}
          {backstop.totalDepositedUsd != null && (
            <DetailRow label="Total Deposited" value={`$${formatNumber(backstop.totalDepositedUsd)}`} />
          )}
          {backstop.q4wPct != null && (
            <DetailRow label="Q4W %" value={`${Number(backstop.q4wPct).toFixed(2)}%`} />
          )}
          {backstop.lpTokenPrice != null && Number(backstop.lpTokenPrice) > 0 && (
            <DetailRow label="LP Token Price" value={`$${Number(backstop.lpTokenPrice).toFixed(7)}`} />
          )}
          {backstop.shares != null && (
            <DetailRow label="Total Shares" value={formatNumber(Number(backstop.shares) / 1e7)} />
          )}
        </div>
      </ProtocolCard>
    );
  }

  // Playground mode — rich card
  const totalApr = Number(backstop.totalApr);
  const aprColor = !Number.isFinite(totalApr)
    ? "text-muted-foreground"
    : totalApr >= 100
      ? "text-emerald-400"
      : totalApr >= 10
        ? "text-yellow-400"
        : "text-blue-400";

  return (
    <ProtocolCard mode="playground">
      <CardHeader
        icon={<Shield className="h-3.5 w-3.5" />}
        title="Backstop Info"
        right={
          <span className="text-[10px] text-muted-foreground font-medium">blend</span>
        }
      />
      <div className="p-4 space-y-3">
        {/* Pool */}
        {backstop.poolAddress && (
          <div className="flex justify-between py-0.5 text-xs">
            <span className="text-muted-foreground">Pool</span>
            <span className="text-foreground tabular-nums">
              {backstop.poolName ? (
                <span>{backstop.poolName} <span className="font-mono text-muted-foreground">{trunc(backstop.poolAddress, 4, 4)}</span></span>
              ) : (
                <span className="font-mono">{trunc(backstop.poolAddress)}</span>
              )}
            </span>
          </div>
        )}

        {/* APR metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-secondary px-2.5 py-2">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total APR</p>
            <p className={`text-sm font-semibold tabular-nums ${aprColor}`}>
              {Number.isFinite(totalApr) ? `${totalApr.toFixed(2)}%` : "\u2014"}
            </p>
          </div>
          <MetricBox
            label="Interest APR"
            value={backstop.interestApr != null ? `${Number(backstop.interestApr).toFixed(2)}%` : "\u2014"}
          />
          <MetricBox
            label="Emission APR"
            value={backstop.emissionApr != null ? `${Number(backstop.emissionApr).toFixed(2)}%` : "\u2014"}
          />
        </div>

        {/* Q4W bar */}
        {backstop.q4wPct != null && (
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Q4W %</span>
            </div>
            <Bar value={backstop.q4wPct} />
          </div>
        )}

        {/* Stats */}
        <div className="space-y-1 text-xs">
          {backstop.totalDepositedUsd != null && (
            <Row label="Total Deposited" value={`$${fmt(backstop.totalDepositedUsd)}`} />
          )}
          {backstop.lpTokenPrice != null && Number(backstop.lpTokenPrice) > 0 && (
            <Row label="LP Token Price" value={`$${Number(backstop.lpTokenPrice).toFixed(7)}`} />
          )}
          {backstop.shares != null && (
            <Row label="Total Shares" value={fmt(Number(backstop.shares) / 1e7)} />
          )}
        </div>
      </div>
    </ProtocolCard>
  );
}
