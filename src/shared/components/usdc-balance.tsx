"use client";

import Image from "next/image";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";

/**
 * USDC Balance display — placeholder after EVM removal.
 * Stellar balance fetching can be wired in later via backend API.
 */
export function USDCBalance() {
  return (
    <Button
      className="flex h-auto items-center justify-start gap-2 rounded-xl bg-zinc-800/50 p-3 backdrop-blur-sm transition-all hover:bg-zinc-800/70"
      variant="ghost"
    >
      <Image
        src="/token/usdc.png"
        alt="USDC"
        width={20}
        height={20}
        className="rounded-full"
      />
      <Typography className="font-medium text-sm text-white">-- USDC</Typography>
    </Button>
  );
}
