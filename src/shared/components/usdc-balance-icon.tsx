"use client";

import { useAccount, useBalance, useChainId } from "wagmi";
import { formatUnits } from "viem";
import Image from "next/image";
import { isCorrectChain } from "@/shared/config/wagmi";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Button } from "@/shared/ui/button-v2";
import CountUp from "@/shared/ui/count-up";

// USDC contract address on Arbitrum Fork
const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

export function USDCBalanceIcon() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isLocalChain = process.env["NEXT_PUBLIC_USE_LOCAL_CHAIN"] === "true";
  
  // Only show on local chain and when connected to correct network
  const shouldShow = isLocalChain && isConnected && address && isCorrectChain(chainId);

  const { data: balance } = useBalance({
    address: address,
    token: USDC_ADDRESS as `0x${string}`,
    query: {
      enabled: shouldShow,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  if (!shouldShow) {
    return null;
  }

  const formattedBalance = balance 
    ? parseFloat(formatUnits(balance.value, balance.decimals))
    : 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800/50 p-0 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
          variant="ghost"
        >
          <Image
            src="/token/usdc.png"
            alt="USDC"
            width={24}
            height={24}
            className="rounded-full"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <CountUp
          abbreviate={false}
          className="text-xs"
          decimals={2}
          suffix=" USDC"
          value={formattedBalance}
        />
      </TooltipContent>
    </Tooltip>
  );
}