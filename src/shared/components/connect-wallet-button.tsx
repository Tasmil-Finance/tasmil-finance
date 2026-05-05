"use client";

import { Check, ChevronDown, Copy, ExternalLink, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCredits } from "@/features/credits/use-credits";
import { cn } from "@/lib/utils";
import { getExplorerUrl, isMainnet } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Typography } from "@/shared/ui/typography";
import { ReplayMenuItem } from "./replay-menu-item";

const networkLabel = isMainnet ? "Mainnet" : "Testnet";

function explorerUrl(address: string): string {
  return getExplorerUrl("account", address);
}

interface AddressAvatarProps {
  address: string;
  size?: string;
  iconSize?: string;
}

const AddressAvatar = ({ address, size = "size-12", iconSize }: AddressAvatarProps) => {
  const hash = address.split("").reduce((acc, char) => {
    const newAcc = (acc << 5) - acc + char.charCodeAt(0);
    return newAcc & newAcc;
  }, 0);

  const colors = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-pink-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-cyan-500 to-blue-600",
    "bg-gradient-to-br from-pink-500 to-purple-600",
    "bg-gradient-to-br from-yellow-500 to-orange-600",
    "bg-gradient-to-br from-indigo-500 to-purple-600",
  ];

  const colorIndex = Math.abs(hash) % colors.length;
  const gradientClass = colors[colorIndex];

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-white/20 font-bold text-sm text-white",
        size,
        gradientClass
      )}
    >
      <User className={cn("size-5", iconSize)} />
    </div>
  );
};

interface ConnectWalletButtonProps {
  variant?: "topbar" | "sidebar";
}

export function ConnectWalletButton({ variant = "sidebar" }: ConnectWalletButtonProps) {
  const { isConnected, address, displayAddress, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === "topbar") {
    return (
      <TopbarWallet
        isConnected={isConnected}
        address={address}
        displayAddress={displayAddress}
        connect={connect}
        disconnect={disconnect}
        copied={copied}
        copyAddress={copyAddress}
      />
    );
  }

  // ── Connected: expanded sidebar (default) ───────────────────────────
  if (!isConnected) {
    return (
      <Button className="w-full" onClick={connect} variant="gradient" data-testid="connect-wallet">
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex h-auto w-full items-center justify-start gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
          variant="ghost"
          data-testid="wallet-connected"
        >
          <AddressAvatar address={address || ""} size="size-8" />
          <div className="min-w-0 flex-1 text-left">
            <Typography className="text-white" size="sm" weight="medium">
              {displayAddress}
            </Typography>
            <Typography className="text-muted-foreground" size="xs">
              {networkLabel}
            </Typography>
          </div>
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerUrl(address || "")} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ReplayMenuItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TopbarWalletProps {
  isConnected: boolean;
  address: string | null | undefined;
  displayAddress: string | null | undefined;
  connect: () => void;
  disconnect: () => void;
  copied: boolean;
  copyAddress: () => Promise<void>;
}

function TopbarWallet({
  isConnected,
  address,
  displayAddress,
  connect,
  disconnect,
  copied,
  copyAddress,
}: TopbarWalletProps) {
  const { data: creditsData, isLoading: creditsLoading } = useCredits();
  const credits = creditsData?.credits ?? 0;
  const creditsDisplay = creditsLoading ? "—" : new Intl.NumberFormat("en-US").format(credits);

  if (!isConnected) {
    return (
      <Button
        size="sm"
        variant="gradient"
        onClick={connect}
        data-testid="connect-wallet"
        className="h-9 rounded-full px-4 font-bold text-sm"
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-testid="wallet-connected"
          className="flex h-10 items-center gap-2.5 rounded-full border border-border bg-transparent px-3.5 font-medium text-base text-foreground transition-colors hover:bg-accent"
        >
          <AddressAvatar address={address ?? ""} size="size-6" iconSize="size-3.5" />
          <span>{displayAddress}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between">
            <Typography size="sm" weight="medium" className="text-foreground">
              {displayAddress}
            </Typography>
            <Typography size="xs" className="text-muted-foreground">
              {networkLabel}
            </Typography>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/profile/credits"
            data-testid="wallet-credits-row"
            className="flex w-full items-center justify-between"
          >
            <span className="text-sm">Credits</span>
            <span className="font-mono text-foreground text-sm tabular-nums">{creditsDisplay}</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? "Copied!" : "Copy address"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerUrl(address || "")} target="_blank" rel="noopener noreferrer">
            View on explorer
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <ReplayMenuItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={disconnect}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { AddressAvatar };
