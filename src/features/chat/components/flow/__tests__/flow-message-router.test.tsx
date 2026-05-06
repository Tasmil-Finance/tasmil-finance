// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { AssistantFlowMessage } from "@/features/chat/types/flow-messages";
import { FlowMessageRouter } from "../flow-message-router";

// ─── Fixtures ────────────────────────────────────────────────────

const clarifyMessage: AssistantFlowMessage = {
  kind: "clarify",
  question: "Which pool do you want to deposit into?",
  suggestions: [
    {
      label: "Blend USDC Pool",
      value: { protocol: "blend", asset: "USDC" },
      tags: ["recommended"],
      description: "8.2% APY, low risk",
    },
    {
      label: "Soroswap XLM/USDC",
      value: { protocol: "soroswap", pair: "XLM/USDC" },
      tags: ["il_risk"],
    },
  ],
};

const planPreviewMessage: AssistantFlowMessage = {
  kind: "plan_preview",
  plan: {
    id: "plan-001",
    steps: [
      {
        index: 0,
        typed_intent: "BlendDeposit",
        protocol: "Blend",
        action: "deposit",
        asset: "USDC",
        amount: "500",
        pool_address: "CABC123",
        description: "Deposit 500 USDC into Blend",
        expected_apy_bps: 820,
      },
    ],
    total_gas_xlm: 0.15,
    weighted_apy_bps: 820,
  },
  simulation_report: {
    status: "success",
    steps: [{ step_index: 0, status: "success", gas_consumed: 0.15 }],
    total_gas_xlm: 0.15,
    xdrs: ["AAAA"],
    warnings: [],
    simulated_at_ledger: 100000,
  },
};

const executionUpdateMessage: AssistantFlowMessage = {
  kind: "execution_update",
  step: 1,
  total_steps: 2,
  status: "submitting",
  tx_hash: "abc123def456",
};

const textMessage: AssistantFlowMessage = {
  kind: "text",
  text: "Your deposit has been processed successfully.",
};

const positionUpdateMessage: AssistantFlowMessage = {
  kind: "position_update",
  positions: [
    {
      deposit: "500 USDC",
      venue: "Blend USDC Pool",
      protocol: "Blend",
      apy_bps: 820,
      tx_hash: "tx_abc123",
    },
    {
      deposit: "300 XLM",
      venue: "Soroswap XLM/USDC",
      protocol: "Soroswap",
      apy_bps: 1450,
      tx_hash: "tx_def456",
    },
  ],
};

const errorRetryMessage: AssistantFlowMessage = {
  kind: "error",
  code: "TX_SIMULATION_FAILED",
  message: "Transaction simulation failed: insufficient balance",
  retry_possible: true,
};

const errorNoRetryMessage: AssistantFlowMessage = {
  kind: "error",
  code: "UNSUPPORTED_ASSET",
  message: "The selected asset is not supported on this network",
  retry_possible: false,
};

// ─── Tests ───────────────────────────────────────────────────────

describe("FlowMessageRouter", () => {
  it("renders OptionCard for clarify message — question text appears", () => {
    render(<FlowMessageRouter message={clarifyMessage} />);
    expect(screen.getByText("Which pool do you want to deposit into?")).toBeInTheDocument();
    expect(screen.getByText("Blend USDC Pool")).toBeInTheDocument();
    expect(screen.getByText("Soroswap XLM/USDC")).toBeInTheDocument();
  });

  it("renders PlanPreviewCard for plan_preview message — APY appears", () => {
    render(
      <FlowMessageRouter message={planPreviewMessage} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );
    // 820 bps = 8.2%
    expect(screen.getByText("8.2%")).toBeInTheDocument();
    expect(screen.getByText("Plan Preview")).toBeInTheDocument();
  });

  it("renders ExecutionCard for execution_update message — step text appears", () => {
    render(<FlowMessageRouter message={executionUpdateMessage} />);
    expect(screen.getByText(/Submitting step 1 of 2/)).toBeInTheDocument();
  });

  it("renders error code + message + retry button when retry_possible is true", () => {
    const onRetry = jest.fn();
    render(<FlowMessageRouter message={errorRetryMessage} onRetry={onRetry} />);

    expect(screen.getByText("TX_SIMULATION_FAILED")).toBeInTheDocument();
    expect(
      screen.getByText("Transaction simulation failed: insufficient balance")
    ).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "Retry" });
    expect(retryButton).toBeInTheDocument();
  });

  it("renders error without retry button when retry_possible is false", () => {
    render(<FlowMessageRouter message={errorNoRetryMessage} />);

    expect(screen.getByText("UNSUPPORTED_ASSET")).toBeInTheDocument();
    expect(
      screen.getByText("The selected asset is not supported on this network")
    ).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("renders text content for text message", () => {
    render(<FlowMessageRouter message={textMessage} />);
    expect(screen.getByText("Your deposit has been processed successfully.")).toBeInTheDocument();
  });

  it("renders position info for position_update message", () => {
    render(<FlowMessageRouter message={positionUpdateMessage} />);

    expect(screen.getByText("Position Update")).toBeInTheDocument();
    expect(screen.getByText("Blend")).toBeInTheDocument();
    expect(screen.getByText("Soroswap")).toBeInTheDocument();
    // 820 bps = 8.2%, 1450 bps = 14.5%
    expect(screen.getByText("8.2%")).toBeInTheDocument();
    expect(screen.getByText("14.5%")).toBeInTheDocument();
    expect(screen.getByText("tx_abc123")).toBeInTheDocument();
    expect(screen.getByText("tx_def456")).toBeInTheDocument();
  });

  it("onOptionSelect callback fires when an option is clicked", () => {
    const onOptionSelect = jest.fn();
    render(<FlowMessageRouter message={clarifyMessage} onOptionSelect={onOptionSelect} />);

    fireEvent.click(screen.getByText("Soroswap XLM/USDC"));
    expect(onOptionSelect).toHaveBeenCalledTimes(1);
    expect(onOptionSelect).toHaveBeenCalledWith({
      protocol: "soroswap",
      pair: "XLM/USDC",
    });
  });

  it("onConfirm callback fires when confirm button is clicked", () => {
    const onConfirm = jest.fn();
    render(
      <FlowMessageRouter message={planPreviewMessage} onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm & Sign" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
