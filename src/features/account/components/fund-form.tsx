"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

interface FundFormProps {
  onFund: (amount: number, token: "USDC" | "XLM") => void;
  isLoading: boolean;
}

const QUICK_AMOUNTS = [100, 500, 1000] as const;

export function FundForm({ onFund, isLoading }: FundFormProps) {
  const [amount, setAmount] = useState("");
  const token = "USDC" as const;

  const parsedAmount = Number.parseFloat(amount);
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount >= 10;

  const handleSubmit = () => {
    if (!isValid || isLoading) return;
    onFund(parsedAmount, token);
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-5">
      {/* Token display */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-2 text-sm">
        <span className="font-medium text-foreground">{token}</span>
        <span className="text-muted-foreground">on Stellar</span>
      </div>

      {/* Amount input */}
      <div>
        <label htmlFor="fund-amount" className="mb-1 block text-muted-foreground text-xs">
          Amount (min $10)
        </label>
        <input
          id="fund-amount"
          type="number"
          min="10"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-foreground text-lg focus:border-primary focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Quick amount buttons */}
      <div className="flex gap-2">
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(q))}
            disabled={isLoading}
            className={cn(
              "rounded-md border border-border bg-muted/40 px-3 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-foreground disabled:opacity-50",
              parsedAmount === q && "border-primary text-foreground",
            )}
          >
            ${q}
          </button>
        ))}
      </div>

      {/* Submit */}
      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={handleSubmit}
        disabled={!isValid || isLoading}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Processing..." : `Fund ${isValid ? `$${parsedAmount}` : ""} ${token}`}
      </Button>
    </div>
  );
}
