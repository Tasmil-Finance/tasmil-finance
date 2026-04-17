"use client";

import { Check, Copy, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddressAvatar } from "@/shared/components/connect-wallet-button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/lib/utils";

function shortenAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

interface WalletHeaderProps {
  address: string;
  totalUsd: number;
  isLoading: boolean;
  pnlUsd?: number;
  pnlPercent?: number;
}

export function WalletHeader({
  address,
  totalUsd,
  isLoading,
  pnlUsd,
  pnlPercent,
}: WalletHeaderProps) {
  const [copied, setCopied] = useState(false);
  const hasPnl = pnlUsd != null && pnlPercent != null;
  const isPositive = (pnlUsd ?? 0) >= 0;

  function handleCopy() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AddressAvatar address={address} size="size-20" iconSize="size-9" />

      <div className="flex flex-col gap-1">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-base font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          <span>{shortenAddress(address)}</span>
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="h-4 w-4 text-primary" />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy className="h-4 w-4 text-muted-foreground" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-0.5"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className="text-5xl font-bold tracking-tight text-foreground">
              {formatUsd(totalUsd)}
            </span>
            {hasPnl && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
              >
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-base font-medium",
                    isPositive ? "text-emerald-400" : "text-destructive",
                  )}
                >
                  {isPositive ? "+" : ""}
                  {formatUsd(pnlUsd!)}
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-sm font-semibold",
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-destructive/10 text-destructive",
                  )}
                >
                  {isPositive ? "+" : ""}
                  {pnlPercent!.toFixed(2)}%
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
