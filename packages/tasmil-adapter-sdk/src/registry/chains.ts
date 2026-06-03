/**
 * Supported chains for the cross-chain aggregator.
 *
 * NOTE: The `logo` and `icon` paths (e.g. "/chains/stellar.png") are relative
 * to the web root. Consumers MUST prepend their own asset CDN base URL before
 * rendering — no base URL resolution is built into the SDK.
 */

import type { ChainInfo } from "./types.js";

export const SUPPORTED_CHAINS: ChainInfo[] = [
  { id: "stellar",   name: "Stellar",   symbol: "SRB", logo: "/chains/stellar.png" },
  { id: "ethereum",  name: "Ethereum",  symbol: "ETH", logo: "/chains/ethereum.png" },
  { id: "arbitrum",  name: "Arbitrum",  symbol: "ARB", logo: "/chains/arbitrum.png" },
  { id: "base",      name: "Base",      symbol: "BAS", logo: "/chains/base.png" },
  { id: "polygon",   name: "Polygon",   symbol: "POL", logo: "/chains/polygon.png" },
  { id: "solana",    name: "Solana",    symbol: "SOL", logo: "/chains/solana.png" },
  { id: "bsc",       name: "BNB Chain", symbol: "BSC", logo: "/chains/bsc.png" },
  { id: "avalanche", name: "Avalanche", symbol: "AVA", logo: "/chains/avalanche.png" },
  { id: "optimism",  name: "Optimism",  symbol: "OPT", logo: "/chains/optimism.png" },
];
