"use client";

import { useCallback, useMemo, useState } from "react";
import type { TxStatus } from "@/features/chat/types/flow-messages";
import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { ActionSearchCard } from "@/features/chat/actions/components/stellar/action-search-card";
import { BridgeDiscoveryCard } from "@/features/chat/actions/components/stellar/bridge-discovery-card";
import { EarnDiscoveryCard } from "@/features/chat/actions/components/stellar/earn-discovery-card";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import { SwapQuoteCard } from "@/features/chat/actions/components/stellar/swap-quote-card";
import { TrustlineExecuteCard } from "@/features/chat/actions/components/stellar/trustline-execute-card";
import { TxSubmitCard } from "@/features/chat/actions/components/stellar/tx-submit-card";
import { ExecutionCard } from "@/features/chat/components/flow/execution-card";
// Flow cards (option-select pattern)
import { ClarifyCard } from "@/features/chat/components/flow/clarify-card";
import { PlanPreviewCard } from "@/features/chat/components/flow/plan-preview-card";
import { useStreamContext } from "@/features/chat/hooks/use-stream";
import { useFlowSigning } from "@/features/chat/hooks/use-flow-signing";
import { useWalletStore } from "@/store/use-wallet";
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
// Shared Aquarius protocol cards
import {
  AquaPoolsCard,
  AquaPoolDetailCard,
  AquaPositionsCard,
  AquaTxCard,
} from "@/features/protocols/cards/aquarius";
import {
  normalizeAquaPoolsFromMcp,
  normalizeAquaPoolFromMcp,
  normalizeAquaPositionsFromMcp,
  normalizeAquaTxFromMcp,
} from "@/features/protocols/adapters/aquarius-from-mcp";
import {
  normalizeSoroswapPoolsFromMcp,
} from "@/features/protocols/adapters/soroswap-from-mcp";
import { SoroswapPoolsCard } from "@/features/protocols/cards/soroswap";

/**
 * Tool renderer registries for DeFi MCP tools.
 *
 * These data arrays map tool names to UI components.  They are consumed by
 * `ToolCallRenderer` (in `tool-call-renderer.tsx`) which renders tool call
 * results from the message stream.
 */

// ---------------------------------------------------------------------------
// Helper to adapt CopilotKit render props to our card component props
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

  // DeFindex
  { toolName: "vault_get_status", type: "vault_info", component: PoolInfoCard },
  { toolName: "vault_get_user_shares", type: "user_shares", component: AccountInfoCard },
  { toolName: "vault_list_vaults", type: "vault_list", component: PoolInfoCard },

  // Yield / Research
  { toolName: "discover", type: "earn_discovery", component: EarnDiscoveryCard },

  // Unified compare tools (aggregated multi-protocol comparison)
  { toolName: "compare_swap", type: "swap_comparison", component: SwapQuoteCard },
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
  // Shared
  { toolName: "submit_transaction", operation: "tx_submit", component: TxSubmitCard },
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
        return <PoolInfoCard type="aquarius_pool_info" result={props.result} status={props.status} />;
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
      <AquaTxCard
        tx={txWithOp}
        mode="chat"
        toolCallId={props.toolCallId}
        respond={props.respond}
      />
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
  "add_liquidity", "remove_liquidity", "swap", "claim_rewards", "lock_aqua",
]);

