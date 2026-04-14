export const SUPPORTED_CHAINS = [
  { id: "stellar", name: "Stellar", symbol: "SRB", icon: "🌟", color: "text-blue-400" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "⟠", color: "text-purple-400" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", icon: "🔵", color: "text-blue-300" },
  { id: "base", name: "Base", symbol: "BAS", icon: "🔷", color: "text-blue-500" },
  { id: "polygon", name: "Polygon", symbol: "POL", icon: "🟣", color: "text-purple-500" },
  { id: "solana", name: "Solana", symbol: "SOL", icon: "◎", color: "text-green-400" },
  { id: "bsc", name: "BNB Chain", symbol: "BSC", icon: "🟡", color: "text-yellow-400" },
  { id: "avalanche", name: "Avalanche", symbol: "AVA", icon: "🔺", color: "text-red-400" },
  { id: "optimism", name: "Optimism", symbol: "OPT", icon: "🔴", color: "text-red-500" },
] as const;

export type ChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export function getChain(id: string) {
  return SUPPORTED_CHAINS.find((chain) => chain.id === id);
}
