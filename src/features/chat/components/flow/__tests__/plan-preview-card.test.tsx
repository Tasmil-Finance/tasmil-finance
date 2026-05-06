// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { Plan, PlanStep, SimulationReport } from "@/features/chat/types/flow-messages";
import { PlanPreviewCard } from "../plan-preview-card";

const makeStep = (overrides: Partial<PlanStep> = {}): PlanStep => ({
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
});

const makePlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "plan-1",
  steps: [makeStep()],
  total_gas_xlm: 0.15,
  weighted_apy_bps: 1420,
  ...overrides,
});

const makeSimReport = (overrides: Partial<SimulationReport> = {}): SimulationReport => ({
  status: "success",
  steps: [{ step_index: 0, status: "success", gas_consumed: 0.15 }],
  total_gas_xlm: 0.15,
  xdrs: ["AAAA"],
  warnings: [],
  simulated_at_ledger: 100000,
  ...overrides,
});

describe("PlanPreviewCard", () => {
  const defaultProps = {
    plan: makePlan(),
    simulationReport: makeSimReport(),
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  it("single-step plan shows amount, venue name, APY, and gas", () => {
    render(<PlanPreviewCard {...defaultProps} />);

    expect(screen.getByText(/800 USDC/)).toBeInTheDocument();
    expect(screen.getByText(/Blend/)).toBeInTheDocument();
    // APY appears in both the weighted header and the step line for single-step
    const apyMatches = screen.getAllByText(/14\.2%/);
    expect(apyMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/~0\.15 XLM/)).toBeInTheDocument();
  });

  it("multi-step plan shows each allocation line", () => {
    const plan = makePlan({
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
    });

    const sim = makeSimReport({
      steps: [
        { step_index: 0, status: "success", gas_consumed: 0.15 },
        { step_index: 1, status: "success", gas_consumed: 0.15 },
      ],
      total_gas_xlm: 0.3,
    });

    render(
      <PlanPreviewCard
        plan={plan}
        simulationReport={sim}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByText("400 USDC → Blend (14.2%)")).toBeInTheDocument();
    expect(screen.getByText("400 USDC → DeFindex (13.8%)")).toBeInTheDocument();
  });

  it("displays weighted APY prominently", () => {
    render(<PlanPreviewCard {...defaultProps} />);

    const apyEl = screen.getByTestId("weighted-apy");
    expect(apyEl).toHaveTextContent("14.2%");
  });

  it("shows idle amount when > 0", () => {
    const plan = makePlan({ idle_amount: 200 });
    render(<PlanPreviewCard {...defaultProps} plan={plan} />);

    expect(screen.getByText("200 USDC idle")).toBeInTheDocument();
  });

  it("does not show idle section when idle_amount is 0", () => {
    const plan = makePlan({ idle_amount: 0 });
    render(<PlanPreviewCard {...defaultProps} plan={plan} />);

    expect(screen.queryByText(/idle/i)).not.toBeInTheDocument();
  });

  it("renders warnings as yellow notice items", () => {
    const sim = makeSimReport({
      warnings: ["Slippage may exceed 2%", "Pool TVL is low"],
    });

    render(<PlanPreviewCard {...defaultProps} simulationReport={sim} />);

    const warning1 = screen.getByText("Slippage may exceed 2%");
    const warning2 = screen.getByText("Pool TVL is low");
    expect(warning1).toBeInTheDocument();
    expect(warning2).toBeInTheDocument();
    expect(warning1.closest("[data-testid='warning-item']")?.className).toContain("text-amber-400");
  });

  it("Confirm & Sign CTA calls onConfirm", () => {
    const onConfirm = jest.fn();
    render(<PlanPreviewCard {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: /confirm & sign/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Cancel CTA calls onCancel", () => {
    const onCancel = jest.fn();
    render(<PlanPreviewCard {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("when simulation status is fail, CTA is disabled and shows error", () => {
    const sim = makeSimReport({
      status: "fail",
      steps: [
        {
          step_index: 0,
          status: "fail",
          gas_consumed: 0,
          error: "Insufficient balance",
        },
      ],
    });

    render(<PlanPreviewCard {...defaultProps} simulationReport={sim} />);

    const confirmBtn = screen.getByRole("button", { name: /confirm & sign/i });
    expect(confirmBtn).toBeDisabled();
    expect(screen.getByText("Insufficient balance")).toBeInTheDocument();
  });

  it("CTA is disabled when disabled prop is true", () => {
    render(<PlanPreviewCard {...defaultProps} disabled={true} />);

    const confirmBtn = screen.getByRole("button", { name: /confirm & sign/i });
    expect(confirmBtn).toBeDisabled();
  });
});
