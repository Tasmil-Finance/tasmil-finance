// ⚙️ Agent configurations - centralized agent definitions
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
  // Staking Agent - U2U Network staking operations
  staking_agent: {
    id: 'staking_agent',
    name: 'Staking Agent',
    description: 'Stake tokens and manage validators on U2U Network',
    icon: '/agents/staking-agent.svg',
    supportedChains: ['U2U Solaris'],
    suggestions: [
      "What's my U2U balance?",
      'Show me all validators',
      'Stake 100 U2U to validator 1',
      'Check my pending rewards',
      "What's the current staking APR?",
      'Help me understand U2U staking',
      'Show network staking statistics',
      'I want to claim my rewards from validator 1',
      'Lock 200 U2U for 30 days on validator 1',
      'What are the risks of staking?',
      'Undelegate 50 U2U from validator 2',
      'Show my staking history',
    ],
    capabilities: [
      'build_transaction',
      'query_contract',
      'submit_transaction',
      'get_supported_chains',
    ],
  },

  // Vault Agent - AI Vault Manager for Yield Vaults
  vault_agent: {
    id: 'vault_agent',
    name: 'Vault Agent',
    description: 'AI Vault Manager for monitoring and optimizing yield vaults',
    icon: '/agents/vault-agent.svg',
    supportedChains: ['Ethereum', 'Arbitrum', 'Optimism'],
    suggestions: [
      'Show me current vault APYs',
      'Monitor Morpho vault performance',
      'Compare Pendle vs GMX yields',
      'Rebalance my portfolio',
      'Harvest rewards from all vaults',
      "What's the best vault right now?",
      'Show vault TVL statistics',
      'Compound my vault rewards',
      'Analyze vault risk levels',
      'Get vault performance history',
      'Suggest optimal vault allocation',
      'Show me high-yield vaults',
    ],
    capabilities: ['yield_monitoring', 'rebalancing', 'harvesting'],
  },

  // Research Agent - Crypto market research and analysis
  research_agent: {
    id: 'research_agent',
    name: 'Research Agent',
    description: 'Analyze crypto markets, prices, and trends',
    icon: '/agents/research-agent.svg',
    supportedChains: [],
    suggestions: [
      "What's the current price of Bitcoin?",
      "Analyze Ethereum's market trends",
      'Compare BTC vs ETH',
      'Show trending cryptocurrencies',
      'What are the top 10 cryptocurrencies by market cap?',
      'Give me an investment score for Bitcoin',
      "What's the latest crypto news?",
      'Show me the global crypto market statistics',
      'What are the best performing coins this week?',
      "What's the market sentiment right now?",
      'Get DeFi TVL data',
      'Search for Solana information',
    ],
    capabilities: ['price_tracking', 'market_analysis', 'news_aggregation'],
  },

  // Yield Agent - DeFi yield farming opportunities
  yield_agent: {
    id: 'yield_agent',
    name: 'Yield Agent',
    description: 'Find and compare DeFi yield opportunities',
    icon: '/agents/yield-agent.svg',
    supportedChains: [
      'Ethereum',
      'Arbitrum',
      'BSC',
      'Polygon',
      'Avalanche',
      'Optimism',
    ],
    suggestions: [
      'What are the best yields on Ethereum?',
      'Show stablecoin yields',
      'Find high APY pools',
      'Compare yields across chains',
      'Show me yield pools with over 20% APY',
      'What are the best stablecoin yields?',
      'Find USDC yield opportunities',
      'Show me Aave yield pools',
      'Give me a yield market overview',
      'Show me high TVL yield pools',
      'Search for ETH yield pools',
      'Compare Curve vs Convex yields',
    ],
    capabilities: ['yield_search', 'apy_comparison', 'pool_analysis'],
  },

  // Bridge Agent - Cross-chain token bridging
  bridge_agent: {
    id: 'bridge_agent',
    name: 'Bridge Agent',
    description: 'Bridge tokens between U2U and other chains',
    icon: '/agents/bridge-agent.svg',
    supportedChains: [
      'Ethereum',
      'Arbitrum',
      'Optimism',
      'Polygon',
      'BSC',
      'Avalanche',
      'Base',
      'Linea',
      'U2U Solaris',
    ],
    suggestions: [
      'Show available bridge routes',
      'Bridge 100 USDT to Ethereum',
      'What are the bridge fees?',
      'Supported chains for bridging',
      'How do I bridge tokens to U2U?',
      'Bridge USDC from BSC to U2U',
      "What's the fee to bridge USDT to Ethereum?",
      'How long does bridging take?',
      'Is bridging safe?',
      'Help me understand cross-chain bridging',
      'Get a quote for bridging 100 USDT',
      'What tokens can I bridge?',
    ],
    capabilities: [
      'cross_chain_transfer',
      'quote_generation',
      'multi_chain_support',
    ],
  },
} as const;

export const DEFAULT_AGENT: AgentConfig = {
  id: 'default',
  name: 'DeFi Assistant',
  description: 'General DeFi assistant',
  suggestions: [
    'What can you help me with?',
    'Show me yield opportunities',
    'Check crypto prices',
    'Help me stake tokens',
    'Tell me about cryptocurrency market trends',
    'How do I get started with crypto investing?',
    "What's the difference between Bitcoin and Ethereum?",
    'What is DeFi and how does it work?',
  ],
  capabilities: [],
};

export function getAgentConfig(agentId: string): AgentConfig {
  // Normalize agent ID (handle both staking-agent and staking_agent formats)
  const normalizedId = agentId.replace(/-/g, '_');
  return AGENTS[normalizedId] ?? DEFAULT_AGENT;
}

export function getAgentSuggestions(agentId: string, count = 4): string[] {
  const config = getAgentConfig(agentId);
  // Shuffle and return random suggestions
  const shuffled = [...config.suggestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
