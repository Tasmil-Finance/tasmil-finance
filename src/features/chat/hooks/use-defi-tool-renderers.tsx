"use client";

import { useRenderToolCall } from "@copilotkit/react-core";
import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { ActionSearchCard } from "@/features/chat/actions/components/stellar/action-search-card";
import { BridgeDiscoveryCard } from "@/features/chat/actions/components/stellar/bridge-discovery-card";
import { EarnDiscoveryCard } from "@/features/chat/actions/components/stellar/earn-discovery-card";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import { SwapQuoteCard } from "@/features/chat/actions/components/stellar/swap-quote-card";
import { TxSubmitCard } from "@/features/chat/actions/components/stellar/tx-submit-card";
import { TrustlineExecuteCard } from "@/features/chat/actions/components/stellar/trustline-execute-card";
import { SupervisorAgentCallCard } from "@/features/chat/actions/components/stellar/supervisor-agent-call-card";
// Shared protocol cards
import { BlendPoolsCard, BlendPoolDetailCard, BlendReserveCard, BlendPositionsCard, BlendTxCard, BlendBackstopInfoCard, BlendBackstopBalanceCard } from "@/features/protocols/cards/blend";
import { normalizePoolsFromMcp, normalizePoolFromMcp, normalizeReserveFromMcp, normalizePositionsFromMcp, normalizeTxFromMcp, normalizeBackstopFromMcp, normalizeBackstopBalanceFromMcp } from "@/features/protocols/adapters/from-mcp";

/**
 * Registers CopilotKit tool renderers for all MCP tools.
 *
 * Replaces the 40+ entry ComponentMap + LoadExternalComponent pattern with
 * direct tool-name-to-component mappings via useRenderToolCall hooks.
 *
 * Must be rendered inside a <CopilotKit> provider.
 */

// ---------------------------------------------------------------------------
// Helper to adapt CopilotKit render props to our card component props
// ---------------------------------------------------------------------------

type RenderProps = {
  status: "inProgress" | "executing" | "complete";
  args: Record<string, unknown>;
  result: unknown;
};

// ---------------------------------------------------------------------------
// Info tool → component mapping (tool name → UI type → component)
// ---------------------------------------------------------------------------

