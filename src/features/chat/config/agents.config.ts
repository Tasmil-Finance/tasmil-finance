// Agent configurations - centralized agent definitions
// Agent IDs must match backend LANGSERVE_GRAPHS keys (e.g., blend_agent, soroswap_agent)

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  suggestions: string[];
  capabilities?: string[];
  supportedChains?: string[];
  /** Whether this agent works on Stellar testnet. Agents without testnet support are hidden in testnet mode. */
  testnetAvailable?: boolean;
}

export const AGENTS: Record<string, AgentConfig> = {
  supervisor: {
    id: "supervisor",
    name: "Tasmil Assistant",
    description: "AI DeFi assistant for the Stellar ecosystem. Orchestrates all specialized agents. Routes your requests to the best agent automatically",
    icon: "/agents/supervisor-agent.png",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
    suggestions: [
      // ── Yield & Earn (vague → triggers clarify flow) ──────────
      "Earn yield on my USDC",
      "Where should I put 500 USDC safely?",
      "Find the best APY for XLM right now",
      "Put 1000 USDC safe, max 40% per protocol",
      "Compare yield across Blend, Aquarius, and DeFindex",

      // ── Specific actions (skip clarify → straight to plan) ────
      "Supply 200 USDC to Blend",
      "Deposit 100 XLM into a DeFindex vault",
      "Swap 500 XLM to USDC on best route",
      "Add liquidity to XLM/USDC on Aquarius",
      "Deposit to Blend backstop pool",

      // ── Multi-step & Cross-chain ──────────────────────────────
      "Bridge 100 USDC from Ethereum and supply to Blend",
      "Swap 200 XLM to USDC then earn yield",
      "Bridge USDC from Arbitrum to Stellar",

      // ── Portfolio & Info ───────────────────────────────────────
      "Show my positions across all protocols",
      "Check my Blend lending position",
      "What's the current XLM price?",
      "Show my wallet balances",
      "Compare Blend vs Templar lending rates for USDC",

      // ── Research & Analysis ────────────────────────────────────
      "Analyze the Stellar DeFi ecosystem",
      "What are the trending tokens today?",
      "Give me a market overview",
    ],
    capabilities: [
      "swap",
      "staking",
      "bridging",
      "yield_farming",
      "research",
      "portfolio_management",
    ],
  },

  blend_agent: {
    id: "blend_agent",
    name: "Blend Agent",
    description:
      "Blend specialist for lending and credit loops on Stellar. Supply collateral, borrow against positions, manage backstop participation, and monitor reserve-level risk metrics before every transaction.",
    icon: "/agents/blend-agent.svg",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
    suggestions: [
      // ── Beginner-friendly (new to DeFi) ──────────────────────
      "I have $5, how can I start earning?",
      "How can I make money with my USDC?",
      "What is Blend and how does it work?",
      "Is it safe to lend my crypto here?",
      "How much can I earn on $100?",

      // ── Easy actions ─────────────────────────────────────────
      "Start earning with my USDC",
      "Put my XLM to work",
      "Show me the best rates right now",
      "What's the current APY?",

      // ── Intermediate ─────────────────────────────────────────
      "Supply 100 USDC to Blend",
      "Show my Blend positions",
      "Claim my BLND rewards",
      "Borrow XLM against my collateral",

      // ── Advanced ─────────────────────────────────────────────
      "Deposit to backstop pool",
      "Toggle my USDC as collateral",
      "Queue backstop withdrawal",
      "Repay my Blend loan",
    ],
    capabilities: ["supply", "borrow", "repay", "backstop", "claim_emissions"],
  },

  soroswap_agent: {
    id: "soroswap_agent",
    name: "Soroswap Agent",
    description:
      "Soroswap execution agent for swap routing and LP management. Compares Soroswap and SDEX paths, highlights slippage and pool depth, then builds transactions for the route you approve.",
    icon: "/agents/soroswap-agent.svg",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
    suggestions: [
      "Swap 100 XLM to USDC",
      "Get a quote for USDC to XLM",
      "Add liquidity to XLM/USDC pool",
      "Show my LP positions on Soroswap",
      "What pairs are available?",
      "Check SDEX orderbook for XLM/USDC",
      "Swap via SDEX path payment",
      "Remove my liquidity from a pool",
      "What's the XLM price?",
      "Show Soroswap pool TVL",
      "Find SDEX swap paths",
      "Swap with low slippage",
    ],
    capabilities: ["swap", "add_liquidity", "remove_liquidity", "sdex_swap"],
  },

  phoenix_agent: {
    id: "phoenix_agent",
    name: "Phoenix Agent",
    description:
      "Phoenix-focused trading and LP staking assistant. Simulates swaps, manages liquidity positions, and handles bond/unbond reward flows with clear risk and fee context.",
    icon: "/agents/phoenix-agent.svg",
    supportedChains: ["Stellar"],
    testnetAvailable: false,
    suggestions: [
      "Swap XLM to USDC on Phoenix",
      "Show Phoenix pool list",
      "Stake my LP tokens on Phoenix",
      "Claim my Phoenix staking rewards",
      "Provide liquidity to XLM/USDC pool",
      "What's my Phoenix portfolio?",
      "Simulate a swap on Phoenix",
      "Unstake my LP tokens",
      "Show pool reserves",
      "Withdraw my Phoenix liquidity",
      "What's the staking APY?",
      "Query my stake info",
    ],
    capabilities: ["swap", "provide_liquidity", "stake", "claim_rewards"],
  },

  aquarius_agent: {
    id: "aquarius_agent",
    name: "Aquarius Agent",
    description:
      "Aquarius specialist for AMM liquidity, swap routing, and AQUA incentive flows. Tracks pool quality, reward eligibility, and lock mechanics for ICE-oriented strategies.",
    icon: "/agents/aquarius-agent.svg",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
    suggestions: [
      "List Aquarius pools",
      "Swap via Aquarius routing",
      "Add liquidity to an Aquarius pool",
      "Claim my AQUA rewards",
      "Lock AQUA tokens for ICE",
      "Show my LP position",
      "What's the best Aquarius pool?",
      "Withdraw my Aquarius liquidity",
      "How does AQUA/ICE locking work?",
      "Show pool volume and TVL",
      "What's the ICE multiplier for 1 year?",
      "Track my liquidity position",
    ],
    capabilities: ["swap", "add_liquidity", "lock_aqua", "claim_rewards"],
  },

  defindex_agent: {
    id: "defindex_agent",
    name: "DeFindex Agent",
    description:
      "DeFindex vault manager for passive yield strategies. Reviews vault composition and share mechanics, then executes deposit and withdrawal actions with strategy-aware guidance.",
    icon: "/agents/defindex-agent.svg",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
    suggestions: [
      "Show available vaults",
      "Deposit 100 USDC into a vault",
      "What's my vault share balance?",
      "Withdraw from vault",
      "Show vault strategies",
      "What's the vault APY?",
      "List DeFindex vaults by APY",
      "How do DeFindex vaults work?",
      "Show vault TVL",
      "Compare vault performance",
      "Auto-invest my deposit",
      "Check vault status",
    ],
    capabilities: ["vault_deposit", "vault_withdraw", "vault_info"],
  },

  templar_agent: {
    id: "templar_agent",
    name: "Templar Agent",
    description:
      "Templar specialist for cross-chain lending and swap intents. Monitors borrow health, pending interest, and route status across bridge-connected markets before execution.",
    icon: "/agents/templar-agent.svg",
    supportedChains: ["Stellar", "Ethereum", "Bitcoin", "NEAR", "Solana"],
    testnetAvailable: false,
    suggestions: [
      "Show Templar lending markets",
      "Supply XLM to Templar",
      "What's my borrow health?",
      "Get a Templar swap quote",
      "Borrow USDC on Templar",
      "Check pending yield",
      "What tokens can I swap on Templar?",
      "Check pending interest",
      "Show my Templar position",
      "Cross-chain swap XLM to ETH",
      "What's the Templar borrow APR?",
      "Check swap status",
    ],
    capabilities: ["supply", "borrow", "cross_chain_swap", "lending"],
  },

  allbridge_agent: {
    id: "allbridge_agent",
    name: "Allbridge Agent",
    description:
      "Allbridge-only bridge agent for Stellar cross-chain transfers with route, fee, and ETA visibility before transaction build.",
    icon: "/agents/allbridge-agent.svg",
    testnetAvailable: false,
    supportedChains: [
      "Stellar",
      "Ethereum",
      "BSC",
      "Polygon",
      "Avalanche",
      "Arbitrum",
      "Optimism",
      "Base",
      "Solana",
    ],
    suggestions: [
      "Bridge USDC from Stellar to Ethereum via Allbridge",
      "Get Allbridge quote for USDC Stellar to Polygon",
      "Show Allbridge routes from Stellar to Arbitrum",
      "Build Allbridge transfer transaction",
      "Compare Allbridge fee and ETA",
      "Bridge USDT from BSC to Stellar via Allbridge",
      "Bridge from Stellar to Solana via Allbridge",
      "Show supported Allbridge assets",
    ],
    capabilities: ["bridge_quote", "bridge_build_transaction", "allbridge"],
  },

  sdex_agent: {
    id: "sdex_agent",
    name: "SDEX Agent",
    description:
      "Stellar Classic DEX specialist for orderbook path discovery and path-payment swap transaction building.",
    icon: "/agents/sdex-agent.svg",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
    suggestions: [
      "Find SDEX paths from XLM to USDC",
      "Show SDEX orderbook for XLM/USDC",
      "Build EXACT_SEND SDEX swap transaction",
      "Build EXACT_RECEIVE SDEX swap transaction",
      "Swap on SDEX with 1% slippage",
      "Check best SDEX path for USDC to XLM",
      "Inspect SDEX liquidity depth",
      "Execute Stellar path payment swap",
    ],
    capabilities: ["sdex_paths", "sdex_orderbook", "sdex_swap"],
  },

  info_agent: {
    id: "info_agent",
    name: "Info Agent",
    description:
      "Fast read-only account intelligence for Stellar wallets. Pulls balances, trustlines, reserve status, and transaction history to support safer execution decisions.",
    icon: "/agents/info-agent.png",
    supportedChains: ["Stellar"],
    testnetAvailable: true,
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

  research_agent: {
    id: "research_agent",
    name: "Research Agent",
    description:
      "Market research copilot for narrative and trend analysis. Synthesizes pricing, volatility, and ecosystem developments into concise strategy-level insights.",
    icon: "/agents/research-agent-v6.png",
    supportedChains: [],
    testnetAvailable: true,
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

  yield_agent: {
    id: "yield_agent",
    name: "Yield Agent",
    description:
      "Yield discovery engine that compares APY, TVL, and risk across Stellar DeFi protocols. Surfaces ranked opportunities and hands execution to the right protocol agent.",
    icon: "/agents/yield-agent-v6.png",
    supportedChains: ["Stellar", "Ethereum", "Arbitrum", "BSC", "Polygon", "Avalanche", "Optimism"],
    testnetAvailable: true,
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

  bridge_agent: {
    id: "bridge_agent",
    name: "Bridge Agent",
    description:
      "Cross-chain bridge planner for moving assets into and out of Stellar. Compares routes across providers like Allbridge and NEAR Intents with fee, ETA, and execution trade-offs.",
    icon: "/agents/bridge-agent-v6.png",
    testnetAvailable: false,
    supportedChains: [
      "Stellar",
      "Ethereum",
      "Arbitrum",
      "Optimism",
      "Polygon",
      "BSC",
      "Avalanche",
      "Base",
      "Solana",
    ],
    suggestions: [
      "Show available bridge routes",
      "Bridge 100 USDC to Ethereum",
      "Compare bridge fees Allbridge vs NEAR Intents",
      "Bridge USDC from BSC to Stellar",
      "What chains are supported?",
      "Get a bridge quote for USDC",
      "How long does bridging take?",
      "Bridge from Stellar to Polygon",
      "What's the cheapest bridge route?",
      "Bridge USDT to Ethereum",
      "Get a NEAR Intents quote",
      "Build bridge transaction",
    ],
    capabilities: ["bridge_quote", "bridge_execute", "route_discovery"],
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
