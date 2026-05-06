// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { ExecutionCard } from "../execution-card";

describe("ExecutionCard", () => {
  it("submitting status shows submitting message with step and description", () => {
    render(
      <ExecutionCard
        step={1}
        totalSteps={2}
        status="submitting"
        description="Deposit 400 USDC into Blend"
      />
    );

    expect(
      screen.getByText("Submitting step 1 of 2: Deposit 400 USDC into Blend...")
    ).toBeInTheDocument();
  });

  it("confirmed on all steps shows done message with green highlight", () => {
    render(
      <ExecutionCard step={2} totalSteps={2} status="confirmed" txHash="abc123def456ghi789" />
    );

    const doneText = screen.getByText("Done. Position opened.");
    expect(doneText).toBeInTheDocument();
    expect(doneText.className).toContain("text-[#00C278]");
  });

  it("failed status shows error message and Try again button", () => {
    const onRetry = jest.fn();
    render(
      <ExecutionCard
        step={1}
        totalSteps={2}
        status="failed"
        error="Transaction expired"
        onRetry={onRetry}
      />
    );

    expect(screen.getByText("Transaction expired")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("tx hash is truncated and links to stellar.expert", () => {
    render(
      <ExecutionCard step={1} totalSteps={1} status="confirmed" txHash="abcdefghijklmnopqrst" />
    );

    const link = screen.getByRole("link", { name: /abcd\.\.\.qrst/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "https://stellar.expert/explorer/public/tx/abcdefghijklmnopqrst"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("multi-step shows progress when step 1 confirmed and step 2 submitting", () => {
    render(
      <ExecutionCard
        step={2}
        totalSteps={2}
        status="submitting"
        description="Deposit 400 USDC into DeFindex"
      />
    );

    expect(screen.getByText("Step 1 confirmed.")).toBeInTheDocument();
    expect(
      screen.getByText("Submitting step 2 of 2: Deposit 400 USDC into DeFindex...")
    ).toBeInTheDocument();
  });

  it("confirmed on intermediate step shows step progress not done", () => {
    render(
      <ExecutionCard step={1} totalSteps={2} status="confirmed" txHash="abcdefghijklmnopqrst" />
    );

    expect(screen.getByText("Step 1 confirmed.")).toBeInTheDocument();
    expect(screen.queryByText("Done. Position opened.")).not.toBeInTheDocument();
  });

  it("does not render Try again button when onRetry is not provided", () => {
    render(<ExecutionCard step={1} totalSteps={1} status="failed" error="Network error" />);

    expect(screen.getByText("Network error")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /try again/i })).not.toBeInTheDocument();
  });

  it("submitting single step does not show step progress prefix", () => {
    render(
      <ExecutionCard
        step={1}
        totalSteps={1}
        status="submitting"
        description="Deposit 800 USDC into Blend"
      />
    );

    expect(
      screen.getByText("Submitting step 1 of 1: Deposit 800 USDC into Blend...")
    ).toBeInTheDocument();
    expect(screen.queryByText(/Step \d+ confirmed\./)).not.toBeInTheDocument();
  });
});
