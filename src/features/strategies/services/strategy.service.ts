import type {
  Strategy,
  StrategyListItem,
} from "../types";

/**
 * Mock data service for strategies
 * In production, this would fetch from an API
 */

// Mock strategy data based on the provided JSON
const mockStrategyData: Strategy = {
  id: "yield-katana-stablecoins",
  strategy_metadata: {
    title: "Yield - Katana - Stablecoins",
    status: "Active",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "14/11/2025",
    },
    current_apy: "65.86%",
    expiry_date: "Feb 13, 2026",
    tags: ["Stablecoins"],
  },
  execution_panel: {
    input_token: "vbUSDC",
    available_balance: 0,
    input_amount: 12,
    status_message: "Insufficient balance",
    network_details: {
      est_network_cost: "0.00000111 ETH",
      slippage_tolerance: "1%",
    },
    actions: ["Simulate", "Prepare Gas", "Zap"],
  },
  tabs: {
    overview: {
      disclaimer: "INFINIT is not holding custody over users' assets.",
      description: "Maximize Katana rewards through diversified Spectra LP stablecoin positions.",
      agents: ["Sushi", "Spectra"],
      assets_pools: ["LP-vbUSDC (Spectra)", "LP-vbUSDT (Spectra)"],
      rewards: ["KAT Rewards", "Spectra LP Yield"],
      risks: ["Depeg", "Underlying Protocol"],
      strategy_flow_summary: {
        total_steps: 4,
        actions: [
          { type: "Starting Token", count: 1 },
          { type: "Swap", count: 1 },
          { type: "Add Liquidity", count: 2 },
        ],
      },
    },
    strategy_prompt: {
      info: {
        chains: ["Katana"],
        assets_involved: ["vbUSDC", "vbUSDT", "SPT-PT/IBT"],
      },
      execution_steps: [
        {
          step: 1,
          chain: "Katana",
          protocol: "Default",
          action: "Start with vbUSDC",
        },
        {
          step: 2,
          chain: "Katana",
          protocol: "Sushiswap",
          action: "Swap 50% of vbUSDC to vbUSDT",
        },
        {
          step: 3,
          chain: "Katana",
          protocol: "Spectra",
          action: "Add liquidity from vbUSDC to LP-vbUSDC",
        },
        {
          step: 4,
          chain: "Katana",
          protocol: "Spectra",
          action: "Add liquidity from vbUSDT to LP-vbUSDT",
        },
      ],
      constants: {
        vbUSDC: "0x203A662b0BD271A6ed5a60EdFbd04bFce608FD36",
        vbUSDT: "0x2DCa96907fde857dd3D816880A0df407eeB2D2F2",
        "LP-vbUSDC": "0x5acee9417301c521e366653bccd656bdd153a0af",
        "LP-vbUSDT": "0xb669ef4992e5f8d8d204aff7423c75ba307df88f",
      },
    },
    my_activities: {
      status: "Empty",
      message: "You have no activities in this strategy",
    },
    all_activities: {
      recent_transactions: [
        { time: "30/12/2025 00:31:32", wallet: "0xe9ce...9943" },
        { time: "28/12/2025 09:57:25", wallet: "0xA644...903f" },
        { time: "27/12/2025 19:16:30", wallet: "0x2eAb...e604" },
        { time: "26/12/2025 18:02:16", wallet: "0x4E93...7200" },
        { time: "26/12/2025 17:47:12", wallet: "0x4E93...7200" },
        { time: "21/12/2025 03:52:37", wallet: "0x209b...53EA" },
        { time: "19/12/2025 20:48:06", wallet: "0x665F...Bd7e" },
        { time: "15/12/2025 20:43:33", wallet: "0x1F8e...6b9f" },
        { time: "09/12/2025 18:17:59", wallet: "0x93EA...F5e5" },
        { time: "05/12/2025 13:44:07", wallet: "0x2a1F...9415" },
      ],
      pagination: {
        current_page: 1,
        total_pages: 3,
      },
    },
  },
};

// Mock list of strategies
const mockStrategiesList: StrategyListItem[] = [
  {
    id: "yield-katana-stablecoins",
    title: "Yield - Katana - Stablecoins",
    status: "Active",
    current_apy: "65.86%",
    creator: {
      name: "INFINIT",
      handle: "@Infinit_Labs",
      created_at: "14/11/2025",
    },
    tags: ["Stablecoins"],
  },
  {
    id: "yield-ethereum-defi",
    title: "Yield - Ethereum - DeFi",
    status: "Active",
    current_apy: "42.15%",
    creator: {
      name: "DeFi Master",
      handle: "@defi_master",
      created_at: "10/11/2025",
    },
    tags: ["DeFi", "Ethereum"],
  },
  {
    id: "yield-arbitrum-lp",
    title: "Yield - Arbitrum - LP",
    status: "Active",
    current_apy: "38.92%",
    creator: {
      name: "LP Optimizer",
      handle: "@lp_optimizer",
      created_at: "05/11/2025",
    },
    tags: ["Liquidity", "Arbitrum"],
  },
];

/**
 * Fetch a single strategy by ID
 */
export async function getStrategy(strategyId: string): Promise<Strategy> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // In production, this would be: return apiClient.get(`/strategies/${strategyId}`)
  if (strategyId === "yield-katana-stablecoins") {
    return mockStrategyData;
  }

  // Return a modified version for other IDs
  return {
    ...mockStrategyData,
    id: strategyId,
    strategy_metadata: {
      ...mockStrategyData.strategy_metadata,
      title: `Strategy ${strategyId}`,
    },
  };
}

/**
 * Fetch list of all strategies
 */
export async function getStrategies(): Promise<StrategyListItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  // In production, this would be: return apiClient.get("/strategies")
  return mockStrategiesList;
}
