"use client";

import { Loader2, Wallet } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";

import { useStellarBalances } from "../hooks/use-stellar-balance";

interface FundFormProps {
  onFund: (amount: number, token: "USDC" | "XLM") => void;
  isLoading: boolean;
}

const TOKENS = ["USDC", "XLM"] as const;
type Token = (typeof TOKENS)[number];

const MIN_AMOUNTS: Record<Token, number> = {
  USDC: 10,
  XLM: 50,
};

export function FundForm({ onFund, isLoading }: FundFormProps) {
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<Token>("USDC");
  const fundAmountId = useId();
  const { account } = useWalletStore();
  const { data: balances, isLoading: balancesLoading } = useStellarBalances(account);

  const parsedAmount = Number.parseFloat(amount);
  const minAmount = MIN_AMOUNTS[token];
  const balance = token === "USDC" ? (balances?.usdc ?? 0) : (balances?.xlm ?? 0);
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount >= minAmount;
  const exceedsBalance = isValid && parsedAmount > balance;

  const handleMax = () => {
    if (balance > 0) {
      // Leave a small XLM reserve for tx fees
      const maxAmount = token === "XLM" ? Math.max(0, balance - 2) : balance;
      setAmount(maxAmount.toFixed(token === "USDC" ? 2 : 4));
    }
  };

  const handleSubmit = () => {
    if (!isValid || isLoading || exceedsBalance) return;
    onFund(parsedAmount, token);
  };

  const formatBalance = (val: number) =>
    val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: token === "USDC" ? 2 : 4,
    });

  return (
    <div className="space-y-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
      {/* Token selector */}
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground/50">
          Select token
        </p>
        <div className="flex gap-2">
          {TOKENS.map((t) => {
            const bal = t === "USDC" ? (balances?.usdc ?? 0) : (balances?.xlm ?? 0);
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setToken(t);
                  setAmount("");
                }}
                disabled={isLoading}
                className={cn(
                  "flex flex-1 items-center justify-between rounded-xl border px-4 py-3 transition-all duration-200",
                  "disabled:opacity-50",
                  token === t
                    ? "border-primary/50 bg-primary/[0.08]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "font-semibold text-sm",
                    token === t ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {t}
                </span>
                <span className="text-[11px] text-muted-foreground/60">
                  {balancesLoading ? "..." : formatBalance(bal)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor={fundAmountId}
            className="text-[11px] uppercase tracking-widest text-muted-foreground/50"
          >
            Amount
          </label>
          <button
            type="button"
            onClick={handleMax}
            disabled={isLoading || balance <= 0}
            className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 disabled:text-muted-foreground/30 transition-colors"
          >
            <Wallet className="h-3 w-3" />
            {balancesLoading ? (
              "..."
            ) : (
              <>
                {formatBalance(balance)} {token}
                {balance > 0 && (
                  <span className="ml-1 rounded bg-primary/10 px-1 py-px font-medium text-primary">
                    MAX
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        <div className="relative">
          <input
            id={fundAmountId}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                setAmount(val);
              }
            }}
            disabled={isLoading}
            className={cn(
              "w-full rounded-xl border bg-white/[0.02] px-4 py-4 pr-16 font-mono text-2xl text-foreground",
              "placeholder:text-muted-foreground/20",
              "focus:outline-none transition-colors duration-200",
              "disabled:opacity-50",
              exceedsBalance
                ? "border-destructive/50 focus:border-destructive"
                : "border-white/[0.08] focus:border-primary/50",
            )}
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 font-medium text-muted-foreground/40 text-sm">
            {token}
          </span>
        </div>

        {/* Validation messages */}
        {amount !== "" && !Number.isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount < minAmount && (
          <p className="mt-1.5 text-[11px] text-muted-foreground/60">
            Minimum {minAmount} {token}
          </p>
        )}
        {exceedsBalance && (
          <p className="mt-1.5 text-[11px] text-destructive">
            Insufficient balance
          </p>
        )}
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2">
        {[25, 50, 75, 100].map((pct) => {
          const quickVal = balance * (pct / 100);
          const adjusted = token === "XLM" && pct === 100 ? Math.max(0, quickVal - 2) : quickVal;
          return (
            <button
              key={pct}
              type="button"
              onClick={() => {
                if (adjusted > 0) {
                  setAmount(adjusted.toFixed(token === "USDC" ? 2 : 4));
                }
              }}
              disabled={isLoading || balance <= 0}
              className={cn(
                "flex-1 rounded-lg border border-white/[0.06] bg-white/[0.02] py-1.5 text-xs transition-colors",
                "hover:border-white/[0.12] hover:bg-white/[0.05] hover:text-foreground",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "text-muted-foreground/70",
              )}
            >
              {pct}%
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={handleSubmit}
        disabled={!isValid || isLoading || exceedsBalance}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading
          ? "Processing..."
          : `Fund ${isValid ? `${parsedAmount.toLocaleString()} ${token}` : ""}`}
      </Button>
    </div>
  );
}
