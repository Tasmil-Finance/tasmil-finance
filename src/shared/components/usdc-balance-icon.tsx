"use client";

import Image from "next/image";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";

/**
 * USDC Balance icon — placeholder after EVM removal.
 * Stellar balance fetching can be wired in later via backend API.
 */
export function USDCBalanceIcon() {
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
        <Typography className="text-xs">-- USDC</Typography>
      </TooltipContent>
    </Tooltip>
  );
}
