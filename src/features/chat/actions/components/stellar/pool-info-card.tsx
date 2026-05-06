"use client";

import { Database } from "lucide-react";
import { memo } from "react";
import { truncateAddress } from "@/shared/config/stellar";
import { useResultData } from "../../hooks/use-result-data";
import { formatNumber, formatPercent } from "../../lib/formatting";
import { APYDisplay, DetailRow, ProtocolBadge, ScrollableList } from "../base/indicators";
import { BaseInfoCard } from "../base/info-card";

interface PoolInfoCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function PoolInfoCardComponent({ args, result, toolCallId, status, type }: PoolInfoCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData(result, status);
  const protocol = args?.protocol ?? data?.protocol ?? "unknown";

  // Normalise various response shapes into a renderable state:
  //   blend_get_reserve_info → { reserve: {...} }
  //   blend_get_pool_info    → { pool: { address, reserves[], ... } }
  //   resolve_pool           → { pools: [...] }   OR  { poolAddress, ... }
  const reserve = data?.reserve ?? null; // single reserve
  const pool = data?.pool // single pool (nested)
    ? { ...data.pool, poolAddress: data.pool.address ?? data.pool.poolAddress }
    : null;
  const pools = data?.pools ?? (pool ? null : data?.poolAddress ? [data] : []);
  const isSingle = !data?.pools && (data?.poolAddress || pool);

  const backstop = data?.backstop ?? null;

  const cardTitle = reserve
    ? `Reserve: ${reserve.symbol ?? "Asset"}`
    : backstop || type === "blend_backstop_info"
      ? "Backstop Info"
      : "Pool Info";

  return (
    <BaseInfoCard
      data-testid="card-pool-info"
      title={cardTitle}
      subtitle={protocol}
      icon={Database}
      iconColor="text-indigo-500"
      iconBg="bg-indigo-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {reserve ? (
        <ReserveInfoView reserve={reserve} />
      ) : backstop ? (
        <BackstopInfoView backstop={backstop} />
      ) : isSingle ? (
        <SinglePoolView pool={pool ?? data} protocol={protocol} />
      ) : pools && pools.length > 0 ? (
        <ScrollableList id={`pools-${toolCallId}`} maxHeight={300}>
          {pools.map((p: any, idx: number) => (
            <div key={p.poolAddress ?? idx} className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="truncate font-medium text-sm">{p.name ?? "Pool"}</span>
                <ProtocolBadge name={protocol} />
              </div>
              <SinglePoolView pool={p} protocol={protocol} compact />
            </div>
          ))}
        </ScrollableList>
      ) : (
        <div className="text-muted-foreground text-sm">No pool data available.</div>
      )}
    </BaseInfoCard>
  );
}

function ReserveInfoView({ reserve }: { reserve: any }) {
  return (
    <div className="space-y-1.5">
      {reserve.symbol && (
        <DetailRow label="Asset" value={<span className="font-semibold">{reserve.symbol}</span>} />
      )}
      {reserve.supplyApy != null && (
        <DetailRow
          label="Supply APY"
          value={
            <span className="font-semibold text-foreground">
              {formatPercent(reserve.supplyApy)}
            </span>
          }
        />
      )}
      {reserve.borrowApy != null && (
        <DetailRow
          label="Borrow APY"
          value={<span className="text-orange-500">{formatPercent(reserve.borrowApy)}</span>}
        />
      )}
      {reserve.collateralFactor != null && (
        <DetailRow
          label="Collateral Factor"
          value={`${(Number(reserve.collateralFactor) * 100).toFixed(0)}%`}
        />
      )}
      {reserve.utilization != null && (
        <DetailRow
          label="Utilization"
          value={`${(Number(reserve.utilization) * 100).toFixed(2)}%`}
        />
      )}
      {reserve.totalSupply != null && (
        <DetailRow
          label="Total Supply"
          value={`${formatNumber(Number(reserve.totalSupply))} ${reserve.symbol ?? ""}`}
        />
      )}
      {reserve.totalBorrow != null && (
        <DetailRow
          label="Total Borrow"
          value={`${formatNumber(Number(reserve.totalBorrow))} ${reserve.symbol ?? ""}`}
        />
      )}
      {reserve.supplyCap != null && (
        <DetailRow
          label="Supply Cap"
          value={`${formatNumber(Number(reserve.supplyCap))} ${reserve.symbol ?? ""}`}
        />
      )}
      {(reserve.supplyEmissionApy != null || reserve.borrowEmissionApy != null) && (
        <div className="mt-1 border-t pt-1.5">
          {reserve.supplyEmissionApy != null && (
            <DetailRow
              label="Supply Emission"
              value={<APYDisplay value={reserve.supplyEmissionApy} />}
            />
          )}
          {reserve.borrowEmissionApy != null && (
            <DetailRow
              label="Borrow Emission"
              value={<APYDisplay value={reserve.borrowEmissionApy} />}
            />
          )}
        </div>
      )}
    </div>
  );
}

