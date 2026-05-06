"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PROTOCOL_ICONS as CDN_PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";
import { Button } from "@/shared/ui/button-v2";
import type { ProtocolPositionGroup } from "../hooks/use-defi-positions";
import { getCachedPrices } from "../hooks/use-wallet-tokens";

const PROTOCOL_ICONS: Record<string, string> = {
  blend: CDN_PROTOCOL_ICONS.blend!,
  soroswap: CDN_PROTOCOL_ICONS.soroswap!,
  aquarius: CDN_PROTOCOL_ICONS.aquarius!,
  phoenix: CDN_PROTOCOL_ICONS.phoenix!,
};

const PROTOCOL_NAMES: Record<string, string> = {
  blend: "Blend",
  soroswap: "Soroswap",
  aquarius: "Aquarius",
  phoenix: "Phoenix",
};

interface ProtocolReward {
  protocol: string;
  displayName: string;
  icon: string | null;
  token: string;
  amount: number;
  amountUsd: number;
}

function aggregateRewards(groups: ProtocolPositionGroup[]): ProtocolReward[] {
  const priceMap = getCachedPrices();
  const map = new Map<string, ProtocolReward>();

  for (const g of groups) {
    if (!g.rewards || g.rewards.amount <= 0) continue;
    const key = g.protocol;
    const existing = map.get(key);
    const price = priceMap[g.rewards.token.toUpperCase()] ?? 0;
    const usd = g.rewards.amount * price;

    if (existing) {
      existing.amount += g.rewards.amount;
      existing.amountUsd += usd;
    } else {
      map.set(key, {
        protocol: key,
        displayName: PROTOCOL_NAMES[key] ?? key.replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: PROTOCOL_ICONS[key] ?? null,
        token: g.rewards.token,
        amount: g.rewards.amount,
        amountUsd: usd,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.amountUsd - a.amountUsd);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

interface ProtocolRewardsCardProps {
  groups: ProtocolPositionGroup[];
  className?: string;
}

export function ProtocolRewardsCard({ groups, className }: ProtocolRewardsCardProps) {
  const rewards = useMemo(() => aggregateRewards(groups), [groups]);

  const totalUsd = rewards.reduce((s, r) => s + r.amountUsd, 0);

  const handleClaimAll = () => {
    toast.info("Claim flow coming soon", {
      description: `Total: ${formatUsd(totalUsd)} across ${rewards.length} protocol${rewards.length !== 1 ? "s" : ""}`,
    });
  };

  const handleClaim = (r: ProtocolReward) => {
    toast.info(`Claim ${r.displayName} coming soon`, {
      description: `${r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${r.token}`,
    });
  };

  return (
    <motion.div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <div className="flex items-center gap-2.5 px-6 py-4">
        <Coins className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        <span className="text-lg font-medium text-foreground tabular-nums">
          Rewards - {formatUsd(totalUsd)}
        </span>
        <span className="text-base text-muted-foreground">
          - {rewards.length} protocol{rewards.length !== 1 ? "s" : ""}
        </span>
        <Button
          variant="default"
          size="sm"
          className="ml-auto bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
          disabled={rewards.length === 0}
          onClick={handleClaimAll}
        >
          Claim all
        </Button>
      </div>

      <div className="border-t border-border" />

      <div className="max-h-[180px] overflow-y-auto">
        {rewards.length === 0 ? (
          <div className="flex items-center justify-center px-6 py-8 text-sm text-muted-foreground">
            No claimable rewards
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rewards.map((r) => (
              <li
                key={r.protocol}
                className="flex items-center gap-3 px-6 py-3"
              >
                {r.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.icon}
                    alt={r.displayName}
                    className="h-7 w-7 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-muted/30" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{r.displayName}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {r.token}
                    {r.amountUsd > 0 && (
                      <span className="ml-1.5">({formatUsd(r.amountUsd)})</span>
                    )}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => handleClaim(r)}
                >
                  Claim
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
