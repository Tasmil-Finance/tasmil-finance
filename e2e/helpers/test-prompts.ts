import type { CardType } from "../page-objects/chat.page";

// =============================================================================
// Types — precise test expectations for each protocol action
// =============================================================================

export interface ToolCallExpectation {
  /** MCP tool name or flow tool name expected in LangSmith trace. */
  name: string;
  /** Key args the tool should be called with (partial match). */
  expectedArgs?: Record<string, unknown>;
  /** Order in which this tool should be called (0-indexed). */
  order: number;
}

export interface SigningCardExpectation {
  /** The card type that should appear for the user to sign. */
  cardType: CardType;
  /** Key fields visible on the signing card. */
  visibleFields: {
    /** Amount shown (human-readable, e.g. "100", "5"). */
    amount?: string;
    /** Asset/token symbol shown (e.g. "USDC", "XLM"). */
    asset?: string;
    /** Protocol name shown (e.g. "Blend", "Soroswap"). */
    protocol?: string;
    /** Operation label (e.g. "Supply", "Swap", "Borrow"). */
    operation?: string;
    /** "You send" token (swaps). */
    tokenIn?: string;
    /** "You receive" token (swaps). */
    tokenOut?: string;
    /** Any additional text fragments that must appear. */
    textContains?: string[];
  };
  /** Whether a "Sign" / "Confirm" button should be present. */
  hasSignButton: boolean;
  /** Whether XDR data should be present in the card result. */
  hasXdr: boolean;
}

export interface BehaviorExpectation {
  /** The AI flow sequence — what tools are called in order. */
  toolCallChain: ToolCallExpectation[];
  /** Whether the AI should call flow_clarify (ambiguous request). */
  shouldClarify: boolean;
  /** Whether the AI should show a signing card at the end. */
  shouldShowSigningCard: boolean;
  /** Whether the AI should stop after showing the card (no extra tools). */
  shouldStopAfterCard: boolean;
  /** Whether get_account should be called for balance check. */
  shouldCheckBalance: boolean;
  /** Whether discover should be called for pool/route discovery. */
  shouldDiscover: boolean;
  /** Whether the AI delegates to a sub-agent (call_*_agent). */
  delegatesToAgent?: string;
  /** Whether the response should be text-only (info queries). */
  textOnlyResponse?: boolean;
}

export interface ProtocolTestCase {
  /** Human message to send to the AI chat. */
  prompt: string;
  /** Primary card expected to render at the end. */
  expectedCard: CardType;
  /** Acceptable intermediate/alternative cards. */
  acceptableCards?: CardType[];
  /** Signing card expectations (for execute flows). */
  signingCard?: SigningCardExpectation;
  /** Expected AI behavior — tool call chain, flow sequence. */
  behavior: BehaviorExpectation;
  /** Key text fragments that should be visible somewhere in the response. */
  assertions: {
    amountVisible?: string;
    assetVisible?: string;
    protocolVisible?: string;
    textContains?: string[];
  };
}

export interface ProtocolSuite {
  [action: string]: ProtocolTestCase;
}