function BackstopInfoView({ backstop }: { backstop: any }) {
  return (
    <div className="space-y-1.5">
      {backstop.poolAddress && (
        <DetailRow
          label="Pool"
          value={<span className="font-mono text-xs">{backstop.poolAddress.slice(0, 12)}…</span>}
        />
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
        <DetailRow
          label="Total Deposited"
          value={`$${formatNumber(Number(backstop.totalDepositedUsd))}`}
        />
      )}
      {backstop.q4wPct != null && (
        <DetailRow label="Q4W %" value={`${Number(backstop.q4wPct).toFixed(2)}%`} />
      )}
      {backstop.lpTokenPrice != null && backstop.lpTokenPrice > 0 && (
        <DetailRow label="LP Token Price" value={`$${Number(backstop.lpTokenPrice).toFixed(7)}`} />
      )}
      {backstop.shares != null && (
        <DetailRow label="Total Shares" value={formatNumber(Number(backstop.shares) / 1e7)} />
      )}
    </div>
  );
}

function SinglePoolView({ pool }: { pool: any; protocol?: string; compact?: boolean }) {
  if (!pool) return null;

  return (
    <div className="space-y-1.5">
      {pool.poolAddress && (
        <DetailRow label="Address" value={truncateAddress(pool.poolAddress)} mono />
      )}
      {pool.stakeAddress && (
        <DetailRow label="Stake" value={truncateAddress(pool.stakeAddress)} mono />
      )}
      {pool.lpShareAddress && (
        <DetailRow label="LP Token" value={truncateAddress(pool.lpShareAddress)} mono />
      )}
      {pool.feeBps != null && (
        <DetailRow label="Fee" value={`${(pool.feeBps / 100).toFixed(2)}%`} />
      )}
      {pool.status && (
        <DetailRow
          label="Status"
          value={
            <span className={pool.status === "active" ? "text-green-500" : "text-yellow-500"}>
              {pool.status}
            </span>
          }
        />
      )}

      {/* Token pair info */}
      {pool.tokenA && pool.tokenB && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded bg-muted/30 p-2 text-xs">
            <div className="text-muted-foreground">{pool.tokenA.symbol ?? "Token A"}</div>
            <div className="font-medium">{pool.tokenA.amount ?? "—"}</div>
          </div>
          <div className="rounded bg-muted/30 p-2 text-xs">
            <div className="text-muted-foreground">{pool.tokenB.symbol ?? "Token B"}</div>
            <div className="font-medium">{pool.tokenB.amount ?? "—"}</div>
          </div>
        </div>
      )}

      {/* Lending pool reserves */}
      {pool.reserves && pool.reserves.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2">
          <div className="text-muted-foreground text-xs">
            Reserves ({pool.reserveCount ?? pool.reserves.length})
          </div>
          {pool.reserves.map((r: any, i: number) => (
            <div key={i} className="grid grid-cols-3 gap-1 text-xs">
              <span className="font-medium">{r.symbol ?? r.asset}</span>
              <span className="text-muted-foreground">Supply: {formatNumber(r.totalSupply)}</span>
              <span className="text-muted-foreground">Borrow: {formatNumber(r.totalBorrow)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Supply/borrow info */}
      {pool.supplyApy != null && (
        <DetailRow
          label="Supply APY"
          value={
            <span className="font-semibold text-foreground">{formatPercent(pool.supplyApy)}</span>
          }
        />
      )}
      {pool.borrowApy != null && (
        <DetailRow
          label="Borrow APY"
          value={<span className="text-orange-500">{formatPercent(pool.borrowApy)}</span>}
        />
      )}
      {pool.utilization != null && (
        <DetailRow label="Utilization" value={`${pool.utilization?.toFixed(1)}%`} />
      )}
      {pool.collateralFactor != null && (
        <DetailRow
          label="Collateral Factor"
          value={`${(pool.collateralFactor * 100).toFixed(0)}%`}
        />
      )}

      {pool.canSupply != null && (
        <div className="mt-1 flex gap-2">
          {pool.canSupply && (
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-green-500 text-xs">
              Supply
            </span>
          )}
          {pool.canBorrow && (
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-orange-500 text-xs">
              Borrow
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const PoolInfoCard = memo(PoolInfoCardComponent);