export const INFO_TOOL_RENDERERS: Array<{
  toolName: string;
  type: string;
  component: React.ComponentType<any>;
}> = [
  // Shared tools
  { toolName: "get_account", type: "account_info", component: AccountInfoCard },
  { toolName: "search_actions", type: "action_search", component: ActionSearchCard },

  // Soroswap
  { toolName: "swap_get_quote", type: "swap_quote", component: SwapQuoteCard },
  { toolName: "swap_get_pool_liquidity", type: "pool_liquidity", component: PoolInfoCard },
  { toolName: "swap_get_pools", type: "pool_list", component: PoolInfoCard },
  { toolName: "swap_get_pool", type: "pool_info", component: PoolInfoCard },
  { toolName: "swap_get_user_positions", type: "user_positions", component: AccountInfoCard },
  { toolName: "swap_get_price", type: "price_info", component: AccountInfoCard },
  { toolName: "sdex_find_paths", type: "sdex_paths", component: AccountInfoCard },
  { toolName: "sdex_orderbook", type: "sdex_orderbook", component: AccountInfoCard },

  // Blend — all info tools now use shared protocol cards (see BLEND_SHARED_INFO below)

  // Phoenix
  { toolName: "phoenix_query_pools", type: "pool_list", component: PoolInfoCard },
  { toolName: "phoenix_get_pool_info", type: "pool_info", component: PoolInfoCard },
  { toolName: "phoenix_get_user_portfolio", type: "user_portfolio", component: AccountInfoCard },
  { toolName: "phoenix_simulate_swap", type: "swap_simulation", component: SwapQuoteCard },
  { toolName: "phoenix_query_share", type: "share_info", component: AccountInfoCard },
  { toolName: "phoenix_stake_query", type: "stake_info", component: AccountInfoCard },

  // Aquarius
  { toolName: "aquarius_list_pools", type: "pool_list", component: PoolInfoCard },
  { toolName: "aquarius_get_pool_info", type: "pool_info", component: PoolInfoCard },
  { toolName: "aquarius_track_liquidity", type: "liquidity_position", component: AccountInfoCard },

  // Bridge
  { toolName: "bridge_get_routes", type: "bridge_routes", component: BridgeDiscoveryCard },
  { toolName: "bridge_get_quote", type: "bridge_quote", component: BridgeDiscoveryCard },

  // Allbridge
  { toolName: "allbridge_get_routes", type: "allbridge_routes", component: BridgeDiscoveryCard },
  { toolName: "allbridge_get_quote", type: "allbridge_quote", component: BridgeDiscoveryCard },

  // Templar
  { toolName: "templar_get_markets", type: "market_list", component: PoolInfoCard },
  { toolName: "templar_get_position", type: "user_position", component: AccountInfoCard },
  { toolName: "templar_swap_quote", type: "swap_quote", component: SwapQuoteCard },
  { toolName: "templar_get_borrow_health", type: "borrow_health", component: AccountInfoCard },
  { toolName: "templar_get_pending_interest", type: "pending_interest", component: AccountInfoCard },
  { toolName: "templar_get_pending_yield", type: "pending_yield", component: AccountInfoCard },

  // DeFindex
  { toolName: "vault_get_status", type: "vault_info", component: PoolInfoCard },
  { toolName: "vault_get_user_shares", type: "user_shares", component: AccountInfoCard },
  { toolName: "vault_list_vaults", type: "vault_list", component: PoolInfoCard },

  // Yield / Research
  { toolName: "discover", type: "earn_discovery", component: EarnDiscoveryCard },
];

// ---------------------------------------------------------------------------
// Operation tool → component mapping (tool name → operation → component)
// ---------------------------------------------------------------------------

export const OPERATION_TOOL_RENDERERS: Array<{
  toolName: string;
  operation: string;
  component: React.ComponentType<any>;
}> = [
  // Shared
  { toolName: "submit_transaction", operation: "tx_submit", component: TxSubmitCard },
  { toolName: "execute", operation: "execute", component: TrustlineExecuteCard },

  // Soroswap
  { toolName: "swap_build_transaction", operation: "swap_execute", component: StellarExecuteCard },
  { toolName: "swap_add_liquidity", operation: "add_liquidity", component: StellarExecuteCard },
  { toolName: "swap_remove_liquidity", operation: "remove_liquidity", component: StellarExecuteCard },
  { toolName: "sdex_swap", operation: "sdex_swap_execute", component: StellarExecuteCard },

  // Blend operations — now use shared BlendTxCard (see BLEND_SHARED_OPERATIONS below)

  // Phoenix
  { toolName: "phoenix_swap", operation: "phoenix_swap_execute", component: StellarExecuteCard },
  { toolName: "phoenix_provide_liquidity", operation: "provide_liquidity", component: StellarExecuteCard },
  { toolName: "phoenix_withdraw_liquidity", operation: "withdraw_liquidity", component: StellarExecuteCard },
  { toolName: "phoenix_stake_bond", operation: "stake_bond", component: StellarExecuteCard },
  { toolName: "phoenix_stake_unbond", operation: "stake_unbond", component: StellarExecuteCard },
  { toolName: "phoenix_stake_claim_rewards", operation: "claim_rewards", component: StellarExecuteCard },

  // Aquarius
  { toolName: "aquarius_add_liquidity", operation: "add_liquidity", component: StellarExecuteCard },
  { toolName: "aquarius_withdraw_liquidity", operation: "withdraw_liquidity", component: StellarExecuteCard },
  { toolName: "aquarius_swap", operation: "swap_execute", component: StellarExecuteCard },
  { toolName: "aquarius_claim_rewards", operation: "claim_rewards", component: StellarExecuteCard },
  { toolName: "aquarius_lock_aqua", operation: "lock_aqua", component: StellarExecuteCard },

  // Bridge
  { toolName: "bridge_build_transaction", operation: "bridge_execute", component: StellarExecuteCard },

  // Allbridge
  { toolName: "allbridge_build_transaction", operation: "allbridge_execute", component: StellarExecuteCard },

  // Templar
  { toolName: "templar_swap_execute", operation: "templar_swap", component: StellarExecuteCard },
  { toolName: "templar_supply", operation: "templar_supply", component: StellarExecuteCard },
  { toolName: "templar_borrow", operation: "templar_borrow", component: StellarExecuteCard },

  // DeFindex
  { toolName: "vault_deposit", operation: "vault_deposit", component: StellarExecuteCard },
  { toolName: "vault_withdraw", operation: "vault_withdraw", component: StellarExecuteCard },
];

