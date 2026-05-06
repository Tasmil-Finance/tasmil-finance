"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Layers, Wallet } from "lucide-react";
import { useState } from "react";
import { CreditsPill } from "@/features/credits/credits-pill";
import { AddressAvatar } from "@/shared/components/connect-wallet-button";
import { Skeleton } from "@/shared/ui/skeleton";

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
  walletUsd: number;
  positionsUsd: number;
  isLoading: boolean;
}

export function WalletHeader({
  address,
  totalUsd,
  walletUsd,
  positionsUsd,
  isLoading,
}: WalletHeaderProps) {
  const [copied, setCopied] = useState(false);

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
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 font-medium text-base text-foreground transition-colors hover:text-muted-foreground"
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
          <CreditsPill />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-40 rounded-lg" />
            <Skeleton className="h-5 w-28 rounded-md" />
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-1"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <span className="font-bold text-5xl text-foreground tracking-tight">
              {formatUsd(totalUsd)}
            </span>
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" />
                {formatUsd(walletUsd)}
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
                {formatUsd(positionsUsd)}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
