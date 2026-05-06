"use client";

import { useCallback, useMemo, useState } from "react";
import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { AccountSetupCard } from "@/features/chat/actions/components/stellar/account-setup-card";
import { AccountStrategyCard } from "@/features/chat/actions/components/stellar/account-strategy-card";
import { ActionSearchCard } from "@/features/chat/actions/components/stellar/action-search-card";
import { BridgeDiscoveryCard } from "@/features/chat/actions/components/stellar/bridge-discovery-card";
import type { BridgeExecuteCardProps } from "@/features/chat/actions/components/stellar/bridge-execute-card";
import { BridgeExecuteCard } from "@/features/chat/actions/components/stellar/bridge-execute-card";
import { EarnDiscoveryCard } from "@/features/chat/actions/components/stellar/earn-discovery-card";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import { StrategyPresetCard } from "@/features/chat/actions/components/stellar/strategy-preset-card";
import type { SwapExecuteCardProps } from "@/features/chat/actions/components/stellar/swap-execute-card";
import { SwapExecuteCard } from "@/features/chat/actions/components/stellar/swap-execute-card";
import { SwapQuoteCard } from "@/features/chat/actions/components/stellar/swap-quote-card";
import { TrustlineExecuteCard } from "@/features/chat/actions/components/stellar/trustline-execute-card";
// Flow cards (option-select pattern)
import { ClarifyCard } from "@/features/chat/components/flow/clarify-card";

import { ExecutionCard } from "@/features/chat/components/flow/execution-card";
import { PlanPreviewCard } from "@/features/chat/components/flow/plan-preview-card";
import { useFlowSigning } from "@/features/chat/hooks/use-flow-signing";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import type { TxStatus } from "@/features/chat/types/flow-messages";
import {
  normalizeAquaPoolFromMcp,
  normalizeAquaPoolsFromMcp,
  normalizeAquaPositionsFromMcp,
  normalizeAquaTxFromMcp,
} from "@/features/protocols/adapters/aquarius-from-mcp";
import {
  normalizeBackstopBalanceFromMcp,
  normalizeBackstopFromMcp,
  normalizePoolFromMcp,
  normalizePoolsFromMcp,
  normalizePositionsFromMcp,
  normalizeReserveFromMcp,
  normalizeTxFromMcp,
  unwrapMcpResult,
} from "@/features/protocols/adapters/from-mcp";
import { normalizeSoroswapPoolsFromMcp } from "@/features/protocols/adapters/soroswap-from-mcp";
// Shared Aquarius protocol cards
import {
  AquaPoolDetailCard,
  AquaPoolsCard,
  AquaPositionsCard,
  AquaTxCard,
} from "@/features/protocols/cards/aquarius";
// Shared protocol cards
import {
  BlendBackstopBalanceCard,
  BlendBackstopInfoCard,
  BlendPoolDetailCard,
  BlendPoolsCard,
  BlendPositionsCard,
  BlendReserveCard,
  BlendTxCard,
} from "@/features/protocols/cards/blend";
import { SoroswapPoolsCard } from "@/features/protocols/cards/soroswap";
import { useWalletStore } from "@/store/use-wallet";

/**
 * Tool renderer registries for DeFi MCP tools.
 *
 * These data arrays map tool names to UI components.  They are consumed by
 * `ToolCallRenderer` (in `tool-call-renderer.tsx`) which renders tool call
 * results from the message stream.
 */

// ---------------------------------------------------------------------------
// Helper: simplify raw contract/simulation error messages for the UI
// ---------------------------------------------------------------------------

