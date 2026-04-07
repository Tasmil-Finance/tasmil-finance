"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

import type { VaultPosition, VaultToken, WithdrawResponse, WithdrawStatus } from "../types";
import { TokenSelector } from "./token-selector";

interface WithdrawCardProps {
  position: VaultPosition;
  status: WithdrawStatus;
  lastData?: WithdrawResponse;
  onWithdraw: (token: VaultToken, shares: string) => void;
  className?: string;
}

const BUTTON_TEXT: Record<WithdrawStatus, string> = {
  idle: "Withdraw All",
  building: "Building transaction...",
  signing: "Sign in wallet...",
  confirming: "Confirming...",
  success: "Withdrawn!",
  error: "Try again",
};

export function WithdrawCard({
  position,
  status,
  lastData,
  onWithdraw,
  className,
}: WithdrawCardProps) {
  const [token, setToken] = useState<VaultToken>("USDC");
  const isProcessing = status === "building" || status === "signing" || status === "confirming";

  const handleWithdraw = () => {
    if (isProcessing) return;
    onWithdraw(token, position.shares);
  };

  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-muted/20 p-5", className)}>
      <h3 className="font-semibold text-foreground text-sm">Withdraw</h3>

      <TokenSelector value={token} onChange={setToken} />

      {lastData && status !== "error" && (
        <div className="space-y-1 rounded-lg bg-muted/40 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated receive</span>
            <span className="text-foreground">
              {lastData.estimatedAmount} {token}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value</span>
            <span className="text-foreground">${lastData.estimatedValueUsd}</span>
          </div>
        </div>
      )}

      <Button
        variant="destructive"
        size="lg"
        className="h-12 w-full"
        onClick={handleWithdraw}
        disabled={isProcessing}
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {BUTTON_TEXT[status]}
      </Button>
    </div>
  );
}
