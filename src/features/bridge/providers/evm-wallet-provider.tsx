"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
// Importing reown-config triggers createAppKit() at module level (client-only)
import { wagmiConfig } from "@/features/bridge/lib/reown-config";

interface Props {
  children: ReactNode;
}

/**
 * Wraps the bridge page with Wagmi + Reown AppKit context.
 * QueryClient is provided by the root AppProvider — no duplication needed.
 */
export function EvmWalletProvider({ children }: Props) {
  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
}