// =============================================================================
// BLEND LENDING PROTOCOL
//
// Flow: parse_user_intent → get_account (balance check) → discover (pool data)
//       → flow_clarify (if pool ambiguous) → flow_compose_plan (auto-executes)
//       → EXECUTE_DISPATCHER renders BlendTxCard or StellarExecuteCard
//
// Registry keys: blend.supply, blend.withdraw, blend.borrow, blend.repay,
//                blend.claim_emissions, blend.toggle_collateral
// MCP tool: "execute" with action=supply/withdraw/borrow/repay/claim_emissions/toggle_collateral, protocol=blend
// Card: flow_compose_plan → EXECUTE_DISPATCHER → BlendTxCard (supply/withdraw/borrow/repay/claim)
//        or StellarExecuteCard (generic fallback)
// =============================================================================
export const BLEND_TESTS: ProtocolSuite = {
  supply: {
    prompt: "Supply 5 XLM to Blend lending pool",
    // Blend has multiple XLM pools (Fixed Pool, Etherfuse Pool) so AI will
    // show ClarifyCard first to let user pick. After selection → compose → sign.
    expectedCard: "card-clarify",
    acceptableCards: ["card-stellar-execute", "card-blend-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "5",
        asset: "XLM",
        protocol: "Blend",
        operation: "Supply",
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "deposit_for_yield", protocol: "blend", assets: ["XLM"] },
        },
        { name: "get_account", order: 1 },
        { name: "discover", order: 2, expectedArgs: { category: "earn" } },
        { name: "flow_clarify", order: 3 },
      ],
      shouldClarify: true,
      shouldShowSigningCard: false,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: true,
    },
    assertions: { assetVisible: "XLM", protocolVisible: "Blend" },
  },
  withdraw: {
    prompt: "Withdraw 3 XLM from Blend lending",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-blend-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "3",
        asset: "XLM",
        operation: "Withdraw",
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "withdraw", protocol: "blend" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "withdraw", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "3", assetVisible: "XLM" },
  },
  borrow: {
    prompt: "Borrow 2 XLM from Blend using my collateral",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-blend-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "2",
        asset: "XLM",
        operation: "Borrow",
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "borrow", protocol: "blend" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "borrow", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "2", assetVisible: "XLM" },
  },
  repay: {
    prompt: "Repay 2 XLM loan on Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-blend-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "2",
        asset: "XLM",
        operation: "Repay",
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "repay", protocol: "blend" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "repay", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "2", assetVisible: "XLM" },
  },
  claim_emissions: {
    prompt: "Claim my BLND emissions from Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-blend-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        asset: "BLND",
        operation: "Claim",
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "claim_emissions", protocol: "blend" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "claim_emissions", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { assetVisible: "BLND" },
  },
  toggle_collateral: {
    prompt: "Enable XLM as collateral on Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-blend-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        asset: "XLM",
        textContains: ["Collateral"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "toggle_collateral", protocol: "blend" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "toggle_collateral", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { assetVisible: "XLM" },
  },
};

// =============================================================================
// BLEND BACKSTOP
//
// Same flow as Blend lending but with backstop-specific actions.
// Registry: blend.backstop_deposit, blend.backstop_queue_withdrawal, etc.
// MCP tool: "execute" with action=backstop_deposit/backstop_queue_withdrawal/etc., protocol=blend
// =============================================================================
export const BLEND_BACKSTOP_TESTS: ProtocolSuite = {
  backstop_deposit: {
    prompt: "Deposit to Blend backstop",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-blend-tx"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "backstop_deposit", protocol: "blend" },
        },
        { name: "get_account", order: 1 },
        { name: "flow_clarify", order: 2 },
      ],
      shouldClarify: true,
      shouldShowSigningCard: false,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { protocolVisible: "Blend" },
  },
  backstop_queue_withdrawal: {
    prompt: "Queue withdrawal of my Blend backstop position",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "backstop_queue_withdrawal" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "backstop_queue_withdrawal", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
  backstop_dequeue_withdrawal: {
    prompt: "Cancel my queued backstop withdrawal on Blend",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "backstop_dequeue_withdrawal" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "backstop_dequeue_withdrawal", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
  backstop_withdraw: {
    prompt: "Withdraw my unlocked Blend backstop position",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "backstop_withdraw" } },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "backstop_withdraw", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
  join_comet_pool: {
    prompt: "Join the Comet 80/20 BLND-USDC pool with 5 BLND",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "join_comet_pool" } },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "join_comet_pool", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { textContains: ["Comet"] },
  },
  exit_comet_pool: {
    prompt: "Exit the Comet BLND-USDC pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "exit_comet_pool" } },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "exit_comet_pool", protocol: "blend" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { textContains: ["Comet"] },
  },
};

