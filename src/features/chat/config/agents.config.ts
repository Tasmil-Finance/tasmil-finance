// Agent configurations - centralized agent definitions
// Agent IDs must match backend LANGSERVE_GRAPHS keys (e.g., staking_agent, vault_agent)

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  suggestions: string[];
  capabilities?: string[];
  supportedChains?: string[];
}

export const AGENTS: Record<string, AgentConfig> = {
  // Supervisor - Main orchestrator for all agents
  supervisor: {
    id: "supervisor",
    name: "Tasmil Assistant",
    description: "AI DeFi assistant for the Stellar ecosystem — orchestrates all agents",
    icon: "/agents/supervisor-agent.svg",
    supportedChains: ["Stellar"],
    suggestions: [
      "I have USDC on ETH and I wanna supply on Backstop",
      "Swap 100 XLM to USDC and stake it",
      "What are the best yield opportunities on Stellar?",
      "Check my Stellar account balances",
      "Bridge USDC from Ethereum to Stellar",
      "Compare lending rates on Blend vs Templar",
      "What's the price of XLM?",
      "Find the best APY for USDC on Stellar",
      "Show me my portfolio overview",
      "Help me get started with Stellar DeFi",
      "Analyze the Stellar DeFi ecosystem",
      "Deposit into the best yield vault",
    ],
    capabilities: ["swap", "staking", "bridging", "yield_farming", "research", "portfolio_management"],
  },

  // Info Agent - Quick factual queries
  info_agent: {
    id: "info_agent",
    name: "Info Agent",
    description: "Quick answers for prices, balances, and account details",
    icon: "/agents/info-agent.svg",
    supportedChains: ["Stellar"],
    suggestions: [
      "What's the price of XLM?",
      "Check my Stellar account balance",
      "Show my trustlines",
      "What's the USDC price?",
      "How much XLM do I have?",
      "Show my account details",
      "What tokens are in my wallet?",
      "Check if my account is ready for transactions",
      "Show my account reserves",
      "What's the current XLM/USDC rate?",
      "List my token balances",
      "Show my transaction history",
    ],
    capabilities: ["get_price", "get_balance", "get_account_info", "get_trustlines"],
  },

  // Swap Agent - Token swaps on Stellar DEXs
  swap_agent: {
    id: "swap_agent",
    name: "Swap Agent",
    description: "Swap tokens on Stellar DEXs with best price routing",
    icon: "/agents/swap-agent.svg",
    supportedChains: ["Stellar"],
    suggestions: [
      "Swap 100 XLM to USDC",
      "Compare swap rates for XLM to USDC",
      "Swap USDC to XLM on Soroswap",
      "Find the best swap rate for 50 USDC",
      "Swap 200 XLM to EURC",
      "What's the best DEX for swapping XLM?",
      "Show me available trading pairs",
      "Swap all my XLM to USDC",
      "Compare Soroswap vs Phoenix rates",
      "Get a swap quote for 1000 XLM to USDC",
      "Swap with minimum slippage",
      "Show me SDEX trading pairs",
    ],
    capabilities: ["discover_swap", "execute_swap", "compare_rates"],
  },

  // Staking Agent - Staking and lending on Stellar
  staking_agent: {
    id: "staking_agent",
    name: "Staking Agent",
    description: "Supply, borrow, and stake on Blend, Templar, and Phoenix",
    icon: "/agents/staking-agent.svg",
    supportedChains: ["Stellar"],
    suggestions: [
      "Supply 100 USDC on Blend",
      "What's the lending rate for USDC?",
      "Borrow XLM against my USDC collateral",
      "Show my lending positions",
      "Compare Blend vs Templar rates",
      "Stake LP tokens on Phoenix",
      "Claim my staking rewards",
      "What can I supply on Blend?",
      "Show backstop pool opportunities",
      "Repay my Blend loan",
      "What's my collateral ratio?",
      "Supply USDC to Templar lending pool",
    ],
    capabilities: ["supply", "borrow", "repay", "stake_lp", "claim_rewards"],
  },

  // Vault Agent - AI Vault Manager for Yield Vaults
  vault_agent: {
    id: "vault_agent",
    name: "Vault Agent",
    description: "AI Vault Manager for monitoring and optimizing yield vaults",
    icon: "/agents/vault-agent.svg",
    supportedChains: ["Stellar"],
    suggestions: [
      "Show me current vault APYs",
      "Monitor vault performance",
      "Compare yield strategies",
      "Rebalance my portfolio",
      "Harvest rewards from all vaults",
      "What's the best vault right now?",
      "Show vault TVL statistics",
      "Compound my vault rewards",
      "Analyze vault risk levels",
      "Get vault performance history",
      "Suggest optimal vault allocation",
      "Show me high-yield vaults",
    ],
    capabilities: ["yield_monitoring", "rebalancing", "harvesting"],
  },

  // Research Agent - Crypto market research and analysis
  research_agent: {
    id: "research_agent",
    name: "Research Agent",
    description: "Analyze crypto markets, prices, and trends",
    icon: "/agents/research-agent.svg",
    supportedChains: [],
    suggestions: [
      "What's the current price of Bitcoin?",
      "Analyze Ethereum's market trends",
      "Compare BTC vs ETH",
      "Show trending cryptocurrencies",
      "What are the top 10 cryptocurrencies by market cap?",
      "Give me an investment score for Bitcoin",
      "What's the latest crypto news?",
      "Show me the global crypto market statistics",
      "What are the best performing coins this week?",
      "What's the market sentiment right now?",
      "Get DeFi TVL data",
      "Search for Stellar XLM information",
    ],
    capabilities: ["price_tracking", "market_analysis", "news_aggregation"],
  },

  // Yield Agent - DeFi yield farming opportunities
  yield_agent: {
    id: "yield_agent",
    name: "Yield Agent",
    description: "Find and compare DeFi yield opportunities",
    icon: "/agents/yield-agent.svg",
    supportedChains: ["Stellar", "Ethereum", "Arbitrum", "BSC", "Polygon", "Avalanche", "Optimism"],
    suggestions: [
      "What are the best yields on Stellar?",
      "Show stablecoin yields",
      "Find high APY pools",
      "Compare yields across chains",
      "Show me yield pools with over 20% APY",
      "What are the best stablecoin yields?",
      "Find USDC yield opportunities",
      "Show me Stellar AMM pools",
      "Give me a yield market overview",
      "Show me high TVL yield pools",
      "Search for XLM yield pools",
      "Compare Stellar vs Ethereum yields",
    ],
    capabilities: ["yield_search", "apy_comparison", "pool_analysis"],
  },

  // Bridge Agent - Cross-chain token bridging (Allbridge)
  bridge_agent: {
    id: "bridge_agent",
    name: "Bridge Agent",
    description: "Bridge tokens between Stellar and other chains via Allbridge",
    icon: "/agents/bridge-agent.svg",
    supportedChains: [
      "Stellar",
      "Ethereum",
      "Arbitrum",
      "Optimism",
      "Polygon",
      "BSC",
      "Avalanche",
      "Base",
    ],
    suggestions: [
      "Show available bridge routes",
      "Bridge 100 USDC to Ethereum",
      "What are the bridge fees?",
      "Supported chains for bridging",
      "How do I bridge tokens from Stellar?",
      "Bridge USDC from BSC to Stellar",
      "What's the fee to bridge USDT to Ethereum?",
      "How long does bridging take?",
      "Is bridging safe?",
      "Help me understand cross-chain bridging",
      "Get a quote for bridging 100 USDC",
      "What tokens can I bridge via Allbridge?",
    ],
    capabilities: ["cross_chain_transfer", "quote_generation", "multi_chain_support"],
  },
} as const;

export const DEFAULT_AGENT: AgentConfig = {
  id: "default",
  name: "DeFi Assistant",
  description: "General DeFi assistant",
  suggestions: [
    "What can you help me with?",
    "Show me yield opportunities",
    "Check crypto prices",
    "Help me bridge tokens",
    "Tell me about cryptocurrency market trends",
    "How do I get started with crypto investing?",
    "What's the difference between Bitcoin and Ethereum?",
    "What is DeFi and how does it work?",
  ],
  capabilities: [],
};

export function getAgentConfig(agentId: string): AgentConfig {
  const normalizedId = agentId.replace(/-/g, "_");
  return AGENTS[normalizedId] ?? DEFAULT_AGENT;
}

export function getAgentSuggestions(agentId: string, count = 4): string[] {
  const config = getAgentConfig(agentId);
  const shuffled = [...config.suggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getAllAgentIds(): string[] {
  return Object.keys(AGENTS);
}

export function getAgent(agentId: string): AgentConfig | null {
  const normalizedId = agentId.replace(/-/g, "_");
  return AGENTS[normalizedId] ?? null;
}
