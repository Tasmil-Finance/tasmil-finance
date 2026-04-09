"use client";

import { User, Wallet } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Typography } from "@/shared/ui/typography";

// Component to generate abstract avatar from address
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
        gradientClass
      )}
    >
      <User className="size-5" />
    </div>
  );
};

interface ConnectWalletButtonProps {
  compact?: boolean;
}

export function ConnectWalletButton({ compact }: ConnectWalletButtonProps) {
  const { isConnected, address, displayAddress, connect, disconnect } = useWallet();

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

  return compact ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
          onClick={disconnect}
          variant="ghost"
        >
          <AddressAvatar address={address || ""} size="size-8" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <div className="space-y-1">
          <Typography size="xs">{displayAddress}</Typography>
          <Typography size="xs" className="text-muted-foreground">
            Click to disconnect
          </Typography>
        </div>
      </TooltipContent>
    </Tooltip>
  ) : (
    <Button
      className="flex h-auto w-full items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
      onClick={disconnect}
      variant="ghost"
    >
      <AddressAvatar address={address || ""} size="size-8" />
      <div className="flex flex-1 items-center justify-between">
        <Typography className="text-white" size="sm" weight="medium">
          {displayAddress}
        </Typography>
        <Typography className="text-gray-400" size="xs">
          Disconnect
        </Typography>
      </div>
    </Button>
  );
}

export { AddressAvatar };
