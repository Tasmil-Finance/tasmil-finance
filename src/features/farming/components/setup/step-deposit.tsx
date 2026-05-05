"use client";

import { Loader2, Lock } from "lucide-react";
import { useId, useState } from "react";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import type { Asset } from "../shared/asset-pill";

const MIN_AMOUNTS: Record<Asset, number> = {
  USDC: 1,
  XLM: 10,
};

interface Props {
  asset: Asset;
  preset: RiskPreset;
  estimatedApy: number;
  poolCount: number;
  balance: number;
  isFunding: boolean;
  onFund: (amount: number, asset: Asset) => void;
}

export function StepDeposit({
  asset,
  estimatedApy,
  poolCount,
  balance,
  isFunding,
  onFund,
}: Props) {
  const [amount, setAmount] = useState("");
  const inputId = useId();

  const parsed = Number.parseFloat(amount);
  const min = MIN_AMOUNTS[asset];
  const isValid = !Number.isNaN(parsed) && parsed >= min;
  const exceedsBalance = isValid && parsed > balance;
  const canSubmit = isValid && !exceedsBalance && !isFunding;

  const projectedYearly = isValid ? parsed * (estimatedApy / 100) : null;

  const handleMax = () => {
    if (balance <= 0) return;
    const max = asset === "XLM" ? Math.max(0, balance - 2) : balance;
    setAmount(max.toFixed(asset === "USDC" ? 2 : 4));
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-2">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">Your Deposit</p>
        <div className="flex items-baseline gap-3">
          <input
            id={inputId}
            aria-label="Deposit amount"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent font-mono text-5xl text-foreground tabular-nums outline-none placeholder:text-muted-foreground/40 md:text-6xl"
          />
          <span className="font-mono text-3xl text-muted-foreground/70 md:text-4xl">{asset}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: asset === "USDC" ? 2 : 4,
            })}{" "}
            {asset} available
          </p>
          <button
            type="button"
            onClick={handleMax}
            className="rounded-md px-2 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Max
          </button>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">You'll earn / per year</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">
            {projectedYearly === null
              ? "—"
              : `$${projectedYearly.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">APR</p>
          <p className="mt-1 font-mono text-foreground tabular-nums">{estimatedApy.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Markets</p>
          <p className="mt-1 text-foreground">{poolCount} markets</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Allocate to at least</p>
          <p className="mt-1 text-foreground underline decoration-dotted underline-offset-4">
            1 market
          </p>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-foreground">Optimizer locked</h3>
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="max-w-md text-xs text-muted-foreground leading-relaxed">
            Fine-grained controls for exposure and diversification are available for deposits above
            25,000 {asset}. System constraints take precedence.
          </p>
        </div>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onFund(parsed, asset)}
          className={cn(
            "flex h-24 w-24 shrink-0 items-center justify-center rounded-full font-semibold text-sm transition-colors",
            canSubmit
              ? "bg-foreground text-background hover:bg-foreground/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          )}
        >
          {isFunding ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deposit"}
        </button>
      </div>

      {exceedsBalance && (
        <p className="text-xs text-destructive">
          Exceeds your available {asset} balance.
        </p>
      )}
    </div>
  );
}
