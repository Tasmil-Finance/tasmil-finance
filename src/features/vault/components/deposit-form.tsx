"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

import { QUICK_AMOUNTS_USD } from "../constants";
import type { DepositResponse, DepositStatus, VaultToken } from "../types";
import { TokenSelector } from "./token-selector";

interface DepositFormProps {
  status: DepositStatus;
  lastData?: DepositResponse;
  onDeposit: (token: VaultToken, amount: string) => void;
  className?: string;
}

const BUTTON_TEXT: Record<DepositStatus, string> = {
  idle: "Deposit",
  building: "Building transaction...",
  signing: "Sign in wallet...",
  confirming: "Confirming...",
  success: "Deposited!",
  error: "Try again",
};

export function DepositForm({ status, lastData, onDeposit, className }: DepositFormProps) {
  const [token, setToken] = useState<VaultToken>("USDC");
  const [amount, setAmount] = useState("");

  const isProcessing = status === "building" || status === "signing" || status === "confirming";
  const parsedAmount = Number.parseFloat(amount);
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const handleSubmit = () => {
    if (!isValid || isProcessing) return;
    onDeposit(token, amount);
  };

  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-muted/20 p-5", className)}>
      <TokenSelector value={token} onChange={setToken} />

      <div>
        <label htmlFor="deposit-amount" className="mb-1 block text-muted-foreground text-xs">
          Amount
        </label>
        <input
          id="deposit-amount"
          type="number"
          min="0"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isProcessing}
          className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-foreground text-lg focus:border-primary focus:outline-none disabled:opacity-50"
        />
      </div>

      <div className="flex gap-2">
        {QUICK_AMOUNTS_USD.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setAmount(String(q))}
            disabled={isProcessing}
            className="rounded-md border border-border bg-muted/40 px-3 py-1 text-muted-foreground text-xs transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
          >
            {q} {token}
          </button>
        ))}
      </div>

      {lastData && status !== "error" && (
        <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated shares</span>
            <span className="text-foreground">{lastData.estimatedShares}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value</span>
            <span className="text-foreground">${lastData.estimatedValueUsd}</span>
          </div>
        </div>
      )}

      <Button
        variant="gradient"
        size="lg"
        className="h-12 w-full"
        onClick={handleSubmit}
        disabled={(!isValid && status === "idle") || isProcessing}
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {BUTTON_TEXT[status]}
      </Button>
    </div>
  );
}