// ---------------------------------------------------------------------------
// Supervisor agent-call tools
// ---------------------------------------------------------------------------

export const SUPERVISOR_AGENTS = [
  "info", "blend", "soroswap", "phoenix", "aquarius", "defindex",
  "templar", "allbridge", "sdex", "bridge", "yield", "research",
];

// ---------------------------------------------------------------------------
// Shared Blend info card registrations (tool name → shared component + adapter)
// ---------------------------------------------------------------------------

export const BLEND_SHARED_INFO: Array<{
  toolName: string;
  type: string;
  render: (props: RenderProps) => React.ReactElement;
}> = [
  {
    toolName: "resolve_pool",
    type: "pool_discovery",
    render: (props) => {
      const pools = normalizePoolsFromMcp(props.result);
      if (pools.length > 0) return <BlendPoolsCard pools={pools} mode="playground" />;
      return <PoolInfoCard type="pool_discovery" result={props.result} status={props.status} />;
    },
  },
  {
    toolName: "blend_get_pool_info",
    type: "blend_pool_info",
    render: (props) => {
      const pool = normalizePoolFromMcp(props.result);
      if (!pool) return <PoolInfoCard type="blend_pool_info" result={props.result} status={props.status} />;
      return <BlendPoolDetailCard pool={pool} mode="playground" />;
    },
  },
  {
    toolName: "blend_get_reserve_info",
    type: "blend_reserve_info",
    render: (props) => {
      const reserve = normalizeReserveFromMcp(props.result);
      if (!reserve) return <PoolInfoCard type="blend_reserve_info" result={props.result} status={props.status} />;
      return <BlendReserveCard reserve={reserve} mode="playground" />;
    },
  },
  {
    toolName: "blend_get_user_position",
    type: "blend_user_position",
    render: (props) => {
      const data = normalizePositionsFromMcp(props.result);
      if (!data) return <AccountInfoCard type="blend_user_position" result={props.result} status={props.status} />;
      return <BlendPositionsCard data={data} mode="playground" />;
    },
  },
  {
    toolName: "blend_backstop_get_pool_data",
    type: "blend_backstop_info",
    render: (props) => {
      const backstop = normalizeBackstopFromMcp(props.result);
      if (!backstop) return <PoolInfoCard type="blend_backstop_info" result={props.result} status={props.status} />;
      return <BlendBackstopInfoCard backstop={backstop} mode="playground" />;
    },
  },
  {
    toolName: "blend_backstop_get_user_balance",
    type: "blend_backstop_balance",
    render: (props) => {
      const data = normalizeBackstopBalanceFromMcp(props.result);
      if (!data) return <AccountInfoCard type="blend_backstop_balance" result={props.result} status={props.status} />;
      return <BlendBackstopBalanceCard data={data} mode="playground" />;
    },
  },
];

// ---------------------------------------------------------------------------
// Shared Blend operation card registrations
// ---------------------------------------------------------------------------

