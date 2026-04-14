"use client";

import { Check, Copy, ExternalLink, LogOut, User, Wallet } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Typography } from "@/shared/ui/typography";

const AddressAvatar = ({ address, size = "size-12" }: { address: string; size?: string }) => {
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
        gradientClass,
      )}
    >
      <User className="size-5" />
    </div>
  );
};

const networkLabel =
  (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] as string) === "PUBLIC" ? "Mainnet" : "Testnet";

function explorerUrl(address: string): string {
  const base =
    (process.env["NEXT_PUBLIC_STELLAR_NETWORK"] as string) === "PUBLIC"
      ? "https://stellar.expert/explorer/public/account"
      : "https://stellar.expert/explorer/testnet/account";
  return `${base}/${address}`;
}

interface ConnectWalletButtonProps {
  compact?: boolean;
}

export function ConnectWalletButton({ compact }: ConnectWalletButtonProps) {
  const { isConnected, address, displayAddress, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected) {
    return compact ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button className="h-10 w-10 p-0" onClick={connect} variant="gradient">
            <Wallet className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <Typography size="xs">Connect Wallet</Typography>
        </TooltipContent>
      </Tooltip>
    ) : (
      <Button className="w-full" onClick={connect} variant="gradient">
        Connect Wallet
      </Button>
    );
  }

  // ── Connected: compact (collapsed sidebar) ──────────────────────────
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
            variant="ghost"
          >
            <AddressAvatar address={address || ""} size="size-8" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="end" className="w-56">
          <div className="px-3 py-2.5">
            <Typography size="xs" className="text-muted-foreground">
              Connected to {networkLabel}
            </Typography>
            <Typography size="sm" weight="medium" className="mt-0.5 text-foreground">
              {displayAddress}
            </Typography>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress}>
            {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={explorerUrl(address || "")} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
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

  // ── Connected: expanded sidebar ─────────────────────────────────────
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="flex h-auto w-full items-center justify-start gap-3 rounded-xl bg-zinc-800/50 px-3 py-2.5 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
          variant="ghost"
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
      <DropdownMenuContent side="top" align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied!" : "Copy Address"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={explorerUrl(address || "")} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </a>
        </DropdownMenuItem>
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

export { AddressAvatar };
