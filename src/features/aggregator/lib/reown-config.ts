"use client";

import type { AppKitNetwork } from "@reown/appkit/networks";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  mainnet,
  optimism,
  polygon,
  solana,
  solanaTestnet,
} from "@reown/appkit/networks";
/**
 * Reown AppKit + Wagmi + Solana config for EVM & Solana wallet connection.
 *
 * WHY the typeof window guards:
 *   "use client" does NOT prevent module-level code from running on the server.
 *   Next.js evaluates Client Component modules during SSR module-graph analysis.
 *   SolanaAdapter (Solana web3.js) calls `randombytes` which is browser-only.
 *   createAppKit uses browser EventEmitter APIs → "this.on is not a function" in Node.
 *   Guard everything that touches browser-only APIs.
 */
import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { Config } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet";

export const EVM_NETWORKS: [AppKitNetwork, ...AppKitNetwork[]] = [
  mainnet,
  arbitrum,
  base,
  polygon,
  optimism,
  bsc,
  avalanche,
];

export const BRIDGE_NETWORKS: [AppKitNetwork, ...AppKitNetwork[]] = [
  ...EVM_NETWORKS,
  isTestnet ? solanaTestnet : solana,
];

// ── WagmiAdapter: ssr:true makes it safe to instantiate on the server ─────────
export const wagmiAdapter = new WagmiAdapter({
  networks: EVM_NETWORKS,
  projectId,
  ssr: true,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig as Config;

// ── SolanaAdapter + AppKit: browser-only (Solana web3.js uses randombytes) ────
if (typeof window !== "undefined") {
  const solanaAdapter = new SolanaAdapter();

  createAppKit({
    adapters: [wagmiAdapter, solanaAdapter],
    networks: BRIDGE_NETWORKS,
    projectId,
    metadata: {
      name: "Tasmil Finance Bridge",
      description: "Cross-chain bridge powered by Allbridge",
      url: window.location.origin,
      icons: ["/favicon.ico"],
    },
    features: {
      analytics: false,
      email: false,
      socials: false,
    },
    themeMode: "dark",
    allowUnsupportedChain: true,
  });
}
