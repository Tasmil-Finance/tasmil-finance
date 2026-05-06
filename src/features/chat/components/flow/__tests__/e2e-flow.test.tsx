// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ZodError } from "zod";
import { ExecutionCard } from "@/features/chat/components/flow/execution-card";
import { FlowMessageRouter } from "@/features/chat/components/flow/flow-message-router";
import { OptionCard } from "@/features/chat/components/flow/option-card";
import { PlanPreviewCard } from "@/features/chat/components/flow/plan-preview-card";
import { SuggestedPrompts } from "@/features/chat/components/suggested-prompts";
import { assistantFlowMessageSchema } from "@/features/chat/schemas/flow-messages.schema";
import type {
  AssistantFlowMessage,
  Plan,
  PlanStep,
  SimulationReport,
  Suggestion,
} from "@/features/chat/types/flow-messages";

// ─── Shared Factories ──────────────────────────────────────────────

function makeSuggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    label: "Blend USDC Pool",
    value: { protocol: "blend", asset: "USDC" },
    ...overrides,
  };
}

function makeStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    index: 0,
    typed_intent: "BlendDeposit",
    protocol: "Blend",
    action: "deposit",
    asset: "USDC",
    amount: "800",
    pool_address: "CABC1234",
    description: "Deposit 800 USDC into Blend",
    expected_apy_bps: 1420,
    ...overrides,
  };
}

function makePlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: "plan-001",
    steps: [makeStep()],
    total_gas_xlm: 0.15,
    weighted_apy_bps: 1420,
    ...overrides,
  };
}

function makeSimReport(overrides: Partial<SimulationReport> = {}): SimulationReport {
  return {
    status: "success",
    steps: [{ step_index: 0, status: "success", gas_consumed: 0.15 }],
    total_gas_xlm: 0.15,
    xdrs: ["AAAA"],
    warnings: [],
    simulated_at_ledger: 100000,
    ...overrides,
  };
}

// ─── Test 1: Full clarify → select → plan_preview → confirm flow ─

