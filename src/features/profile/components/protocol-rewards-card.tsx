"use client";

import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useSearchParams } from "next/navigation";
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

interface PoolReward {
  key: string;
  protocol: string;
  protocolName: string;
  /** Pool-specific display name (e.g. "Etherfuse Pool", "XLM/USDC"). */
  poolName: string;
  icon: string | null;
  token: string;
  amount: number;
  amountUsd: number;
}

function expandRewards(groups: ProtocolPositionGroup[]): PoolReward[] {
  const priceMap = getCachedPrices();
  const out: PoolReward[] = [];

  for (const g of groups) {
    const protocolName = PROTOCOL_NAMES[g.protocol] ?? g.protocol;
    const icon = PROTOCOL_ICONS[g.protocol] ?? null;

    // Group-level rewards (Blend uses this)
    if (g.rewards && g.rewards.amount > 0) {
      const price = priceMap[g.rewards.token.toUpperCase()] ?? 0;
      const poolName = g.displayName.includes("·")
        ? g.displayName.split("·").slice(1).join("·").trim()
        : g.displayName;
      out.push({
        key: `${g.protocol}:group:${g.displayName}`,
        protocol: g.protocol,
        protocolName,
        poolName,
        icon,
        token: g.rewards.token,
        amount: g.rewards.amount,
        amountUsd: g.rewards.amount * price,
      });
    }

    // Position-level rewards (Aquarius uses this — one row per pool)
    for (const p of g.positions) {
      if (!p.rewards || p.rewards.amount <= 0) continue;
      const price = priceMap[p.rewards.token.toUpperCase()] ?? 0;
      const poolName = p.name.replace(/ LP$/, "");
      out.push({
        key: `${g.protocol}:pool:${p.name}`,
        protocol: g.protocol,
        protocolName,
        poolName,
        icon,
        token: p.rewards.token,
        amount: p.rewards.amount,
        amountUsd: p.rewards.amount * price,
      });
    }
  }

  return out.sort((a, b) => b.amountUsd - a.amountUsd);
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// ─── Mock data for visual testing ─────────────────────────────────────────
// Toggle via ?mock=rewards (full data) | ?mock=empty (no rewards) | (none = real)
const MOCK_REWARDS: PoolReward[] = [
  {
    key: "aquarius:pool:XLM/USDC",
    protocol: "aquarius",
    protocolName: "Aquarius",
    poolName: "XLM/USDC",
    icon: PROTOCOL_ICONS.aquarius ?? null,
    token: "AQUA",
    amount: 0.4253,
    amountUsd: 0.27,
  },
  {
    key: "aquarius:pool:XLM/EURC",
    protocol: "aquarius",
    protocolName: "Aquarius",
    poolName: "XLM/EURC",
    icon: PROTOCOL_ICONS.aquarius ?? null,
    token: "AQUA",
    amount: 12.4881,
    amountUsd: 7.92,
  },
  {
    key: "aquarius:pool:USDC/EURC",
    protocol: "aquarius",
    protocolName: "Aquarius",
    poolName: "USDC/EURC",
    icon: PROTOCOL_ICONS.aquarius ?? null,
    token: "AQUA",
    amount: 0.082,
    amountUsd: 0.05,
  },
  {
    key: "blend:group:Etherfuse Pool",
    protocol: "blend",
    protocolName: "Blend",
    poolName: "Etherfuse Pool",
    icon: PROTOCOL_ICONS.blend ?? null,
    token: "BLND",
    amount: 1.2345,
    amountUsd: 0.12,
  },
  {
    key: "blend:group:Fixed Pool",
    protocol: "blend",
    protocolName: "Blend",
    poolName: "Fixed Pool",
    icon: PROTOCOL_ICONS.blend ?? null,
    token: "BLND",
    amount: 0.0341,
    amountUsd: 0.0,
  },
];

interface ProtocolRewardsCardProps {
  groups: ProtocolPositionGroup[];
  className?: string;
}

export function ProtocolRewardsCard({ groups, className }: ProtocolRewardsCardProps) {
  const searchParams = useSearchParams();
  const mockMode = searchParams.get("mock");

  const rewards = useMemo(() => {
    if (mockMode === "empty") return [] as PoolReward[];
    if (mockMode === "rewards") return MOCK_REWARDS;
    return expandRewards(groups);
  }, [groups, mockMode]);
  const totalUsd = rewards.reduce((s, r) => s + r.amountUsd, 0);
  const protocolCount = useMemo(
    () => new Set(rewards.map((r) => r.protocol)).size,
    [rewards],
  );

  const handleClaimAll = () => {
    toast.info("Claim all coming soon", {
      description: `Total ${formatUsd(totalUsd)} across ${rewards.length} pool${rewards.length !== 1 ? "s" : ""}`,
    });
  };

  const handleClaim = (r: PoolReward) => {
    toast.info(`Claim ${r.protocolName} · ${r.poolName} — coming soon`, {
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
          - {protocolCount} protocol{protocolCount !== 1 ? "s" : ""}
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

      <div className="max-h-[200px] overflow-y-auto">
        {rewards.length === 0 ? (
          <div className="flex items-center justify-center px-6 py-8 text-sm text-muted-foreground">
            No claimable rewards
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {rewards.map((r) => (
              <li key={r.key} className="flex items-center gap-3 px-6 py-3">
                {r.icon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.icon}
                    alt={r.protocolName}
                    className="h-7 w-7 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-muted/30" />
                )}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {r.protocolName} · {r.poolName}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
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
