"use client";

import { Layers } from "lucide-react";

export function NftPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
        <Layers className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-foreground">NFTs not available on Stellar</h3>
        <p className="max-w-sm text-muted-foreground text-sm">
          The Stellar Classic network does not have a native NFT standard. NFT support is coming in
          a future update.
        </p>
      </div>
    </div>
  );
}
