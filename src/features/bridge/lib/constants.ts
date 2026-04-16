export const SUPPORTED_CHAINS = [
  { id: "stellar", name: "Stellar", symbol: "SRB", logo: "/chains/stellar.png", color: "text-blue-400" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "/chains/ethereum.png", color: "text-purple-400" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", logo: "/chains/arbitrum.png", color: "text-blue-300" },
  { id: "base", name: "Base", symbol: "BAS", logo: "/chains/base.png", color: "text-blue-500" },
  { id: "polygon", name: "Polygon", symbol: "POL", logo: "/chains/polygon.png", color: "text-purple-500" },
  { id: "solana", name: "Solana", symbol: "SOL", logo: "/chains/solana.png", color: "text-green-400" },
  { id: "bsc", name: "BNB Chain", symbol: "BSC", logo: "/chains/bsc.png", color: "text-yellow-400" },
  { id: "avalanche", name: "Avalanche", symbol: "AVA", logo: "/chains/avalanche.png", color: "text-red-400" },
  { id: "optimism", name: "Optimism", symbol: "OPT", logo: "/chains/optimism.png", color: "text-red-500" },
] as const;

export const TOKEN_LOGOS: Record<string, string> = {
  USDC: "/chains/usdc.png",
  USDT: "/chains/usdt.png",
};

export type ChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export function getChain(id: string) {
  return SUPPORTED_CHAINS.find((chain) => chain.id === id);
}