// =============================================================================
// SOROSWAP DEX
//
// Swap flow: parse_user_intent → get_account → flow_compose_plan(action=swap, protocol=soroswap)
//   → execute(action=swap, protocol=soroswap, tokenIn, tokenOut, amount)
//   → EXECUTE_DISPATCHER → SwapExecuteCard (action=swap → swap branch)
//
// LP flow: parse_user_intent → get_account → discover → flow_compose_plan
//   → execute(action=add_liquidity/remove_liquidity, protocol=soroswap)
//   → EXECUTE_DISPATCHER → StellarExecuteCard (fallback)
// =============================================================================
export const SOROSWAP_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Swap 2 XLM to USDC on Soroswap",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    signingCard: {
      cardType: "card-swap-execute",
      visibleFields: {
        tokenIn: "XLM",
        tokenOut: "USDC",
        amount: "2",
        textContains: ["You send", "You receive", "Sign"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "swap", assets: ["XLM", "USDC"] },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "swap", protocol: "soroswap" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "2", assetVisible: "XLM" },
  },
  add_liquidity: {
    prompt: "Add liquidity to Soroswap XLM/USDC pool with 2 XLM",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "2",
        textContains: ["Liquidity"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "add_liquidity", protocol: "soroswap" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "add_liquidity", protocol: "soroswap" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "2" },
  },
  remove_liquidity: {
    prompt: "Remove my liquidity from Soroswap XLM/USDC pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "remove_liquidity", protocol: "soroswap" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "remove_liquidity", protocol: "soroswap" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
};

// =============================================================================
// SDEX (Stellar Classic DEX)
//
// Swap flow: parse_user_intent → get_account → flow_compose_plan(action=swap, protocol=sdex)
//   → execute(action=swap, protocol=sdex, tokenIn, tokenOut, amount)
//   → EXECUTE_DISPATCHER → SwapExecuteCard
//
// NOTE: SDEX may intermittently delegate to call_sdex_agent instead of using
// flow tools. When it uses flow tools, the card renders correctly.
// When it delegates to sdex_agent, the sub-agent calls sdex_swap directly
// which renders via OPERATION_TOOL_RENDERERS → StellarExecuteCard.
// =============================================================================
export const SDEX_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Buy 1 USDC with XLM on the Stellar DEX",
    // SDEX has an intermittent rendering issue. When the AI uses flow tools
    // (flow_compose_plan), the SwapExecuteCard renders correctly.
    // When it delegates to call_sdex_agent, the sub-agent response sometimes
    // fails to render (AG-UI streaming issue with nested agent responses).
    // The "1 Issue" badge may appear in the latter case.
    expectedCard: "card-swap-execute",
    acceptableCards: [
      "card-stellar-execute",
      "card-clarify",
      "card-account-info",
      "card-earn-discovery",
    ],
    signingCard: {
      cardType: "card-swap-execute",
      visibleFields: {
        tokenIn: "XLM",
        tokenOut: "USDC",
        textContains: ["You send", "You receive", "Sign"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "swap", protocol: "sdex" } },
        { name: "get_account", order: 1 },
        { name: "flow_compose_plan", order: 2, expectedArgs: { action: "swap", protocol: "sdex" } },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
      // Often delegates to call_sdex_agent instead of using flow tools
      delegatesToAgent: "sdex",
    },
    assertions: { assetVisible: "USDC" },
  },
};

// =============================================================================
// PHOENIX DEX
//
// Swap flow: parse_user_intent → get_account → flow_compose_plan(action=swap, protocol=phoenix)
//   → execute(action=swap, protocol=phoenix, tokenIn, tokenOut, amount)
//   → EXECUTE_DISPATCHER → SwapExecuteCard
//   Phoenix execute-swap-logic.ts calls simulateSwap() to get amountOut.
//
// LP flow: Same as Soroswap LP pattern.
// =============================================================================
export const PHOENIX_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Swap 2 XLM to USDC on Phoenix",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    signingCard: {
      cardType: "card-swap-execute",
      visibleFields: {
        tokenIn: "XLM",
        tokenOut: "USDC",
        amount: "2",
        textContains: ["You send", "You receive", "Sign"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "swap", protocol: "phoenix" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "swap", protocol: "phoenix" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "2", assetVisible: "XLM" },
  },
  // Phoenix LP/staking tests removed — only swap matters
};

