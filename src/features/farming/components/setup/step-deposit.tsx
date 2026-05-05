"use client";

import { ChevronLeft, Loader2 } from "lucide-react";
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
  onBack?: () => void;
}

export function StepDeposit({
  asset,
  estimatedApy,
  poolCount,
  balance,
  isFunding,
  onFund,
  onBack,
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
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-background px-6 pt-6 pb-24">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute top-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 pt-12 md:gap-12">
        {/* Hero amount */}
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
              className="w-full bg-transparent font-light font-mono text-6xl text-foreground tabular-nums outline-none placeholder:text-muted-foreground/40 md:text-8xl"
            />
            <span className="font-light font-mono text-3xl text-muted-foreground/70 md:text-5xl">
              {asset}
            </span>
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

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">You'll earn / per year</p>
            <p className="mt-2 font-mono text-foreground tabular-nums">
              {projectedYearly === null
                ? "—"
                : `$${projectedYearly.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">APR</p>
            <p className="mt-2 font-mono text-foreground tabular-nums">{estimatedApy.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Markets</p>
            <p className="mt-2 text-foreground">{poolCount} markets</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Allocate to at least</p>
            <p className="mt-2 text-foreground underline decoration-dotted underline-offset-4">
              1 market
            </p>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Big deposit orb */}
        <div className="flex justify-center">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onFund(parsed, asset)}
            aria-label="Deposit"
            className={cn(
              "flex h-[240px] w-[240px] shrink-0 items-center justify-center rounded-full font-medium text-lg transition-transform duration-200 md:h-[300px] md:w-[300px] md:text-xl",
              canSubmit
                ? "text-zinc-900 hover:scale-[1.02] active:scale-[0.99]"
                : "cursor-not-allowed bg-zinc-800 text-muted-foreground"
            )}
            style={
              canSubmit
                ? {
                    background:
                      "radial-gradient(circle at 30% 25%, rgba(197,240,255,0.95) 0%, rgba(125,217,255,0.92) 25%, rgba(56,182,240,0.88) 55%, rgba(0,140,200,0.85) 100%), radial-gradient(circle at 75% 75%, rgba(0,191,255,0.55), transparent 60%)",
                    boxShadow:
                      "0 0 100px rgba(0,191,255,0.35), inset 0 4px 50px rgba(255,255,255,0.3), inset 0 -8px 50px rgba(2,80,120,0.4)",
                  }
                : undefined
            }
          >
            {isFunding ? <Loader2 className="h-7 w-7 animate-spin" /> : "Deposit"}
          </button>
        </div>

        {exceedsBalance && (
          <p className="text-xs text-destructive">
            Exceeds your available {asset} balance.
          </p>
        )}
      </div>

      {/* bottom-left tagline */}
      <div className="pointer-events-none absolute bottom-6 left-6 max-w-[160px] text-xs text-muted-foreground/70 leading-snug">
        Your portfolio keeps
        <br />
        thinking even when
        <br />
        you don't.
      </div>

      {/* bottom-right copyright */}
      <div className="pointer-events-none absolute right-6 bottom-6 text-right text-xs text-muted-foreground/70 leading-snug">
        © 2026 Tasmil
        <br />
        X / Linkedin
      </div>
    </div>
  );
}
