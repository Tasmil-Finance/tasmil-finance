"use client";

interface Props {
  netApr: number;
  currentPositionApr: number;
  currentMarketName: string;
  rewardsApr?: number;
  activatedAt: string;
  totalDepositsUsd: number;
}

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
};

export function AprSummaryCard({
  netApr,
  currentPositionApr,
  currentMarketName,
  rewardsApr,
  activatedAt,
  totalDepositsUsd,
}: Props) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Tasmil Net APR</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">{netApr.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current Position APR</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">
            {currentMarketName} {currentPositionApr.toFixed(2)}%
          </p>
        </div>
        {typeof rewardsApr === "number" && (
          <div>
            <p className="text-xs text-muted-foreground">Tasmil Rewards APR</p>
            <p className="mt-1 font-mono text-foreground tabular-nums">{rewardsApr.toFixed(2)}%</p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Activation Date</p>
          <p className="mt-1 text-foreground">{fmtDate(activatedAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Deposits</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">{fmtUsd(totalDepositsUsd)} USDC</p>
        </div>
      </div>
    </div>
  );
}