// =============================================================================
// AQUARIUS AMM
//
// Swap: flow_compose_plan → execute(action=swap, protocol=aquarius) → SwapExecuteCard
// LP: flow_compose_plan → execute(action=add_liquidity, protocol=aquarius) → AquaTxCard
// Claim: flow_compose_plan → execute(action=claim_rewards, protocol=aquarius) → AquaTxCard
// Lock: flow_compose_plan → execute(action=lock_aqua, protocol=aquarius) → StellarExecuteCard
// =============================================================================
export const AQUARIUS_TESTS: ProtocolSuite = {
  add_liquidity: {
    prompt: "Add 2 XLM to Aquarius XLM/USDC pool",
    // Aquarius XLM/USDC is a constant product pool — requires BOTH XLM and USDC.
    // If the wallet has 0 USDC (our test wallet), the AI will check balance,
    // find insufficient USDC, and suggest swapping XLM for USDC first.
    // This is CORRECT behavior — the AI should not build a TX that will fail.
    expectedCard: "card-account-info",
    acceptableCards: ["card-stellar-execute", "card-clarify", "card-aqua-tx"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "add_liquidity", protocol: "aquarius" },
        },
        { name: "get_account", order: 1 },
        // AI may call resolve_pool, then get_account, then respond with text
        // explaining the user needs USDC too. No signing card expected.
      ],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { assetVisible: "XLM" },
  },
  remove_liquidity: {
    prompt: "Remove my liquidity from Aquarius USDC/XLM pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-aqua-tx"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "remove_liquidity", protocol: "aquarius" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "remove_liquidity", protocol: "aquarius" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
  swap: {
    prompt: "Swap 2 XLM to USDC on Aquarius",
    expectedCard: "card-swap-execute",
    acceptableCards: ["card-stellar-execute", "card-clarify", "card-aqua-tx"],
    signingCard: {
      cardType: "card-swap-execute",
      visibleFields: {
        tokenIn: "XLM",
        tokenOut: "USDC",
        amount: "2",
        textContains: ["You send", "You receive"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "swap", protocol: "aquarius" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "swap", protocol: "aquarius" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "2", assetVisible: "XLM" },
  },
  claim_rewards: {
    prompt: "Claim my AQUA rewards",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify", "card-aqua-tx"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        asset: "AQUA",
        textContains: ["Claim"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "claim_emissions" } },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "claim_rewards", protocol: "aquarius" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { assetVisible: "AQUA" },
  },
  lock_aqua: {
    prompt: "Lock 5 AQUA for ICE voting power",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "5",
        asset: "AQUA",
        textContains: ["Lock"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "lock_aqua" } },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "lock_aqua", protocol: "aquarius" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "5", assetVisible: "AQUA" },
  },
};

// =============================================================================
// ALLBRIDGE (Cross-chain Bridge)
//
// Flow: parse_user_intent → get_account → flow_compose_plan(action=bridge)
//   → execute(action=bridge, protocol=allbridge)
//   → EXECUTE_DISPATCHER → bridge branch:
//     - If Stellar source + has XDR → SwapExecuteCard (adapted)
//     - If EVM source or deposit-pattern → BridgeExecuteCard
// =============================================================================
export const ALLBRIDGE_TESTS: ProtocolSuite = {
  bridge: {
    prompt: "Bridge 100 USDC from Ethereum to Stellar",
    // Realistic inbound bridge: user has USDC on ETH, wants it on Stellar.
    // AI will check bridge_get_routes for ETH→Stellar USDC, get quotes,
    // and show bridge discovery card with route options.
    expectedCard: "card-bridge-discovery",
    acceptableCards: [
      "card-stellar-execute",
      "card-swap-execute",
      "card-bridge-execute",
      "card-clarify",
    ],
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "bridge" } },
        { name: "bridge_get_routes", order: 1 },
      ],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: { textContains: ["USDC"] },
  },
};