function simplifyErrorMessage(raw: string): string {
  // "All N steps failed. Errors: [{...}]" — extract the first error summary
  const stepsMatch = raw.match(/All \d+ steps? failed/);
  if (stepsMatch) {
    // Try to extract user-friendly part from nested JSON
    const simMatch = raw.match(
      /Contract simulation failed:\s*HostError:\s*Error\(Contract,\s*#(\d+)\)/
    );
    if (simMatch) {
      return `Transaction simulation failed (contract error #${simMatch[1]}). The AI will suggest an alternative.`;
    }
    return "Transaction simulation failed. The AI will suggest an alternative.";
  }
  // Generic contract simulation error
  if (raw.includes("Contract simulation failed")) {
    const codeMatch = raw.match(/Error\(Contract,\s*#(\d+)\)/);
    if (codeMatch) {
      return `Transaction simulation failed (contract error #${codeMatch[1]}).`;
    }
    return "Transaction simulation failed.";
  }
  // Keep short messages as-is, truncate very long ones
  if (raw.length > 200) {
    return `${raw.slice(0, 150)}…`;
  }
  return raw;
}

// ---------------------------------------------------------------------------
// Helper to adapt render props to our card component props
// ---------------------------------------------------------------------------

type RenderProps = {
  status: "inProgress" | "executing" | "complete";
  args: Record<string, unknown>;
  result: unknown;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
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

  // Aquarius — uses shared protocol cards (see AQUARIUS_SHARED_INFO below)

  // Bridge
  { toolName: "bridge_get_routes", type: "bridge_routes", component: BridgeDiscoveryCard },
  { toolName: "bridge_get_quote", type: "bridge_quote", component: BridgeDiscoveryCard },

  // Allbridge
  { toolName: "allbridge_get_routes", type: "allbridge_routes", component: BridgeDiscoveryCard },
  { toolName: "allbridge_get_quote", type: "allbridge_quote", component: BridgeDiscoveryCard },
  {
    toolName: "allbridge_pool_deposit_quote",
    type: "allbridge_deposit_quote",
    component: PoolInfoCard,
  },
  {
    toolName: "allbridge_pool_withdraw_quote",
    type: "allbridge_withdraw_quote",
    component: PoolInfoCard,
  },

  // Templar
  { toolName: "templar_get_markets", type: "market_list", component: PoolInfoCard },
  { toolName: "templar_get_position", type: "user_position", component: AccountInfoCard },
  { toolName: "templar_swap_quote", type: "swap_quote", component: SwapQuoteCard },
  { toolName: "templar_get_borrow_health", type: "borrow_health", component: AccountInfoCard },
  {
    toolName: "templar_get_pending_interest",
    type: "pending_interest",
    component: AccountInfoCard,
  },
  { toolName: "templar_get_pending_yield", type: "pending_yield", component: AccountInfoCard },

  // Blend (additional)
  { toolName: "blend_get_borrow_capacity", type: "blend_borrow_cap", component: PoolInfoCard },

  // DeFindex
  { toolName: "vault_get_status", type: "vault_info", component: PoolInfoCard },
  { toolName: "vault_get_user_shares", type: "user_shares", component: AccountInfoCard },
  { toolName: "vault_list_vaults", type: "vault_list", component: PoolInfoCard },
  { toolName: "vault_get_apy", type: "vault_apy", component: PoolInfoCard },

  // Tasmil Strategy (active — rendered via TASMIL_INFO_TOOLS allowlist)
  { toolName: "get_strategy_presets", type: "strategy_presets", component: StrategyPresetCard },
  { toolName: "get_account_strategy", type: "account_strategy", component: AccountStrategyCard },

  // Yield / Research
  { toolName: "discover", type: "earn_discovery", component: EarnDiscoveryCard },

  { toolName: "compare_bridge", type: "bridge_routes", component: BridgeDiscoveryCard },
  { toolName: "compare_earn", type: "earn_comparison", component: EarnDiscoveryCard },
  { toolName: "compare_lending", type: "lending_comparison", component: PoolInfoCard },
];

// ---------------------------------------------------------------------------
// Operation tool → component mapping (tool name → operation → component)
// ---------------------------------------------------------------------------

export const OPERATION_TOOL_RENDERERS: Array<{
  toolName: string;
  operation: string;
  component: React.ComponentType<any>;
}> = [
  // NOTE: "execute" is handled by EXECUTE_DISPATCHER below (protocol-aware routing)

  // Soroswap
  { toolName: "swap_build_transaction", operation: "swap_execute", component: StellarExecuteCard },
  { toolName: "swap_add_liquidity", operation: "add_liquidity", component: StellarExecuteCard },
  {
    toolName: "swap_remove_liquidity",
    operation: "remove_liquidity",
    component: StellarExecuteCard,
  },
  { toolName: "sdex_swap", operation: "sdex_swap_execute", component: StellarExecuteCard },

  // Blend operations — now use shared BlendTxCard (see BLEND_SHARED_OPERATIONS below)

  // Phoenix
  { toolName: "phoenix_swap", operation: "phoenix_swap_execute", component: StellarExecuteCard },
  {
    toolName: "phoenix_provide_liquidity",
    operation: "provide_liquidity",
    component: StellarExecuteCard,
  },
  {
    toolName: "phoenix_withdraw_liquidity",
    operation: "withdraw_liquidity",
    component: StellarExecuteCard,
  },
  { toolName: "phoenix_stake_bond", operation: "stake_bond", component: StellarExecuteCard },
  { toolName: "phoenix_stake_unbond", operation: "stake_unbond", component: StellarExecuteCard },
  {
    toolName: "phoenix_stake_claim_rewards",
    operation: "claim_rewards",
    component: StellarExecuteCard,
  },

  // Aquarius — uses shared protocol cards (see AQUARIUS_SHARED_OPERATIONS below)

  // Bridge
  {
    toolName: "bridge_build_transaction",
    operation: "bridge_execute",
    component: StellarExecuteCard,
  },

  // Allbridge
  {
    toolName: "allbridge_build_transaction",
    operation: "allbridge_execute",
    component: StellarExecuteCard,
  },

  // Templar
  { toolName: "templar_swap_execute", operation: "templar_swap", component: StellarExecuteCard },
  { toolName: "templar_supply", operation: "templar_supply", component: StellarExecuteCard },
  { toolName: "templar_borrow", operation: "templar_borrow", component: StellarExecuteCard },

  // Unified swap/bridge execution (returns XDR for signing)
  { toolName: "execute_swap", operation: "swap_execute", component: StellarExecuteCard },
  { toolName: "execute_bridge", operation: "bridge_execute", component: StellarExecuteCard },
  { toolName: "execute_earn", operation: "earn_execute", component: StellarExecuteCard },
  { toolName: "execute_lending", operation: "lending_execute", component: StellarExecuteCard },

  // DeFindex
  { toolName: "vault_deposit", operation: "vault_deposit", component: StellarExecuteCard },
  { toolName: "vault_withdraw", operation: "vault_withdraw", component: StellarExecuteCard },
  {
    toolName: "vault_withdraw_by_amounts",
    operation: "vault_withdraw_by_amounts",
    component: StellarExecuteCard,
  },
];

// ---------------------------------------------------------------------------
// Supervisor agent-call tools
// ---------------------------------------------------------------------------

export const SUPERVISOR_AGENTS = [
  "info",
  "blend",
  "soroswap",
  "phoenix",
  "aquarius",
  "defindex",
  "templar",
  "allbridge",
  "sdex",
  "bridge",
  "yield",
  "research",
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
      const protocol = (props.args as Record<string, string>)?.protocol;

      if (protocol === "aquarius") {
        const pools = normalizeAquaPoolsFromMcp(props.result);
        if (pools.length > 0) return <AquaPoolsCard pools={pools} mode="playground" />;
      } else if (protocol === "soroswap") {
        const pools = normalizeSoroswapPoolsFromMcp(props.result);
        if (pools.length > 0) return <SoroswapPoolsCard pools={pools} mode="playground" />;
      } else {
        const pools = normalizePoolsFromMcp(props.result);
        if (pools.length > 0) return <BlendPoolsCard pools={pools} mode="playground" />;
      }

      return <PoolInfoCard type="pool_discovery" result={props.result} status={props.status} />;
    },
  },
  {
    toolName: "blend_get_pool_info",
    type: "blend_pool_info",
    render: (props) => {
      const pool = normalizePoolFromMcp(props.result);
      if (!pool)
        return <PoolInfoCard type="blend_pool_info" result={props.result} status={props.status} />;
      return <BlendPoolDetailCard pool={pool} mode="playground" />;
    },
  },
  {
    toolName: "blend_get_reserve_info",
    type: "blend_reserve_info",
    render: (props) => {
      const reserve = normalizeReserveFromMcp(props.result);
      if (!reserve)
        return (
          <PoolInfoCard type="blend_reserve_info" result={props.result} status={props.status} />
        );
      return <BlendReserveCard reserve={reserve} mode="playground" />;
    },
  },
  {
    toolName: "blend_get_user_position",
    type: "blend_user_position",
    render: (props) => {
      const data = normalizePositionsFromMcp(props.result);
      if (!data)
        return (
          <AccountInfoCard type="blend_user_position" result={props.result} status={props.status} />
        );
      return <BlendPositionsCard data={data} mode="playground" />;
    },
  },
  {
    toolName: "blend_backstop_get_pool_data",
    type: "blend_backstop_info",
    render: (props) => {
      const backstop = normalizeBackstopFromMcp(props.result);
      if (!backstop)
        return (
          <PoolInfoCard type="blend_backstop_info" result={props.result} status={props.status} />
        );
      return <BlendBackstopInfoCard backstop={backstop} mode="playground" />;
    },
  },
  {
    toolName: "blend_backstop_get_user_balance",
    type: "blend_backstop_balance",
    render: (props) => {
      const data = normalizeBackstopBalanceFromMcp(props.result);
      if (!data)
        return (
          <AccountInfoCard
            type="blend_backstop_balance"
            result={props.result}
            status={props.status}
          />
        );
      return <BlendBackstopBalanceCard data={data} mode="playground" />;
    },
  },
];

// ---------------------------------------------------------------------------
// Shared Blend operation card registrations
// ---------------------------------------------------------------------------

function makeBlendOpRenderer(operation: string) {
  return (props: RenderProps) => {
    const tx = normalizeTxFromMcp(props.result, props.args);
    if (!tx)
      return <div className="text-muted-foreground text-xs">Failed to parse transaction data</div>;
    const txWithOp = { ...tx, operation: tx.operation || operation };
    return (
      <BlendTxCard
        tx={txWithOp}
        mode="chat"
        toolCallId={props.toolCallId}
        respond={props.respond}
      />
    );
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
  { toolName: "blend_join_comet", operation: "join_comet_pool" },
  { toolName: "blend_exit_comet", operation: "exit_comet_pool" },
] as const;

export const BLEND_SHARED_OPERATIONS = BLEND_OPS_RAW.map((op) => ({
  ...op,
  render: makeBlendOpRenderer(op.operation),
}));

// ---------------------------------------------------------------------------
// Shared Aquarius info card registrations (tool name → shared component + adapter)
// ---------------------------------------------------------------------------

export const AQUARIUS_SHARED_INFO: Array<{
  toolName: string;
  type: string;
  render: (props: RenderProps) => React.ReactElement;
}> = [
  {
    toolName: "aquarius_list_pools",
    type: "aquarius_pools",
    render: (props) => {
      const pools = normalizeAquaPoolsFromMcp(props.result);
      if (pools && pools.length > 0) return <AquaPoolsCard pools={pools} mode="playground" />;
      return <PoolInfoCard type="aquarius_pools" result={props.result} status={props.status} />;
    },
  },
  {
    toolName: "aquarius_get_pool_info",
    type: "aquarius_pool_info",
    render: (props) => {
      const pool = normalizeAquaPoolFromMcp(props.result);
      if (!pool)
        return (
          <PoolInfoCard type="aquarius_pool_info" result={props.result} status={props.status} />
        );
      return <AquaPoolDetailCard pool={pool} mode="playground" />;
    },
  },
  {
    toolName: "aquarius_track_liquidity",
    type: "aquarius_positions",
    render: (props) => {
      const data = normalizeAquaPositionsFromMcp(props.result);
      if (!data)
        return (
          <AccountInfoCard type="aquarius_positions" result={props.result} status={props.status} />
        );
      return <AquaPositionsCard data={data} mode="playground" />;
    },
  },
];

// ---------------------------------------------------------------------------
// Shared Aquarius operation card registrations
// ---------------------------------------------------------------------------

function makeAquaOpRenderer(operation: string) {
  return (props: RenderProps) => {
    const tx = normalizeAquaTxFromMcp(props.result, props.args);
    if (!tx)
      return <div className="text-muted-foreground text-xs">Failed to parse transaction data</div>;
    const txWithOp = { ...tx, operation: tx.operation || operation };
    return (
      <AquaTxCard tx={txWithOp} mode="chat" toolCallId={props.toolCallId} respond={props.respond} />
    );
  };
}

const AQUA_OPS_RAW = [
  { toolName: "aquarius_add_liquidity", operation: "add_liquidity" },
  { toolName: "aquarius_withdraw_liquidity", operation: "withdraw_liquidity" },
  { toolName: "aquarius_swap", operation: "swap" },
  { toolName: "aquarius_claim_rewards", operation: "claim_rewards" },
  { toolName: "aquarius_lock_aqua", operation: "lock_aqua" },
] as const;

export const AQUARIUS_SHARED_OPERATIONS = AQUA_OPS_RAW.map((op) => ({
  ...op,
  render: makeAquaOpRenderer(op.operation),
}));

// ---------------------------------------------------------------------------
// Unified execute tool dispatcher — routes to protocol-specific cards
// ---------------------------------------------------------------------------

/** Map execute action names → BlendTxCard operation names */
const EXECUTE_ACTION_TO_BLEND_OP: Record<string, string> = {
  supply: "blend_supply",
  supply_collateral: "blend_supply",
  deposit_for_yield: "blend_supply",
  deposit: "blend_supply",
  borrow: "blend_borrow",
  repay: "blend_repay",
  withdraw: "blend_withdraw",
  withdraw_collateral: "blend_withdraw",
  claim_emissions: "blend_claim",
  backstop_deposit: "backstop_deposit",
  backstop_queue_withdrawal: "backstop_queue",
  backstop_dequeue_withdrawal: "backstop_dequeue",
  backstop_withdraw: "backstop_withdraw",
  join_comet_pool: "join_comet_pool",
  exit_comet_pool: "exit_comet_pool",
};

const AQUARIUS_ACTIONS = new Set([
  "add_liquidity",
  "remove_liquidity",
  "swap",
  "claim_rewards",
  "lock_aqua",
]);

// ─── Normalizers for swap & bridge ────────────────────────────────

function normalizeSwapTxFromMcp(
  result: unknown,
  args?: Record<string, unknown>
): SwapExecuteCardProps {
  const { data } = unwrapMcpResult(result);
  const merged = { ...(data ?? {}), ...(args ?? {}) };
  const ctx = (merged.context as Record<string, unknown>) ?? {};

  const tokenIn = String(merged.tokenIn ?? ctx.tokenIn ?? ctx.sourceAsset ?? "");
  const tokenOut = String(merged.tokenOut ?? ctx.tokenOut ?? ctx.destAsset ?? "");
  const amountIn = String(merged.amount ?? ctx.amountIn ?? "0");
  const amountOut = ctx.amountOut != null ? String(ctx.amountOut) : null;

  // Extract route data from route array (protocol-dependent format)
  const route = merged.route;
  let routePools: string[] | undefined;
  let routeTokens: string[] | undefined;
  if (Array.isArray(route)) {
    routePools = route.map((r: unknown) => {
      if (typeof r === "string") return r;
      const obj = r as Record<string, unknown>;
      return String(obj?.address ?? obj?.pool ?? obj?.poolAddress ?? r);
    });
    // Try to extract token symbols from route if they look like token names
    routeTokens = route
      .map((r: unknown) => {
        if (typeof r === "string" && r.length <= 10 && !r.startsWith("C")) return r;
        const obj = r as Record<string, unknown>;
        return String(obj?.token ?? obj?.symbol ?? obj?.asset ?? "");
      })
      .filter(Boolean);
    if (routeTokens.length < 2) routeTokens = undefined;
  }

  // Extract fee / price impact / rate from context
  const feePercent = ctx.feePercent != null ? String(ctx.feePercent) : undefined;
  const priceImpact = ctx.priceImpact != null ? String(ctx.priceImpact) : undefined;
  const expectedRate = ctx.expectedRate != null ? String(ctx.expectedRate) : undefined;
  const estimatedTime = ctx.estimatedTime != null ? String(ctx.estimatedTime) : undefined;

  return {
    operation: String(merged.action ?? "swap"),
    tokenIn,
    tokenOut,
    amountIn,
    amountOut,
    routeTokens,
    routePools,
    xdr: String(merged.xdr ?? ""),
    protocol: merged.protocol as string | undefined,
    estimatedFee: merged.estimatedFee != null ? String(merged.estimatedFee) : undefined,
    feePercent,
    priceImpact,
    expectedRate,
    estimatedTime,
    context: ctx as Record<string, unknown> | undefined,
  };
}

function normalizeBridgeTxFromMcp(
  result: unknown,
  args?: Record<string, unknown>
): BridgeExecuteCardProps {
  const { data } = unwrapMcpResult(result);
  const merged = { ...(data ?? {}), ...(args ?? {}) };
  const ctx = (merged.context as Record<string, unknown>) ?? {};

  const fromChain = String(merged.fromChain ?? ctx.fromChain ?? "");
  const toChain = String(merged.toChain ?? ctx.toChain ?? "");
  const tokenIn = String((ctx.fromToken as Record<string, unknown>)?.symbol ?? merged.asset ?? "");
  const tokenOut = String((ctx.toToken as Record<string, unknown>)?.symbol ?? merged.asset ?? "");
  const amountIn = String(merged.amount ?? ctx.amount ?? "0");

  // Transaction type detection
  const depositAddress = merged.depositAddress != null ? String(merged.depositAddress) : null;
  const depositMemo = merged.depositMemo != null ? String(merged.depositMemo) : null;
  const depositInstruction = merged.instruction != null ? String(merged.instruction) : null;

  let xdr: string | null = null;
  let evmTx: { to: string; data: string; value?: string } | null = null;

  const rawTx = merged.transaction;
  if (rawTx) {
    if (typeof rawTx === "string") {
      xdr = rawTx;
    } else if (typeof rawTx === "object" && rawTx !== null) {
      const tx = rawTx as Record<string, unknown>;
      if (tx.to && tx.data) {
        evmTx = {
          to: String(tx.to),
          data: String(tx.data),
          value: tx.value != null ? String(tx.value) : undefined,
        };
      }
    }
  }

  return {
    operation: "bridge",
    provider: merged.provider as string | undefined,
    fromChain,
    toChain,
    tokenIn,
    tokenOut,
    amountIn,
    xdr,
    evmTx,
    depositAddress,
    depositMemo,
    depositInstruction,
    fromAddress: (merged.fromAddress as string) ?? (ctx.fromAddress as string),
    toAddress: (merged.toAddress as string) ?? (ctx.toAddress as string),
    context: ctx as Record<string, unknown> | undefined,
  };
}

export const EXECUTE_DISPATCHER = {
  toolName: "execute",
  render: (props: RenderProps) => {
    const { data } = unwrapMcpResult(props.result);
    const action = String((data as Record<string, unknown>)?.action ?? props.args?.action ?? "");
    const protocol = String(
      (data as Record<string, unknown>)?.protocol ?? props.args?.protocol ?? ""
    );

    // ── Swap operations ────────────────────────────────────────
    if (action === "swap") {
      const tx = normalizeSwapTxFromMcp(props.result, props.args);
      return (
        <SwapExecuteCard
          tx={tx}
          mode="chat"
          toolCallId={props.toolCallId}
          respond={props.respond}
        />
      );
    }

    // ── Bridge operations ──────────────────────────────────────
    if (action === "bridge") {
      const tx = normalizeBridgeTxFromMcp(props.result, props.args);
      // Route through unified swap/bridge card for simple Stellar bridges (has XDR)
      // Keep BridgeExecuteCard for complex cases: EVM source, deposit-pattern without XDR
      const isSimpleStellarBridge =
        tx.xdr && (!tx.fromChain || tx.fromChain.toLowerCase() === "stellar");
      if (isSimpleStellarBridge) {
        // Adapt BridgeExecuteCardProps → SwapExecuteCardProps for unified card
        const swapTx: SwapExecuteCardProps = {
          operation: "bridge",
          tokenIn: tx.tokenIn,
          tokenOut: tx.tokenOut,
          amountIn: tx.amountIn,
          amountOut: tx.amountOut,
          xdr: tx.xdr!,
          protocol: tx.provider ?? "bridge",
          provider: tx.provider,
          estimatedFee: tx.estimatedFee,
          estimatedTime: tx.estimatedTime,
          fromChain: tx.fromChain,
          toChain: tx.toChain,
          fromAddress: tx.fromAddress,
          toAddress: tx.toAddress,
          context: tx.context,
        };
        return (
          <SwapExecuteCard
            tx={swapTx}
            mode="chat"
            toolCallId={props.toolCallId}
            respond={props.respond}
          />
        );
      }
      return (
        <BridgeExecuteCard
          tx={tx}
          mode="chat"
          toolCallId={props.toolCallId}
          respond={props.respond}
        />
      );
    }

    // Blend lending + backstop + comet operations
    const blendOp = EXECUTE_ACTION_TO_BLEND_OP[action];
    if (blendOp || protocol === "blend") {
      const tx = normalizeTxFromMcp(props.result, props.args);
      if (tx) {
        const txWithOp = { ...tx, operation: blendOp || tx.operation || action };
        return (
          <BlendTxCard
            tx={txWithOp}
            mode="chat"
            toolCallId={props.toolCallId}
            respond={props.respond}
          />
        );
      }
    }

    // Aquarius operations
    if (AQUARIUS_ACTIONS.has(action) && protocol === "aquarius") {
      const tx = normalizeAquaTxFromMcp(props.result, props.args);
      if (tx) {
        const txWithOp = { ...tx, operation: tx.operation || action };
        return (
          <AquaTxCard
            tx={txWithOp}
            mode="chat"
            toolCallId={props.toolCallId}
            respond={props.respond}
          />
        );
      }
    }

    // Trustline operations — keep existing behavior
    if (action === "add_trustline" || action === "remove_trustline") {
      return (
        <TrustlineExecuteCard
          operation={action}
          args={props.args}
          result={props.result}
          toolCallId={props.toolCallId}
          status={
            props.status === "inProgress"
              ? "pending"
              : props.status === "complete"
                ? "complete"
                : "executing"
          }
          respond={props.respond}
        />
      );
    }

    // Fallback — generic execute card for LP, stake, vault, lock, etc.
    return (
      <StellarExecuteCard
        tx={{
          operation: action || "execute",
          protocol,
          xdr: String((data as Record<string, unknown>)?.xdr ?? ""),
          amount: ((data as Record<string, unknown>)?.amount as string) ?? null,
          symbol: ((data as Record<string, unknown>)?.symbol as string) ?? null,
          estimatedFee: ((data as Record<string, unknown>)?.estimatedFee as string) ?? undefined,
          context: (data as Record<string, unknown>)?.context as
            | Record<string, unknown>
            | undefined,
        }}
        operation={action || "execute"}
        args={props.args}
        result={props.result}
        status={props.status === "inProgress" ? "executing" : props.status}
        respond={props.respond}
      />
    );
  },
};

// ---------------------------------------------------------------------------
// Flow tool renderers (option-select cards)
//
// Unlike Blend HITL cards that resume a paused graph via `respond`,
// flow cards send the user's selection as a new human message via
// `stream.submit`. This starts a new agent turn with the selection context.
// ---------------------------------------------------------------------------

/** Try to find a clarify_response message AFTER this tool call to restore selection state. */
function usePreviousClarifyResponse(
  questions: {
    field_name: string;
    input_type: string;
    suggestions?: { label: string; value: Record<string, unknown> }[];
  }[],
  toolCallId?: string
) {
  const stream = useStreamContext();
  return useMemo(() => {
    const msgs = stream.messages ?? [];

    // Find the index of the tool message for this specific tool call.
    // Only match clarify_response messages that come AFTER it.
    let startIdx = 0;
    if (toolCallId) {
      const toolIdx = msgs.findIndex(
        (m) => m.type === "tool" && (m as any).tool_call_id === toolCallId
      );
      if (toolIdx >= 0) startIdx = toolIdx + 1;
    }

    for (let i = startIdx; i < msgs.length; i++) {
      const m = msgs[i]!;
      if (m.type !== "human") continue;
      const content = typeof m.content === "string" ? m.content : "";
      if (!content.includes("clarify_response")) continue;
      try {
        const parsed = JSON.parse(content);
        if (parsed?.type !== "clarify_response") continue;
        // Reconstruct answers from the payload — match each question's field
        const answers: Record<string, unknown> = {};
        for (const q of questions) {
          if (q.input_type === "select" && q.suggestions) {
            const match = q.suggestions.find((s) =>
              Object.entries(s.value).every(([k, v]) => parsed[k] === v)
            );
            if (match) answers[q.field_name] = match.value;
          } else if (q.input_type === "text" && parsed[q.field_name]) {
            answers[q.field_name] = parsed[q.field_name];
          }
        }
        if (Object.keys(answers).length > 0) return answers;
      } catch {}
    }
    return null;
  }, [stream.messages, questions, toolCallId]);
}

/** Unified ClarifyCard wrapper — handles both single and multi-question flows. */
function FlowClarifyCardWithStream({
  questions,
  context,
  toolCallId,
}: {
  questions: {
    field_name: string;
    question: string;
    input_type: "select" | "text";
    suggestions?: {
      label: string;
      value: Record<string, unknown>;
      tags?: string[];
      description?: string;
    }[];
    placeholder?: string;
  }[];
  context?: Record<string, unknown>;
  toolCallId?: string;
}) {
  const stream = useStreamContext();
  const walletAddress = useWalletStore((s) => s.account);
  const previousAnswers = usePreviousClarifyResponse(questions, toolCallId);
  const [sent, setSent] = useState(!!previousAnswers);

  const handleSubmit = useCallback(
    async (answers: Record<string, unknown>) => {
      if (sent) return;
      setSent(true);

      // Build structured JSON payload from answers + context
      // Backend detects {"type":"clarify_response"} and skips regex parsing
      const payload: Record<string, unknown> = { type: "clarify_response" };

      for (const q of questions) {
        const answer = answers[q.field_name];
        if (q.input_type === "select" && answer && typeof answer === "object") {
          // answer IS the suggestion.value object: {protocol, pool_address, asset, ...}
          Object.assign(payload, answer);
        } else if (q.input_type === "text" && typeof answer === "string" && answer.trim()) {
          payload[q.field_name] = answer.trim();
        }
      }

      // Include carried context (source_chain, source_asset, etc.)
      if (context) {
        for (const [k, v] of Object.entries(context)) {
          if (v !== undefined && v !== null && !(k in payload)) {
            payload[k] = v;
          }
        }
      }

      const message = JSON.stringify(payload);

      try {
        await stream.submit({
          messages: [{ type: "human" as const, content: message }],
          ...(walletAddress && { wallet_address: walletAddress }),
        });
      } catch (err) {
        console.error("[FlowClarifyCard] submit error:", err);
        setSent(false);
      }
    },
    [stream, questions, context, sent, walletAddress]
  );

  return (
    <ClarifyCard
      questions={questions}
      onSubmit={handleSubmit}
      disabled={sent}
      initialAnswers={previousAnswers ?? undefined}
    />
  );
}

/** Parse flow tool result — handles string, object, and MCP content-block formats. */
function parseFlowResult(result: unknown): Record<string, unknown> | null {
  if (!result) {
    console.warn("[parseFlowResult] result is falsy:", result);
    return null;
  }

  // Already an object with expected fields
  if (typeof result === "object" && !Array.isArray(result) && result !== null) {
    const obj = result as Record<string, unknown>;
    if (
      "kind" in obj ||
      "question" in obj ||
      "questions" in obj ||
      "plan" in obj ||
      "step" in obj
    ) {
      return obj;
    }
    // Try unwrapping MCP content-block wrapper: {content: [{type:"text", text:"..."}]}
    if ("content" in obj && Array.isArray(obj.content)) {
      const textBlock = (obj.content as { type?: string; text?: string }[]).find(
        (b) => b?.type === "text" && typeof b?.text === "string"
      );
      if (textBlock?.text) {
        try {
          return JSON.parse(textBlock.text) as Record<string, unknown>;
        } catch {
          /* fall through */
        }
      }
    }
    // Try unwrapping single-string content wrapper: {content: "..."}
    if ("content" in obj && typeof obj.content === "string") {
      try {
        return JSON.parse(obj.content) as Record<string, unknown>;
      } catch {
        /* fall through */
      }
    }
    // Object but missing expected keys — log what keys it has
    console.warn("[parseFlowResult] object missing expected keys, received:", Object.keys(obj));
    return null;
  }

  // MCP content-block format: [{type:"text", text:"..."}]
  let raw = result;
  if (Array.isArray(result)) {
    const textBlock = (result as { type?: string; text?: string }[]).find(
      (b) => b?.type === "text" && typeof b?.text === "string"
    );
    if (textBlock?.text) raw = textBlock.text;
  }

  // String — parse JSON (handles double-serialization via recursive call)
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "string") {
        // Double-serialized — parse again
        try {
          return JSON.parse(parsed) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      console.warn("[parseFlowResult] failed to parse JSON string, raw:", raw.slice(0, 200));
      return null;
    }
  }

  console.warn(
    "[parseFlowResult] unhandled type:",
    typeof result,
    "value:",
    String(result).slice(0, 200)
  );
  return null;
}

/** PlanPreviewCard wired to useFlowSigning — handles confirm → sign → execute inline. */
function FlowPlanWithSigning({
  plan,
  simulationReport,
}: {
  plan: Record<string, unknown>;
  simulationReport?: Record<string, unknown>;
}) {
  const { signFlow, isSubmitting, stepResults, currentStep, totalSteps } = useFlowSigning();
  const [phase, setPhase] = useState<"preview" | "signing" | "done" | "error">("preview");
  const [error, setError] = useState<string | undefined>();

  const xdrs = (simulationReport?.xdrs as string[]) || [];

  const handleConfirm = useCallback(async () => {
    if (xdrs.length === 0) return;
    setPhase("signing");
    const result = await signFlow(xdrs);
    if (result.success) {
      setPhase("done");
    } else {
      setPhase("error");
      setError(result.error || "Transaction failed");
    }
  }, [xdrs, signFlow]);

  // Show ExecutionCard during/after signing
  if (phase === "signing" || phase === "done" || phase === "error") {
    const latestResult = stepResults[currentStep] || stepResults[stepResults.length - 1];
    return (
      <ExecutionCard
        step={currentStep}
        totalSteps={totalSteps || xdrs.length}
        status={
          phase === "done"
            ? "confirmed"
            : phase === "error"
              ? "failed"
              : isSubmitting
                ? "submitting"
                : ("submitting" as TxStatus)
        }
        txHash={latestResult?.txHash}
        error={error}
      />
    );
  }

  // Show PlanPreviewCard
  return (
    <PlanPreviewCard
      plan={plan as any}
      simulationReport={simulationReport as any}
      onConfirm={handleConfirm}
      onCancel={() => {}}
    />
  );
}

export const FLOW_TOOL_RENDERERS: Array<{
  toolName: string;
  render: (props: RenderProps) => React.ReactElement;
}> = [
  // parse_user_intent: no custom card — shows ToolStatusDispatcher (spinner/check)
  {
    toolName: "flow_clarify",
    render: (props) => {
      const data = parseFlowResult(props.result);

      // Log for debugging — remove once the card rendering is stable
      if (!data) {
        console.warn(
          "[flow_clarify] parseFlowResult returned null. props.result:",
          typeof props.result,
          props.result
        );
      }

      // Error response from backend (tool threw an exception)
      if (data?.kind === "error") {
        return (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {(data.message as string) || "Failed to load options"}
          </div>
        );
      }

      if (!data) {
        // If result is a plain error string (from LangGraph handle_tool_errors),
        // show it as an error instead of generic "Invalid clarify data".
        const errorText =
          typeof props.result === "string"
            ? props.result
            : typeof props.result === "object" && props.result !== null
              ? JSON.stringify(props.result)
              : null;
        if (errorText && errorText.length > 0 && errorText.length < 500) {
          return (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
              {errorText}
            </div>
          );
        }
        return <div className="text-muted-foreground text-xs">Invalid clarify data</div>;
      }

      // Normalize: support both old format {question, suggestions} and new {questions: [...]}
      let questions = data.questions as any[] | undefined;
      if (!questions && data.question) {
        // Old single-question format → wrap into questions array
        questions = [
          {
            field_name: "q0",
            question: data.question as string,
            input_type: "select",
            suggestions: (data.suggestions as any[]) ?? [],
          },
        ];
      }
      if (!questions || questions.length === 0) {
        return <div className="text-muted-foreground text-xs">No questions</div>;
      }

      const context = (data._context ?? {}) as Record<string, unknown>;
      return (
        <FlowClarifyCardWithStream
          questions={questions}
          context={context}
          toolCallId={props.toolCallId}
        />
      );
    },
  },
  {
    toolName: "flow_plan_preview",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data?.plan) {
        return <div className="text-muted-foreground text-xs">Invalid plan data</div>;
      }
      return (
        <PlanPreviewCard
          plan={data.plan as any}
          simulationReport={data.simulation_report as any}
          onConfirm={() => props.respond?.({ kind: "plan_confirm", action: "confirm" })}
          onCancel={() => props.respond?.({ kind: "plan_cancel", action: "cancel" })}
        />
      );
    },
  },
  {
    toolName: "flow_compose_plan",
    render: (props) => {
      // compose_plan auto-chains to flow_execute_plan internally.
      // While the tool is running (no result yet), show a progress indicator.
      // Once complete, the result is tx_ready — same shape as flow_compose_and_execute.
      const data = parseFlowResult(props.result);
      if (!data) {
        return (
          <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground text-sm">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Composing plan...
          </div>
        );
      }
      if (data.kind === "error") {
        // Show user-friendly error instead of raw contract/simulation errors
        const rawMessage = (data.message as string) || "Transaction failed";
        const friendlyMessage = simplifyErrorMessage(rawMessage);
        return (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {friendlyMessage}
          </div>
        );
      }
      if (data.kind === "cross_chain_plan" || data.kind === "plan_preview") {
        return (
          <FlowPlanWithSigning
            plan={(data.plan as Record<string, unknown>) || {}}
            simulationReport={data.simulation_report as Record<string, unknown>}
          />
        );
      }
      if (data.multi_step && Array.isArray(data.steps)) {
        const multiSteps = data.steps as Record<string, unknown>[];
        const multiCard = (
          <FlowPlanWithSigning
            plan={{
              steps: multiSteps.map((s, i) => ({
                index: i,
                action: s.action as string,
                protocol: s.protocol as string,
                description: s.description as string,
                asset: (s.asset as string) ?? (s.assetCode as string),
              })),
            }}
            simulationReport={{
              xdrs: multiSteps.map((s) => s.xdr as string).filter(Boolean),
            }}
          />
        );
        const stopText2 = data._stop_text as string | undefined;
        if (stopText2) {
          return (
            <div>
              {multiCard}
              <div className="mt-2 text-center text-muted-foreground text-xs">{stopText2}</div>
            </div>
          );
        }
        return multiCard;
      }
      const card = EXECUTE_DISPATCHER.render({
        ...props,
        result: data,
        args: {
          ...(props.args as Record<string, unknown>),
          protocol: data.protocol as string,
          action: data.action as string,
        },
      });
      const stopText = data._stop_text as string | undefined;
      if (stopText) {
        return (
          <div>
            {card}
            <div className="mt-2 text-center text-muted-foreground text-xs">{stopText}</div>
          </div>
        );
      }
      return card;
    },
  },
  {
    toolName: "flow_compose_and_execute",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data) {
        return <div className="text-muted-foreground text-xs">No transaction data</div>;
      }
      // Error response
      if (data.kind === "error") {
        const rawMessage = (data.message as string) || "Transaction failed";
        const friendlyMessage = simplifyErrorMessage(rawMessage);
        return (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-destructive text-sm">
            {friendlyMessage}
          </div>
        );
      }
      // Cross-chain plan — keep PlanPreviewCard (multi-step, future work)
      if (data.kind === "cross_chain_plan" || data.kind === "plan_preview") {
        return (
          <FlowPlanWithSigning
            plan={(data.plan as Record<string, unknown>) || {}}
            simulationReport={data.simulation_report as Record<string, unknown>}
          />
        );
      }
      // Multi-step TX (e.g. trustline + main operation) — render each step
      // sequentially. The first step (trustline) renders as TrustlineExecuteCard,
      // subsequent steps render via EXECUTE_DISPATCHER.
      if (data.multi_step && Array.isArray(data.steps)) {
        const multiSteps = data.steps as Record<string, unknown>[];
        return (
          <FlowPlanWithSigning
            plan={{
              steps: multiSteps.map((s, i) => ({
                index: i,
                action: s.action as string,
                protocol: s.protocol as string,
                description: s.description as string,
                asset: (s.asset as string) ?? (s.assetCode as string),
              })),
            }}
            simulationReport={{
              xdrs: multiSteps.map((s) => s.xdr as string).filter(Boolean),
            }}
          />
        );
      }
      // Single TX (kind=tx_ready) — route to protocol-specific card
      // via the same EXECUTE_DISPATCHER used by the `execute` MCP tool.
      const card2 = EXECUTE_DISPATCHER.render({
        ...props,
        result: data,
        args: {
          ...(props.args as Record<string, unknown>),
          protocol: data.protocol as string,
          action: data.action as string,
        },
      });
      const stop2 = data._stop_text as string | undefined;
      if (stop2) {
        return (
          <div>
            {card2}
            <div className="mt-2 text-center text-muted-foreground text-xs">{stop2}</div>
          </div>
        );
      }
      return card2;
    },
  },
  {
    toolName: "flow_execution_update",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data) return <div className="text-muted-foreground text-xs">No execution data</div>;
      return (
        <ExecutionCard
          step={(data.step as number) ?? 0}
          totalSteps={(data.total_steps as number) ?? 1}
          status={((data.status as string) ?? "submitting") as TxStatus}
          txHash={data.tx_hash as string}
          description={data.description as string}
          error={data.error as string}
        />
      );
    },
  },
  {
    toolName: "flow_check_account_status",
    render: (props) => {
      const data = parseFlowResult(props.result);
      return <AccountSetupCard result={data ?? props.result} />;
    },
  },
];

// ---------------------------------------------------------------------------
// Tool rendering is handled directly by `ToolCallRenderer`
// in `tool-call-renderer.tsx` using the data arrays exported above.
// ---------------------------------------------------------------------------