export const EXECUTE_DISPATCHER = {
  toolName: "execute",
  render: (props: RenderProps) => {
    const { data } = unwrapMcpResult(props.result);
    const action = String((data as Record<string, unknown>)?.action ?? props.args?.action ?? "");
    const protocol = String((data as Record<string, unknown>)?.protocol ?? props.args?.protocol ?? "");

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
          status={props.status === "inProgress" ? "pending" : props.status === "complete" ? "complete" : "executing"}
          respond={props.respond}
        />
      );
    }

    // Fallback — generic execute card for swaps, bridges, other protocols
    return (
      <StellarExecuteCard
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

/** Try to find a clarify_response message in the stream to restore selection state. */
function usePreviousClarifyResponse(
  questions: { field_name: string; input_type: string; suggestions?: { label: string; value: Record<string, unknown> }[] }[],
) {
  const stream = useStreamContext();
  return useMemo(() => {
    // Scan messages for a human message containing clarify_response JSON
    for (const m of (stream.messages ?? [])) {
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
            // Find which suggestion matches the payload values
            const match = q.suggestions.find((s) =>
              Object.entries(s.value).every(([k, v]) => parsed[k] === v),
            );
            if (match) answers[q.field_name] = match.value;
          } else if (q.input_type === "text" && parsed[q.field_name]) {
            answers[q.field_name] = parsed[q.field_name];
          }
        }
        if (Object.keys(answers).length > 0) return answers;
      } catch {
        continue;
      }
    }
    return null;
  }, [stream.messages, questions]);
}

/** Unified ClarifyCard wrapper — handles both single and multi-question flows. */
function FlowClarifyCardWithStream({
  questions,
  context,
}: {
  questions: {
    field_name: string;
    question: string;
    input_type: "select" | "text";
    suggestions?: { label: string; value: Record<string, unknown>; tags?: string[]; description?: string }[];
    placeholder?: string;
  }[];
  context?: Record<string, unknown>;
}) {
  const stream = useStreamContext();
  const walletAddress = useWalletStore((s) => s.account);
  const previousAnswers = usePreviousClarifyResponse(questions);
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
    [stream, questions, context, sent, walletAddress],
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
  if (!result) return null;

  // Already an object with expected fields
  if (typeof result === "object" && !Array.isArray(result) && result !== null) {
    const obj = result as Record<string, unknown>;
    if ("kind" in obj || "question" in obj || "plan" in obj || "step" in obj) {
      return obj;
    }
  }

  // MCP content-block format: [{type:"text", text:"..."}]
  let raw = result;
  if (Array.isArray(result)) {
    const textBlock = (result as { type?: string; text?: string }[]).find(
      (b) => b?.type === "text" && typeof b?.text === "string"
    );
    if (textBlock?.text) raw = textBlock.text;
  }

  // String — parse JSON
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

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
      if (!data) {
        return <div className="text-muted-foreground text-xs">Invalid clarify data</div>;
      }

      // Normalize: support both old format {question, suggestions} and new {questions: [...]}
      let questions = data.questions as any[] | undefined;
      if (!questions && data.question) {
        // Old single-question format → wrap into questions array
        questions = [{
          field_name: "q0",
          question: data.question as string,
          input_type: "select",
          suggestions: (data.suggestions as any[]) ?? [],
        }];
      }
      if (!questions || questions.length === 0) {
        return <div className="text-muted-foreground text-xs">No questions</div>;
      }

      const context = (data._context ?? {}) as Record<string, unknown>;
      return <FlowClarifyCardWithStream questions={questions} context={context} />;
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
    toolName: "flow_compose_and_execute",
    render: (props) => {
      const data = parseFlowResult(props.result);
      if (!data) {
        return <div className="text-muted-foreground text-xs">No transaction data</div>;
      }
      // Error response
      if (data.kind === "error") {
        return (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {(data.message as string) || "Transaction failed"}
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
      // Single TX (kind=tx_ready) — route to protocol-specific card
      // via the same EXECUTE_DISPATCHER used by the `execute` MCP tool.
      return EXECUTE_DISPATCHER.render({
        ...props,
        result: data,
        args: {
          ...(props.args as Record<string, unknown>),
          protocol: data.protocol as string,
          action: data.action as string,
        },
      });
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
];

// ---------------------------------------------------------------------------
// Note: The `DefiToolRenderers` component (which used CopilotKit's
// `useRenderToolCall`) has been removed.  Tool rendering is now handled
// directly by `ToolCallRenderer` in `tool-call-renderer.tsx` using the
// data arrays exported above.
// ---------------------------------------------------------------------------