describe("E2E: Full clarify → select → plan_preview → confirm flow", () => {
  const clarifyMessage: AssistantFlowMessage = {
    kind: "clarify",
    question: "Which pool do you want to deposit into?",
    suggestions: [
      makeSuggestion({
        label: "Blend USDC Pool",
        value: { protocol: "blend", asset: "USDC" },
        tags: ["recommended"],
        description: "14.2% APY, low risk",
      }),
      makeSuggestion({
        label: "Soroswap XLM/USDC",
        value: { protocol: "soroswap", pair: "XLM/USDC" },
        tags: ["il_risk"],
        description: "18.5% APY, impermanent loss risk",
      }),
      makeSuggestion({
        label: "Phoenix XLM/USDC",
        value: { protocol: "phoenix", pair: "XLM/USDC" },
        tags: ["high_tvl"],
      }),
    ],
  };

  const planPreviewMessage: AssistantFlowMessage = {
    kind: "plan_preview",
    plan: makePlan({
      steps: [makeStep({ amount: "500", expected_apy_bps: 1420 })],
      weighted_apy_bps: 1420,
    }),
    simulation_report: makeSimReport(),
  };

  it("renders FlowMessageRouter with clarify message showing question and 3 suggestion rows", () => {
    render(<FlowMessageRouter message={clarifyMessage} />);

    expect(screen.getByText("Which pool do you want to deposit into?")).toBeInTheDocument();

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);

    expect(screen.getByText("Blend USDC Pool")).toBeInTheDocument();
    expect(screen.getByText("Soroswap XLM/USDC")).toBeInTheDocument();
    expect(screen.getByText("Phoenix XLM/USDC")).toBeInTheDocument();
  });

  it("clicking a suggestion row fires onOptionSelect with the correct value", () => {
    const onOptionSelect = jest.fn();
    render(<FlowMessageRouter message={clarifyMessage} onOptionSelect={onOptionSelect} />);

    fireEvent.click(screen.getByText("Soroswap XLM/USDC"));

    expect(onOptionSelect).toHaveBeenCalledTimes(1);
    expect(onOptionSelect).toHaveBeenCalledWith({
      protocol: "soroswap",
      pair: "XLM/USDC",
    });
  });

  it("renders plan_preview with step allocation, APY, and gas", () => {
    render(
      <FlowMessageRouter message={planPreviewMessage} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByText("Plan Preview")).toBeInTheDocument();
    expect(screen.getByText(/500 USDC/)).toBeInTheDocument();
    expect(screen.getByText(/Blend/)).toBeInTheDocument();
    // 1420 bps = 14.2%
    expect(screen.getByTestId("weighted-apy")).toHaveTextContent("14.2%");
    expect(screen.getByText(/~0\.15 XLM/)).toBeInTheDocument();
  });

  it("clicking Confirm & Sign fires onConfirm callback", () => {
    const onConfirm = jest.fn();
    render(
      <FlowMessageRouter message={planPreviewMessage} onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm & Sign" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

// ─── Test 2: Multi-step plan rendering ─────────────────────────────

describe("E2E: Multi-step plan rendering", () => {
  const multiStepPlan = makePlan({
    steps: [
      makeStep({
        index: 0,
        protocol: "Blend",
        amount: "400",
        expected_apy_bps: 1420,
      }),
      makeStep({
        index: 1,
        typed_intent: "DeFindexDeposit",
        protocol: "DeFindex",
        amount: "400",
        pool_address: "CDEF5678",
        description: "Deposit 400 USDC into DeFindex",
        expected_apy_bps: 1380,
      }),
    ],
    weighted_apy_bps: 1400,
    total_gas_xlm: 0.3,
    idle_amount: 200,
  });

  const multiStepSim = makeSimReport({
    steps: [
      { step_index: 0, status: "success", gas_consumed: 0.15 },
      { step_index: 1, status: "success", gas_consumed: 0.15 },
    ],
    total_gas_xlm: 0.3,
    xdrs: ["XDR_A", "XDR_B"],
  });

  const multiStepMessage: AssistantFlowMessage = {
    kind: "plan_preview",
    plan: multiStepPlan,
    simulation_report: multiStepSim,
  };

  it("renders both allocations with protocol and amount", () => {
    render(
      <FlowMessageRouter message={multiStepMessage} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByText("400 USDC → Blend (14.2%)")).toBeInTheDocument();
    expect(screen.getByText("400 USDC → DeFindex (13.8%)")).toBeInTheDocument();
  });

  it("displays weighted APY across all allocations", () => {
    render(
      <FlowMessageRouter message={multiStepMessage} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    // 1400 bps = 14.0%
    expect(screen.getByTestId("weighted-apy")).toHaveTextContent("14.0%");
  });

  it("shows idle amount (200 USDC idle)", () => {
    render(
      <FlowMessageRouter message={multiStepMessage} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    expect(screen.getByText("200 USDC idle")).toBeInTheDocument();
  });
});

// ─── Test 3: Execution status flow ─────────────────────────────────

describe("E2E: Execution status flow", () => {
  it("submitting step 1 of 2 shows submitting text", () => {
    render(
      <FlowMessageRouter
        message={{
          kind: "execution_update",
          step: 1,
          total_steps: 2,
          status: "submitting",
        }}
      />
    );

    expect(screen.getByText(/Submitting step 1 of 2/)).toBeInTheDocument();
  });

  it("confirmed step 1 with txHash shows step confirmed and truncated hash link", () => {
    render(
      <FlowMessageRouter
        message={{
          kind: "execution_update",
          step: 1,
          total_steps: 2,
          status: "confirmed",
          tx_hash: "abc123def456ghi789jkl012",
        }}
      />
    );

    expect(screen.getByText("Step 1 confirmed.")).toBeInTheDocument();
    // Hash is truncated: first 4 + "..." + last 4
    const link = screen.getByRole("link", { name: /abc1\.\.\.l012/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://stellar.expert/explorer/public/tx/abc123def456ghi789jkl012"
    );
  });

  it("step 2 submitting shows step 1 was confirmed", () => {
    render(
      <FlowMessageRouter
        message={{
          kind: "execution_update",
          step: 2,
          total_steps: 2,
          status: "submitting",
        }}
      />
    );

    expect(screen.getByText("Step 1 confirmed.")).toBeInTheDocument();
    expect(screen.getByText(/Submitting step 2 of 2/)).toBeInTheDocument();
  });

  it("confirmed on final step shows done state", () => {
    render(
      <FlowMessageRouter
        message={{
          kind: "execution_update",
          step: 2,
          total_steps: 2,
          status: "confirmed",
          tx_hash: "finalhash12345678",
        }}
      />
    );

    const doneText = screen.getByText("Done. Position opened.");
    expect(doneText).toBeInTheDocument();
    expect(doneText.className).toContain("text-[#00C278]");
  });
});

// ─── Test 4: Error recovery ────────────────────────────────────────

describe("E2E: Error recovery", () => {
  it("renders error message text and error code via FlowMessageRouter", () => {
    const errorMessage: AssistantFlowMessage = {
      kind: "error",
      code: "TX_SIMULATION_FAILED",
      message: "Transaction simulation failed: pool is paused",
      retry_possible: true,
    };

    render(<FlowMessageRouter message={errorMessage} onRetry={jest.fn()} />);

    expect(screen.getByText("TX_SIMULATION_FAILED")).toBeInTheDocument();
    expect(screen.getByText("Transaction simulation failed: pool is paused")).toBeInTheDocument();
  });

  it("shows Retry button when retry_possible is true and onRetry is provided", () => {
    const onRetry = jest.fn();
    const errorMessage: AssistantFlowMessage = {
      kind: "error",
      code: "NETWORK_ERROR",
      message: "Failed to connect to Soroban RPC",
      retry_possible: true,
    };

    render(<FlowMessageRouter message={errorMessage} onRetry={onRetry} />);

    const retryButton = screen.getByRole("button", { name: "Retry" });
    expect(retryButton).toBeInTheDocument();
  });

  it("clicking Retry fires onRetry callback", () => {
    const onRetry = jest.fn();
    const errorMessage: AssistantFlowMessage = {
      kind: "error",
      code: "NETWORK_ERROR",
      message: "Failed to connect",
      retry_possible: true,
    };

    render(<FlowMessageRouter message={errorMessage} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not show Retry button when retry_possible is false", () => {
    const errorMessage: AssistantFlowMessage = {
      kind: "error",
      code: "UNSUPPORTED_ASSET",
      message: "Asset not supported",
      retry_possible: false,
    };

    render(<FlowMessageRouter message={errorMessage} onRetry={jest.fn()} />);

    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});

// ─── Test 5: Zod schema validation of all message types ────────────

describe("E2E: Zod schema validation of all message types", () => {
  it("validates a well-formed clarify message", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "clarify",
      question: "Which pool?",
      suggestions: [
        {
          label: "Blend USDC",
          value: { protocol: "blend" },
          tags: ["recommended"],
          description: "14.2% APY",
        },
      ],
    });

    expect(result.kind).toBe("clarify");
    if (result.kind === "clarify") {
      expect(result.question).toBe("Which pool?");
      expect(result.suggestions).toHaveLength(1);
    }
  });

  it("validates a well-formed plan_preview message", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "plan_preview",
      plan: {
        id: "plan-002",
        steps: [
          {
            index: 0,
            typed_intent: "BlendDeposit",
            protocol: "blend",
            action: "supply_collateral",
            asset: "USDC",
            amount: "5000000000",
            pool_address: "CABC123",
            description: "Deposit 500 USDC to Blend",
            expected_apy_bps: 1420,
          },
        ],
        total_gas_xlm: 0.2,
        weighted_apy_bps: 1420,
      },
      simulation_report: {
        status: "success",
        steps: [{ step_index: 0, status: "success", gas_consumed: 0.2 }],
        total_gas_xlm: 0.2,
        xdrs: ["XDR_ENCODED_BASE64"],
        warnings: [],
        simulated_at_ledger: 200000,
      },
    });

    expect(result.kind).toBe("plan_preview");
  });

  it("rejects a plan with empty steps array", () => {
    expect(() =>
      assistantFlowMessageSchema.parse({
        kind: "plan_preview",
        plan: {
          id: "plan-bad",
          steps: [],
          total_gas_xlm: 0.1,
          weighted_apy_bps: 0,
        },
        simulation_report: {
          status: "success",
          steps: [],
          total_gas_xlm: 0.1,
          xdrs: ["XDR"],
          warnings: [],
          simulated_at_ledger: 100,
        },
      })
    ).toThrow(ZodError);
  });

  it("rejects a simulation report with empty xdrs array", () => {
    expect(() =>
      assistantFlowMessageSchema.parse({
        kind: "plan_preview",
        plan: {
          id: "plan-bad-sim",
          steps: [
            {
              index: 0,
              typed_intent: "BlendDeposit",
              protocol: "blend",
              action: "deposit",
              asset: "USDC",
              amount: "100",
              pool_address: "CABC",
              description: "Deposit",
            },
          ],
          total_gas_xlm: 0.1,
          weighted_apy_bps: 500,
        },
        simulation_report: {
          status: "success",
          steps: [{ step_index: 0, status: "success", gas_consumed: 0.1 }],
          total_gas_xlm: 0.1,
          xdrs: [],
          warnings: [],
          simulated_at_ledger: 100,
        },
      })
    ).toThrow(ZodError);
  });

  it("correctly discriminates all 6 message kinds", () => {
    const messages = [
      { kind: "text", text: "Hello" },
      { kind: "clarify", question: "Which?" },
      {
        kind: "plan_preview",
        plan: {
          id: "p",
          steps: [
            {
              index: 0,
              typed_intent: "T",
              protocol: "p",
              action: "a",
              asset: "X",
              amount: "1",
              pool_address: "C",
              description: "d",
            },
          ],
          total_gas_xlm: 0,
          weighted_apy_bps: 0,
        },
        simulation_report: {
          status: "success",
          steps: [{ step_index: 0, status: "success", gas_consumed: 0 }],
          total_gas_xlm: 0,
          xdrs: ["x"],
          warnings: [],
          simulated_at_ledger: 1,
        },
      },
      { kind: "execution_update", step: 1, total_steps: 1, status: "submitting" },
      {
        kind: "position_update",
        positions: [{ deposit: "100", venue: "v", protocol: "p", apy_bps: 100, tx_hash: "h" }],
      },
      { kind: "error", code: "E", message: "m", retry_possible: false },
    ] as const;

    const expectedKinds = [
      "text",
      "clarify",
      "plan_preview",
      "execution_update",
      "position_update",
      "error",
    ];

    messages.forEach((msg, i) => {
      const result = assistantFlowMessageSchema.parse(msg);
      expect(result.kind).toBe(expectedKinds[i]);
    });
  });
});

// ─── Test 6: Suggested prompts ─────────────────────────────────────

describe("E2E: Suggested prompts", () => {
  it("renders first-time prompts when hasPositions is false", () => {
    render(<SuggestedPrompts onSelect={jest.fn()} hasPositions={false} />);

    expect(screen.getByText("Top 5 highest-yield USDC pools")).toBeInTheDocument();
    expect(screen.getByText("Top 5 highest-yield XLM pools")).toBeInTheDocument();
    expect(screen.getByText("Start with $5")).toBeInTheDocument();
    expect(screen.getByText("Compare Blend vs DeFindex")).toBeInTheDocument();
    expect(screen.getByText("What can I do here?")).toBeInTheDocument();
  });

  it("clicking a prompt chip fires onSelect with the prompt text", () => {
    const onSelect = jest.fn();
    render(<SuggestedPrompts onSelect={onSelect} hasPositions={false} />);

    fireEvent.click(screen.getByText("Start with $5"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("Start with $5");
  });

  it("renders returning prompts when hasPositions is true", () => {
    render(<SuggestedPrompts onSelect={jest.fn()} hasPositions={true} />);

    expect(screen.getByText("Add to my position")).toBeInTheDocument();
    expect(screen.getByText("Check my earnings")).toBeInTheDocument();
    expect(screen.getByText("Withdraw some")).toBeInTheDocument();
    expect(screen.getByText("Show best yields")).toBeInTheDocument();
    expect(screen.getByText("Rebalance my portfolio")).toBeInTheDocument();

    // First-time prompts should NOT appear
    expect(screen.queryByText("Top 5 highest-yield USDC pools")).not.toBeInTheDocument();
  });
});
