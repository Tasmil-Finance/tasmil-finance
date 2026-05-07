"use client";

import { motion } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PROTOCOL_ICONS as CDN_PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";
import { ClaimAuthError, type ClaimProtocol, useClaimRewards } from "../hooks/use-claim-rewards";
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
  /** On-chain pool/contract address — required to build the claim TX. */
  poolAddress?: string;
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
        poolAddress: g.poolAddress,
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
        poolAddress: p.poolAddress,
      });
    }
  }

  return out.sort((a, b) => b.amountUsd - a.amountUsd);
}

function isClaimableProtocol(p: string): p is ClaimProtocol {
  return p === "aquarius" || p === "blend";
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
  const rewards = useMemo(() => expandRewards(groups), [groups]);
  const totalUsd = rewards.reduce((s, r) => s + r.amountUsd, 0);
  const protocolCount = useMemo(() => new Set(rewards.map((r) => r.protocol)).size, [rewards]);

  const { account } = useWalletStore();
  const { connect } = useWallet();
  const claim = useClaimRewards();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const runClaim = async (r: PoolReward) => {
    if (!account) {
      toast.error("Connect your wallet to claim rewards");
      return;
    }
    if (!isClaimableProtocol(r.protocol)) {
      toast.info(`${r.protocolName} claim isn't supported yet`);
      return;
    }
    if (!r.poolAddress) {
      toast.error(`Missing pool address for ${r.protocolName} · ${r.poolName}`);
      return;
    }

    setPendingKey(r.key);
    const id = toast.loading(`Claiming ${r.protocolName} · ${r.poolName}…`, {
      description: `${r.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${r.token}`,
    });
    try {
      const { txHash } = await claim.mutateAsync({
        protocol: r.protocol,
        publicKey: account,
        poolAddress: r.poolAddress,
      });
      toast.success(`Claimed ${r.protocolName} · ${r.poolName}`, {
        id,
        description: `tx ${txHash.slice(0, 8)}…${txHash.slice(-6)}`,
      });
    } catch (err: unknown) {
      const userRejected = (err as { userRejected?: boolean })?.userRejected === true;
      const isAuthError =
        err instanceof ClaimAuthError ||
        (err as { response?: { status?: number } })?.response?.status === 401;
      const message = err instanceof Error ? err.message : String(err ?? "Claim failed");

      if (userRejected) {
        toast.warning("Signing was cancelled", { id });
      } else if (isAuthError) {
        toast.error("Sign in to claim", {
          id,
          description: "Reconnect your wallet to issue a fresh session token.",
          action: {
            label: "Reconnect",
            onClick: () => {
              void connect();
            },
          },
          duration: 8000,
        });
      } else {
        toast.error(`Claim failed: ${message}`, { id });
      }
    } finally {
      setPendingKey(null);
    }
  };

  const handleClaimAll = async () => {
    if (rewards.length === 0) return;
    for (const r of rewards) {
      // Skip what we can't claim from the UI yet (Phoenix, Soroswap, etc.)
      if (!isClaimableProtocol(r.protocol) || !r.poolAddress) continue;
      // Sequential: each claim signs in Freighter one-at-a-time.
      // eslint-disable-next-line no-await-in-loop
      await runClaim(r);
    }
  };

  const handleClaim = (r: PoolReward) => {
    void runClaim(r);
  };

  const isPending = (key: string) => pendingKey === key;
  const anyPending = pendingKey !== null;

  return (
    <motion.div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card",
        className
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
          disabled={rewards.length === 0 || anyPending}
          onClick={() => void handleClaimAll()}
        >
          {anyPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim all"}
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
                    {r.amountUsd > 0 && <span className="ml-1.5">({formatUsd(r.amountUsd)})</span>}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  disabled={anyPending}
                  onClick={() => handleClaim(r)}
                >
                  {isPending(r.key) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Claim"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
