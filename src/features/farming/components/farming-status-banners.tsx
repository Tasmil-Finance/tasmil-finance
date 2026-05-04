"use client";

import { Info, Shield, Wallet, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { AccountStatus } from "@/features/account/types";
import { Button } from "@/shared/ui/button-v2";

interface FarmingStatusBannersProps {
  status: AccountStatus;
  balanceStale: boolean;
  sessionKeyStale: boolean;
  onRefresh: () => void;
  onDeposit: () => void;
}

interface BannerSpec {
  key: string;
  icon: ReactNode;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void; variant: "outline" | "gradient" };
  tone: "destructive" | "warning" | "muted";
}

const TONE_CLASSES: Record<BannerSpec["tone"], string> = {
  destructive: "border-destructive/40 bg-destructive/10",
  warning: "border-yellow-500/40 bg-yellow-500/10",
  muted: "border-border bg-muted/10",
};

export function FarmingStatusBanners({
  status,
  balanceStale,
  sessionKeyStale,
  onRefresh,
  onDeposit,
}: FarmingStatusBannersProps) {
  const banners: BannerSpec[] = [];

  if (status === "HALTED") {
    banners.push({
      key: "halted",
      icon: <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />,
      title: "Bot halted",
      body: "The bot stopped after consecutive failures. Funds are safe in your keeper wallet; deposits/withdrawals still work.",
      tone: "destructive",
    });
  }

  if (status === "AWAITING_FUND") {
    banners.push({
      key: "awaiting-fund",
      icon: <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />,
      title: "Vault deployed but unfunded",
      body: "Deposit USDC or XLM to start earning. The agent will allocate as soon as funds arrive.",
      action: { label: "Deposit", onClick: onDeposit, variant: "gradient" },
      tone: "warning",
    });
  }

  if (sessionKeyStale) {
    banners.push({
      key: "session-key-stale",
      icon: <Shield className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />,
      title: "New yield strategies available",
      body: "Your session key was registered before we launched some pools. Refresh it to let the bot access the latest opportunities. Your funds stay in your keeper wallet — this just updates the bot's scope.",
      action: { label: "Refresh", onClick: onRefresh, variant: "outline" },
      tone: "warning",
    });
  }

  if (balanceStale) {
    banners.push({
      key: "balance-stale",
      icon: <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />,
      title: "Balance is stale",
      body: "We couldn't read on-chain balances on the last cycle. Values may not reflect current state.",
      tone: "muted",
    });
  }

  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {banners.map((b) => (
        <div
          key={b.key}
          role="alert"
          className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${TONE_CLASSES[b.tone]}`}
        >
          {b.icon}
          <div className="flex-1">
            <p className="font-medium text-foreground">{b.title}</p>
            <p className="text-muted-foreground">{b.body}</p>
          </div>
          {b.action && (
            <Button variant={b.action.variant} size="sm" onClick={b.action.onClick}>
              {b.action.label}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
