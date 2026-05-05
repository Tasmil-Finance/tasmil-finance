"use client";

interface LpRow {
  symbol: string;
  amount: string;
}

const PLACEHOLDERS: LpRow[] = [
  { symbol: "BLND", amount: "—" },
  { symbol: "AQUA", amount: "—" },
  { symbol: "USDC", amount: "—" },
];

export function LpRewardsCard() {
  return (
    <div data-stub="true" className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-semibold text-foreground">Total LP Rewards accrued</h3>
      <ul className="mt-4 flex flex-col gap-3 text-sm">
        {PLACEHOLDERS.map((r) => (
          <li key={r.symbol} className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {r.symbol[0]}
              </span>
              <span className="text-foreground">{r.symbol}</span>
            </span>
            <span className="font-mono text-foreground/80 tabular-nums">{r.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