// =============================================================================
// DEFINDEX VAULTS
//
// Flow: parse_user_intent → get_account → discover (vault list)
//   → flow_clarify (vault selection) OR flow_compose_plan
//   → execute(action=vault_deposit/vault_withdraw, protocol=defindex)
//   → EXECUTE_DISPATCHER → StellarExecuteCard (fallback)
// =============================================================================
export const DEFINDEX_TESTS: ProtocolSuite = {
  deposit: {
    prompt: "Deposit 2 XLM into DeFindex vault",
    // DeFindex vaults are all USDC/EURC — no XLM vaults exist.
    // The AI will discover vaults, find none for XLM, then show
    // an EarnDiscoveryCard listing available USDC/EURC vaults
    // and suggest alternatives (swap XLM→USDC first, or Aquarius LP).
    // This is CORRECT behavior.
    expectedCard: "card-earn-discovery",
    acceptableCards: ["card-stellar-execute", "card-clarify"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "deposit_for_yield", protocol: "defindex" },
        },
        { name: "discover", order: 1 },
        { name: "resolve_pool", order: 2 },
      ],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: true,
      shouldDiscover: true,
    },
    assertions: { assetVisible: "XLM" },
  },
  withdraw: {
    prompt: "Withdraw my position from DeFindex vault",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "withdraw", protocol: "defindex" },
        },
        { name: "get_account", order: 1 },
        { name: "flow_compose_plan", order: 2, expectedArgs: { protocol: "defindex" } },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
};

// =============================================================================
// TASMIL MANAGED STRATEGIES
//
// Tasmil has a unique multi-step onboarding flow:
//   1. flow_check_account_status → determines next_step
//   2. Based on next_step: deploy_smart_account / setup_smart_account / fund_smart_account
//   3. Each step produces a signing card (AccountSetupCard)
//
// For presets: get_strategy_presets → StrategyPresetCard
// For status: get_account_strategy → AccountStrategyCard
//
// These tools are in supervisor_agent's tool permissions (tool_permissions.py).
// They are NOT routed through flow_compose_plan — they call MCP tools directly.
// =============================================================================
export const TASMIL_TESTS: ProtocolSuite = {
  check_presets: {
    prompt: "What Tasmil strategy presets are available?",
    // The AI first calls flow_check_account_status to see if user has
    // a smart account. If no account exists (our test wallet), it shows
    // AccountSetupCard (4-step onboarding wizard) + preset descriptions.
    // If account exists, it shows StrategyPresetCard or AccountStrategyCard.
    expectedCard: "card-account-setup",
    acceptableCards: ["card-strategy-preset", "card-account-strategy"],
    behavior: {
      toolCallChain: [
        { name: "flow_check_account_status", order: 0 },
        { name: "get_strategy_presets", order: 1 },
      ],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
      textOnlyResponse: false,
    },
    assertions: { textContains: ["Safe", "Balanced", "Aggressive"] },
  },
  check_account: {
    prompt: "What is my Tasmil account status?",
    expectedCard: "card-account-setup",
    acceptableCards: ["card-account-strategy"],
    behavior: {
      toolCallChain: [{ name: "flow_check_account_status", order: 0 }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: { textContains: ["account"] },
  },
};

// =============================================================================
// INFO / QUERY FLOWS
//
// Info queries DON'T produce signing cards. They produce:
// - AccountInfoCard (get_account) — balance, positions
// - Text response (call_info_agent / call_research_agent)
// - EarnDiscoveryCard (discover) — yield pool listings
//
// The supervisor either:
// 1. Calls get_account directly (for balance queries)
// 2. Delegates to call_info_agent (for general info)
// 3. Delegates to call_research_agent (for market data)
// =============================================================================
export const INFO_TESTS: ProtocolSuite = {
  account_balance: {
    prompt: "Show my account balance",
    expectedCard: "card-account-info",
    acceptableCards: [],
    behavior: {
      toolCallChain: [{ name: "get_account", order: 0 }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: true,
      shouldDiscover: false,
      textOnlyResponse: false,
    },
    assertions: { textContains: ["XLM"] },
  },
  yield_discovery: {
    prompt: "Show me the best yield opportunities on Stellar",
    expectedCard: "card-strategy-preset",
    acceptableCards: ["card-earn-discovery", "card-clarify", "card-account-strategy"],
    behavior: {
      toolCallChain: [{ name: "discover", order: 0, expectedArgs: { category: "earn" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: true,
      textOnlyResponse: false,
    },
    assertions: { textContains: ["yield"] },
  },
};

// =============================================================================
// CLARIFY FLOWS — ambiguous prompts that require user input
//
// When the user doesn't specify protocol/pool/amount, the AI should:
// 1. parse_user_intent → routing_hint: "needs_clarify"
// 2. get_account (balance check)
// 3. discover (pool data for suggestions)
// 4. flow_clarify → ClarifyCard with pool options + amount input
// 5. STOP — wait for user selection
//
// ClarifyCard shows:
// - Pool suggestions (sorted by APY, tagged "recommended")
// - Amount input field
// - Tasmil presets if applicable (tagged "managed")
// =============================================================================
export const CLARIFY_FLOW_TESTS: ProtocolSuite = {
  ambiguous_earn: {
    prompt: "I want to earn yield with my USDC",
    expectedCard: "card-clarify",
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "deposit_for_yield", assets: ["USDC"] },
        },
        { name: "get_account", order: 1 },
        { name: "discover", order: 2, expectedArgs: { category: "earn" } },
        { name: "flow_clarify", order: 3 },
      ],
      shouldClarify: true,
      shouldShowSigningCard: false,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: true,
    },
    assertions: { textContains: ["pool", "APY"] },
  },
  ambiguous_swap: {
    prompt: "Swap some XLM",
    expectedCard: "card-clarify",
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0, expectedArgs: { action: "swap" } },
        { name: "flow_clarify", order: 1 },
      ],
      shouldClarify: true,
      shouldShowSigningCard: false,
      shouldStopAfterCard: true,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: {},
  },
};