function makeBlendOpRenderer(operation: string) {
  return (props: RenderProps & { respond?: (result: Record<string, unknown>) => void }) => {
    const tx = normalizeTxFromMcp(props.result, props.args);
    if (!tx) return <div className="text-xs text-muted-foreground">Failed to parse transaction data</div>;
    const txWithOp = { ...tx, operation: tx.operation || operation };
    return <BlendTxCard tx={txWithOp} mode="playground" respond={props.respond} />;
  };
}

const BLEND_OPS_RAW = [
  { toolName: "blend_deposit", operation: "blend_supply" },
  { toolName: "blend_borrow", operation: "blend_borrow" },
  { toolName: "blend_repay", operation: "blend_repay" },
  { toolName: "blend_withdraw", operation: "blend_withdraw" },
  { toolName: "blend_toggle_collateral", operation: "blend_toggle_collateral" },
  { toolName: "blend_claim_emissions", operation: "blend_claim" },
  { toolName: "blend_backstop_deposit", operation: "backstop_deposit" },
  { toolName: "blend_backstop_queue_withdrawal", operation: "backstop_queue" },
  { toolName: "blend_backstop_dequeue_withdrawal", operation: "backstop_dequeue" },
  { toolName: "blend_backstop_withdraw", operation: "backstop_withdraw" },
] as const;

export const BLEND_SHARED_OPERATIONS = BLEND_OPS_RAW.map((op) => ({
  ...op,
  render: makeBlendOpRenderer(op.operation),
}));

// ---------------------------------------------------------------------------
// Component that registers all renderers
// ---------------------------------------------------------------------------

export function DefiToolRenderers() {
  // Info tools (non-Blend)
  for (const { toolName, type, component: Component } of INFO_TOOL_RENDERERS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRenderToolCall({
      name: toolName,
      description: `Render ${type} info card`,
      render: (props: RenderProps) => (
        <Component
          type={type}
          toolName={toolName}
          args={props.args}
          result={props.result}
          status={props.status}
        />
      ),
    });
  }

  // Blend shared info cards (using protocol card components)
  for (const { toolName, type, render: sharedRender } of BLEND_SHARED_INFO) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRenderToolCall({
      name: toolName,
      description: `Render ${type} info card (shared)`,
      render: (props: RenderProps) => <div className="max-w-[360px]">{sharedRender(props)}</div>,
    });
  }

  // Operation tools (non-Blend)
  for (const { toolName, operation, component: Component } of OPERATION_TOOL_RENDERERS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRenderToolCall({
      name: toolName,
      description: `Render ${operation} operation card`,
      render: (props: RenderProps) => (
        <Component
          operation={operation}
          toolName={toolName}
          args={props.args}
          result={props.result}
          status={props.status}
        />
      ),
    });
  }

  // Blend shared operation cards (using shared BlendTxCard)
  for (const { toolName, operation } of BLEND_SHARED_OPERATIONS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRenderToolCall({
      name: toolName,
      description: `Render ${operation} operation card (shared)`,
      render: (props: RenderProps & { respond?: (result: Record<string, unknown>) => void }) => {
        const tx = normalizeTxFromMcp(props.result, props.args);
        if (!tx) {
          return <div className="text-xs text-muted-foreground">Failed to parse transaction data</div>;
        }
        const txWithOp = { ...tx, operation: tx.operation || operation };
        return <div className="max-w-[360px]"><BlendTxCard tx={txWithOp} mode="playground" respond={props.respond} /></div>;
      },
    });
  }

  // Supervisor agent call tools
  for (const agent of SUPERVISOR_AGENTS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRenderToolCall({
      name: `call_${agent}_agent`,
      description: `Render supervisor call to ${agent} agent`,
      render: (props: RenderProps) => (
        <SupervisorAgentCallCard
          agent={agent}
          message={(props.args as Record<string, string>)?.message}
          status={props.status === "complete" ? "complete" : "calling"}
        />
      ),
    });
  }

  return null;
}
