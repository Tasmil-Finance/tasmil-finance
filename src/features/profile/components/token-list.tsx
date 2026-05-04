"use client";

import { motion } from "framer-motion";
import { ExternalLink, Eye, Plus, Wallet } from "lucide-react";
import { useState } from "react";
import { TokenImage } from "@/shared/components/token-image";
import { getExplorerUrl } from "@/shared/config/stellar";
import { Button } from "@/shared/ui/button-v2";
import { Skeleton } from "@/shared/ui/skeleton";
import type { WalletToken } from "../hooks/use-wallet-tokens";
import { AddAssetDialog } from "./add-asset-dialog";
import { AddTrustlineDialog } from "./add-trustline-dialog";
import { WatchListSection } from "./watch-list-section";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPrice(value: number): string {
  if (value === 0) return "—";
  if (value >= 1) return formatUsd(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumSignificantDigits: 4,
  }).format(value);
}

function formatBalance(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
  if (value >= 1) return value.toFixed(4);
  return value.toPrecision(4);
}

function shortenIssuer(addr: string): string {
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/** Build the Stellar Expert asset identifier: "XLM" or "CODE-ISSUER" */
function assetExplorerSlug(code: string, issuer: string | null): string {
  if (!issuer) return "XLM";
  return `${code}-${issuer}`;
}

const ROW_GRID = "grid grid-cols-[2fr_1fr_1.2fr_1fr_20px] items-center gap-x-4";

interface TokenListProps {
  tokens: WalletToken[];
  totalUsd: number;
  isLoading: boolean;
}

export function TokenList({ tokens, totalUsd, isLoading }: TokenListProps) {
  const [trustlineOpen, setTrustlineOpen] = useState(false);
  const [watchAssetOpen, setWatchAssetOpen] = useState(false);

  if (isLoading) {
    return (
      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-xl font-semibold text-foreground">Assets</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3 px-6 py-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="h-px bg-border" />
          {/* Column headers skeleton */}
          <div className={`${ROW_GRID} px-6 py-2.5`}>
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="ml-auto h-3 w-10" />
            <div />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className={`${ROW_GRID} border-t border-border px-6 py-3.5`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-4 w-16" />
              <div />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Assets</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setWatchAssetOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              Watch Asset
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setTrustlineOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Trustline
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-12 text-muted-foreground">
          <p className="text-sm">No token balances found</p>
        </div>
        <AddTrustlineDialog open={trustlineOpen} onOpenChange={setTrustlineOpen} />
        <AddAssetDialog open={watchAssetOpen} onOpenChange={setWatchAssetOpen} />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Assets</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setWatchAssetOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            Watch Asset
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setTrustlineOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Trustline
          </Button>
        </div>
      </div>

      <WatchListSection />

      <div
        data-onborda="portfolio-assets"
        className="overflow-hidden rounded-xl border border-border bg-card"
      >
        {/* Wallet summary */}
        <div className="flex items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="text-lg font-medium text-foreground">
            Wallet · {formatUsd(totalUsd)}
          </span>
          <span className="text-base text-muted-foreground">{tokens.length} assets</span>
        </div>

        <div className="h-px bg-border" />

        {/* Column headers */}
        <div className={`${ROW_GRID} px-6 py-2.5`}>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Asset
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Price
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Balance
          </span>
          <span className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Value
          </span>
          {/* spacer for link icon column */}
          <span />
        </div>

        {/* Token rows */}
        {tokens.map((token, idx) => {
          const slug = assetExplorerSlug(token.assetCode, token.assetIssuer);
          const href = getExplorerUrl("asset", slug);

          return (
            <motion.a
              key={`${token.assetCode}-${token.assetIssuer ?? "native"}-${idx}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${ROW_GRID} group border-t border-border px-6 py-3.5 transition-colors hover:bg-muted/20`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
            >
              {/* Asset */}
              <div className="flex items-center gap-3">
                <TokenImage
                  alt={token.assetCode}
                  className="h-8 w-8 shrink-0 rounded-full text-[11px]"
                />
                <div className="flex flex-col">
                  <span className="text-base font-medium text-foreground">{token.assetCode}</span>
                  {token.assetIssuer && (
                    <span className="text-sm text-muted-foreground">
                      {shortenIssuer(token.assetIssuer)}
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <span className="text-base text-foreground">{formatPrice(token.price)}</span>

              {/* Balance */}
              <span className="text-base text-foreground">
                {formatBalance(token.balance)} {token.assetCode}
              </span>

              {/* Value */}
              <span className="text-right text-base font-medium text-foreground">
                {token.valueUsd > 0 ? formatUsd(token.valueUsd) : "—"}
              </span>

              {/* Explorer link indicator */}
              <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-50" />
            </motion.a>
          );
        })}
      </div>

      <AddTrustlineDialog open={trustlineOpen} onOpenChange={setTrustlineOpen} />
      <AddAssetDialog open={watchAssetOpen} onOpenChange={setWatchAssetOpen} />
    </motion.div>
  );
}