// =============================================================================
// TEMPLAR (Cross-Chain Lending via NEAR)
//
// Templar uses NEAR protocol for cross-chain lending. Operations:
//   swap_execute — swap via Templar's NEAR-based DEX
//   supply — deposit collateral into Templar lending market
//   borrow — borrow against deposited collateral
//
// Flow: parse_user_intent → get_account → flow_compose_plan
//   → execute(action=swap/supply/borrow, protocol=templar, marketId=...)
//   → EXECUTE_DISPATCHER → StellarExecuteCard (deposit-address pattern)
//
// MCP tool: "execute" with protocol=templar
// Templar is always mainnet (NEAR). marketId = "ixlm-ixlmusdc.v1.tmplr.near"
// =============================================================================
export const TEMPLAR_TESTS: ProtocolSuite = {
  swap: {
    prompt: "Swap 2 XLM to USDC on Templar",
    // Templar is a cross-chain LENDING protocol, not a DEX.
    // The AI correctly identifies this and redirects to Soroswap/SDEX/Phoenix.
    // It shows a comparison table of swap routes from other DEXs.
    expectedCard: "card-account-info",
    acceptableCards: [
      "card-swap-execute",
      "card-stellar-execute",
      "card-earn-discovery",
      "card-clarify",
    ],
    behavior: {
      toolCallChain: [
        { name: "parse_user_intent", order: 0 },
        { name: "get_account", order: 1 },
        { name: "resolve_pool", order: 2 },
      ],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { assetVisible: "XLM", textContains: ["Templar"] },
  },
};

// Phoenix LP/staking tests removed per user request — only swap matters

// =============================================================================
// ALLBRIDGE LP (Liquidity Provider tools — separate from bridge)
//
// Allbridge allows LPs to deposit into bridge liquidity pools.
// Operations: pool_deposit, pool_withdraw, pool_claim_rewards
//
// Flow: parse_user_intent → get_account → flow_compose_plan
//   → execute(action=add_liquidity/remove_liquidity/claim_rewards, protocol=allbridge)
// =============================================================================
export const ALLBRIDGE_LP_TESTS: ProtocolSuite = {
  pool_deposit: {
    prompt: "Deposit 10 USDC into Allbridge liquidity pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        amount: "10",
        asset: "USDC",
        textContains: ["Allbridge"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "add_liquidity", protocol: "allbridge" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "add_liquidity", protocol: "allbridge" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { amountVisible: "10", assetVisible: "USDC" },
  },
  pool_withdraw: {
    prompt: "Withdraw my USDC from Allbridge LP pool",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "remove_liquidity", protocol: "allbridge" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "remove_liquidity", protocol: "allbridge" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
  pool_claim_rewards: {
    prompt: "Claim rewards from my Allbridge LP position",
    expectedCard: "card-stellar-execute",
    acceptableCards: ["card-clarify"],
    signingCard: {
      cardType: "card-stellar-execute",
      visibleFields: {
        textContains: ["Claim", "Allbridge"],
      },
      hasSignButton: true,
      hasXdr: true,
    },
    behavior: {
      toolCallChain: [
        {
          name: "parse_user_intent",
          order: 0,
          expectedArgs: { action: "claim_rewards", protocol: "allbridge" },
        },
        { name: "get_account", order: 1 },
        {
          name: "flow_compose_plan",
          order: 2,
          expectedArgs: { action: "claim_rewards", protocol: "allbridge" },
        },
      ],
      shouldClarify: false,
      shouldShowSigningCard: true,
      shouldStopAfterCard: true,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
};

// =============================================================================
// UNIFIED TOOL TESTS — direct tool testing via AI prompts
//
// These test the 5 unified tools (discover, execute, get_account,
// get_pool_details, resolve_pool) through natural language prompts.
// The AI routes to the correct tool based on intent.
// =============================================================================
export const UNIFIED_TOOL_TESTS: ProtocolSuite = {
  // ─── discover: swap ─────────────────────────────────────────────
  discover_swap: {
    prompt: "Compare XLM to USDC swap rates across all DEXs",
    expectedCard: "card-earn-discovery",
    acceptableCards: ["card-clarify", "card-swap-execute"],
    behavior: {
      toolCallChain: [{ name: "discover", order: 0, expectedArgs: { category: "swap" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: true,
    },
    assertions: { textContains: ["XLM", "USDC"] },
  },
  // ─── discover: earn ─────────────────────────────────────────────
  discover_earn: {
    prompt: "Find the best yield opportunities for USDC on Stellar",
    expectedCard: "card-earn-discovery",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [{ name: "discover", order: 0, expectedArgs: { category: "earn" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: true,
    },
    assertions: { textContains: ["USDC"] },
  },
  // ─── discover: lending ──────────────────────────────────────────
  discover_lending: {
    prompt: "Show me all lending markets with their supply APY",
    expectedCard: "card-earn-discovery",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [{ name: "discover", order: 0, expectedArgs: { category: "lending" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: true,
    },
    assertions: { textContains: ["APY"] },
  },
  // ─── discover: bridge ───────────────────────────────────────────
  discover_bridge: {
    prompt: "Show me available bridge routes from Ethereum to Stellar",
    expectedCard: "card-bridge-discovery",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [{ name: "discover", order: 0, expectedArgs: { category: "bridge" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: true,
    },
    assertions: { textContains: ["bridge"] },
  },
  // ─── get_account: info ──────────────────────────────────────────
  get_account_info: {
    prompt: "Show my full account details including signers and thresholds",
    expectedCard: "card-account-info",
    acceptableCards: [],
    behavior: {
      toolCallChain: [{ name: "get_account", order: 0, expectedArgs: { query: "info" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: { textContains: ["XLM"] },
  },
  // ─── get_account: positions ─────────────────────────────────────
  get_account_positions: {
    prompt: "Show all my DeFi positions across Stellar protocols",
    expectedCard: "card-account-info",
    acceptableCards: [],
    behavior: {
      toolCallChain: [{ name: "get_account", order: 0, expectedArgs: { query: "positions" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: true,
      shouldDiscover: false,
    },
    assertions: {},
  },
  // ─── get_account: history ───────────────────────────────────────
  get_account_history: {
    prompt: "Show my recent transaction history",
    expectedCard: "card-account-info",
    acceptableCards: [],
    behavior: {
      toolCallChain: [{ name: "get_account", order: 0, expectedArgs: { query: "history" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: {},
  },
  // ─── get_pool_details: Blend ────────────────────────────────────
  pool_details_blend: {
    prompt: "Show me detailed info about the Blend Fixed Pool USDC reserve",
    expectedCard: "card-account-info",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [{ name: "get_pool_details", order: 0, expectedArgs: { protocol: "blend" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: { textContains: ["USDC"] },
  },
  // ─── get_pool_details: Phoenix ──────────────────────────────────
  pool_details_phoenix: {
    prompt: "Show me the Phoenix XLM/USDC pool details with reserves",
    expectedCard: "card-account-info",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [
        { name: "get_pool_details", order: 0, expectedArgs: { protocol: "phoenix" } },
      ],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: { textContains: ["XLM", "USDC"] },
  },
  // ─── resolve_pool: various protocols ────────────────────────────
  resolve_blend: {
    prompt: "What Blend pools are available and what are their reserve details?",
    expectedCard: "card-account-info",
    acceptableCards: ["card-clarify", "card-earn-discovery"],
    behavior: {
      toolCallChain: [{ name: "resolve_pool", order: 0, expectedArgs: { protocol: "blend" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: { textContains: ["Blend"] },
  },
  resolve_phoenix: {
    prompt: "Find the Phoenix pool for XLM and USDC pair",
    expectedCard: "card-account-info",
    acceptableCards: ["card-clarify"],
    behavior: {
      toolCallChain: [{ name: "resolve_pool", order: 0, expectedArgs: { protocol: "phoenix" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: { textContains: ["Phoenix"] },
  },
  resolve_defindex: {
    prompt: "List all DeFindex vaults on Stellar",
    expectedCard: "card-earn-discovery",
    acceptableCards: ["card-account-info", "card-clarify"],
    behavior: {
      toolCallChain: [{ name: "resolve_pool", order: 0, expectedArgs: { protocol: "defindex" } }],
      shouldClarify: false,
      shouldShowSigningCard: false,
      shouldStopAfterCard: false,
      shouldCheckBalance: false,
      shouldDiscover: false,
    },
    assertions: {},
  },
};

// =============================================================================
// AGGREGATED: All protocols in one map
// =============================================================================
export const ALL_PROTOCOL_TESTS = {
  blend: BLEND_TESTS,
  "blend-backstop": BLEND_BACKSTOP_TESTS,
  aquarius: AQUARIUS_TESTS,
  soroswap: SOROSWAP_TESTS,
  sdex: SDEX_TESTS,
  phoenix: PHOENIX_TESTS,
  templar: TEMPLAR_TESTS,
  allbridge: ALLBRIDGE_TESTS,
  "allbridge-lp": ALLBRIDGE_LP_TESTS,
  defindex: DEFINDEX_TESTS,
  tasmil: TASMIL_TESTS,
  info: INFO_TESTS,
  clarify: CLARIFY_FLOW_TESTS,
  unified: UNIFIED_TOOL_TESTS,
} as const;

// =============================================================================
// SMOKE TEST SUBSET — 10 quick tests (one per protocol), used for CI gate
// =============================================================================
export const SMOKE_TESTS: Record<string, ProtocolTestCase> = {
  "Blend: supply XLM": BLEND_TESTS.supply,
  "Soroswap: swap XLM→USDC": SOROSWAP_TESTS.swap,
  "SDEX: swap XLM→USDC": SDEX_TESTS.swap,
  "Phoenix: swap XLM→USDC": PHOENIX_TESTS.swap,
  "Aquarius: add liquidity": AQUARIUS_TESTS.add_liquidity,
  "Templar: swap XLM→USDC": TEMPLAR_TESTS.swap,
  "Allbridge: bridge USDC": ALLBRIDGE_TESTS.bridge,
  "DeFindex: deposit XLM": DEFINDEX_TESTS.deposit,
  "Tasmil: check presets": TASMIL_TESTS.check_presets,
  "Info: account balance": INFO_TESTS.account_balance,
  "Info: yield discovery": INFO_TESTS.yield_discovery,
};

// =============================================================================
// FULL PROTOCOL TESTS — all 50+ tests for comprehensive coverage
// Flatten ALL_PROTOCOL_TESTS into a single Record for full-suite runner
// =============================================================================
export const FULL_PROTOCOL_TESTS: Record<string, ProtocolTestCase> = (() => {
  const result: Record<string, ProtocolTestCase> = {};
  for (const [suiteName, suite] of Object.entries(ALL_PROTOCOL_TESTS)) {
    for (const [actionName, testCase] of Object.entries(suite)) {
      result[`${suiteName}: ${actionName}`] = testCase;
    }
  }
  return result;
})();
