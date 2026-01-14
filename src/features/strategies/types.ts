export interface StrategyCreator {
  name: string;
  handle: string;
  created_at: string;
}

export interface StrategyMetadata {
  title: string;
  status: "Active" | "Inactive" | "Paused";
  creator: StrategyCreator;
  current_apy: string;
  expiry_date: string;
  tags: string[];
}

export interface NetworkDetails {
  est_network_cost: string;
  slippage_tolerance: string;
}

export interface ExecutionPanel {
  input_token: string;
  available_balance: number;
  input_amount: number;
  status_message: string;
  network_details: NetworkDetails;
  actions: string[];
}

export interface StrategyFlowSummary {
  total_steps: number;
  actions: Array<{
    type: string;
    count: number;
  }>;
}

export interface StrategyOverview {
  disclaimer: string;
  description: string;
  agents: string[];
  assets_pools: string[];
  rewards: string[];
  risks: string[];
  strategy_flow_summary: StrategyFlowSummary;
}

export interface ExecutionStep {
  step: number;
  chain: string;
  protocol: string;
  action: string;
}

export interface StrategyPromptInfo {
  chains: string[];
  assets_involved: string[];
}

export interface StrategyPrompt {
  info: StrategyPromptInfo;
  execution_steps: ExecutionStep[];
  constants: Record<string, string>;
}

export interface ActivityTransaction {
  time: string;
  wallet: string;
}

export interface AllActivities {
  recent_transactions: ActivityTransaction[];
  pagination: {
    current_page: number;
    total_pages: number;
  };
}

export interface MyActivities {
  status: "Empty" | "Loading" | "Loaded";
  message: string;
}

export interface StrategyTabs {
  overview: StrategyOverview;
  strategy_prompt: StrategyPrompt;
  my_activities: MyActivities;
  all_activities: AllActivities;
}

export interface Strategy {
  id: string;
  strategy_metadata: StrategyMetadata;
  execution_panel: ExecutionPanel;
  tabs: StrategyTabs;
}

export interface StrategyListItem {
  id: string;
  title: string;
  status: "Active" | "Inactive" | "Paused";
  current_apy: string;
  creator: StrategyCreator;
  tags: string[];
}
