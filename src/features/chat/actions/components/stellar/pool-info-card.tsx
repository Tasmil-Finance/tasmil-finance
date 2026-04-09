"use client";

import { Database } from "lucide-react";
import { memo } from "react";
import { BaseInfoCard } from "../base/info-card";
import { useResultData } from "../../hooks/use-result-data";
import { ScrollableList, ProtocolBadge, APYDisplay, DetailRow } from "../base/indicators";
import { formatNumber } from "../../lib/formatting";
import { truncateAddress } from "@/shared/config/stellar";

interface PoolInfoCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function PoolInfoCardComponent({ args, result, toolCallId, status }: PoolInfoCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData(result, status);
  const protocol = args?.["protocol"] ?? data?.protocol ?? "unknown";

  // Single pool or list of pools
  const pools = data?.pools ?? (data?.poolAddress ? [data] : []);
  const isSingle = data?.poolAddress && !data?.pools;

  return (
    <BaseInfoCard
      title="Pool Info"
      subtitle={protocol}
      icon={Database}
      iconColor="text-indigo-500"
      iconBg="bg-indigo-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {isSingle ? (
        <SinglePoolView pool={data} protocol={protocol} />
      ) : pools.length > 0 ? (
        <ScrollableList id={`pools-${toolCallId}`} maxHeight={300}>
          {pools.map((pool: any, idx: number) => (
            <div key={pool.poolAddress ?? idx} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{pool.name ?? "Pool"}</span>
                <ProtocolBadge name={protocol} />
              </div>
              <SinglePoolView pool={pool} protocol={protocol} compact />
            </div>
          ))}
        </ScrollableList>
      ) : (
        <div className="text-sm text-muted-foreground">No pool data available.</div>
      )}
    </BaseInfoCard>
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
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-muted/30 rounded p-2 text-xs">
            <div className="text-muted-foreground">{pool.tokenA.symbol ?? "Token A"}</div>
            <div className="font-medium">{pool.tokenA.amount ?? "—"}</div>
          </div>
          <div className="bg-muted/30 rounded p-2 text-xs">
            <div className="text-muted-foreground">{pool.tokenB.symbol ?? "Token B"}</div>
            <div className="font-medium">{pool.tokenB.amount ?? "—"}</div>
          </div>
        </div>
      )}

      {/* Lending pool reserves */}
      {pool.reserves && pool.reserves.length > 0 && (
        <div className="border-t pt-2 mt-2 space-y-1">
          <div className="text-xs text-muted-foreground">
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
        <DetailRow label="Supply APY" value={<APYDisplay value={pool.supplyApy} />} />
      )}
      {pool.borrowApy != null && (
        <DetailRow
          label="Borrow APY"
          value={<span className="text-orange-500">{pool.borrowApy?.toFixed(2)}%</span>}
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
        <div className="flex gap-2 mt-1">
          {pool.canSupply && (
            <span className="text-xs bg-green-500/10 text-green-500 rounded-full px-2 py-0.5">
              Supply
            </span>
          )}
          {pool.canBorrow && (
            <span className="text-xs bg-orange-500/10 text-orange-500 rounded-full px-2 py-0.5">
              Borrow
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const PoolInfoCard = memo(PoolInfoCardComponent);
