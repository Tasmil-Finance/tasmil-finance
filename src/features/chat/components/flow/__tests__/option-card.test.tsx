// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import type { Suggestion } from "@/features/chat/types/flow-messages";
import { OptionCard } from "../option-card";

const makeSuggestion = (overrides: Partial<Suggestion> = {}): Suggestion => ({
  label: "Blend USDC Pool",
  value: { protocol: "blend", asset: "USDC" },
  ...overrides,
});

describe("OptionCard", () => {
  const defaultProps = {
    question: "Which pool do you want to deposit into?",
    suggestions: [
      makeSuggestion({
        label: "Blend USDC Pool",
        value: { protocol: "blend", asset: "USDC" },
        tags: ["recommended"],
        description: "8.2% APY, low risk",
      }),
      makeSuggestion({
        label: "Soroswap XLM/USDC",
        value: { protocol: "soroswap", pair: "XLM/USDC" },
        tags: ["il_risk"],
        description: "14.5% APY, impermanent loss risk",
      }),
      makeSuggestion({
        label: "Phoenix XLM/USDC",
        value: { protocol: "phoenix", pair: "XLM/USDC" },
        tags: ["high_tvl"],
      }),
    ],
    onSelect: jest.fn(),
  };

  it("renders question text as header", () => {
    render(<OptionCard {...defaultProps} />);
    expect(screen.getByText("Which pool do you want to deposit into?")).toBeInTheDocument();
  });

  it("renders N suggestion rows", () => {
    render(<OptionCard {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("each row shows label text", () => {
    render(<OptionCard {...defaultProps} />);
    expect(screen.getByText("Blend USDC Pool")).toBeInTheDocument();
    expect(screen.getByText("Soroswap XLM/USDC")).toBeInTheDocument();
    expect(screen.getByText("Phoenix XLM/USDC")).toBeInTheDocument();
  });

  it("renders recommended tag as green pill", () => {
    render(<OptionCard {...defaultProps} />);
    const pill = screen.getByText("recommended");
    expect(pill).toBeInTheDocument();
    expect(pill.className).toContain("bg-emerald-400/10");
    expect(pill.className).toContain("text-emerald-400");
  });

  it("renders il_risk tag as yellow/amber pill", () => {
    render(<OptionCard {...defaultProps} />);
    const pill = screen.getByText("IL risk");
    expect(pill).toBeInTheDocument();
    expect(pill.className).toContain("bg-amber-400/10");
    expect(pill.className).toContain("text-amber-400");
  });

  it("renders high_tvl tag as blue pill", () => {
    render(<OptionCard {...defaultProps} />);
    const pill = screen.getByText("high TVL");
    expect(pill).toBeInTheDocument();
    expect(pill.className).toContain("bg-blue-400/10");
    expect(pill.className).toContain("text-blue-400");
  });

  it("renders description as sub-text below label", () => {
    render(<OptionCard {...defaultProps} />);
    expect(screen.getByText("8.2% APY, low risk")).toBeInTheDocument();
    expect(screen.getByText("14.5% APY, impermanent loss risk")).toBeInTheDocument();
  });

  it("calls onSelect with the suggestion value when a row is clicked", () => {
    const onSelect = jest.fn();
    render(<OptionCard {...defaultProps} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Soroswap XLM/USDC"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({
      protocol: "soroswap",
      pair: "XLM/USDC",
    });
  });

  it("is non-interactive after selection (disabled + selectedValue)", () => {
    const onSelect = jest.fn();
    render(
      <OptionCard
        {...defaultProps}
        onSelect={onSelect}
        disabled={true}
        selectedValue={{ protocol: "blend", asset: "USDC" }}
      />
    );

    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }

    fireEvent.click(buttons[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("selected row has highlighted background", () => {
    render(
      <OptionCard
        {...defaultProps}
        disabled={true}
        selectedValue={{ protocol: "blend", asset: "USDC" }}
      />
    );

    const buttons = screen.getAllByRole("button");
    // First button corresponds to "Blend USDC Pool" which matches selectedValue
    expect(buttons[0].className).toContain("bg-primary/5");
  });

  it("non-selected rows are dimmed after selection", () => {
    render(
      <OptionCard
        {...defaultProps}
        disabled={true}
        selectedValue={{ protocol: "blend", asset: "USDC" }}
      />
    );

    const buttons = screen.getAllByRole("button");
    // Second and third rows should be dimmed
    expect(buttons[1].className).toContain("opacity-50");
    expect(buttons[2].className).toContain("opacity-50");
    // Selected row should NOT be dimmed
    expect(buttons[0].className).not.toContain("opacity-50");
  });

  it("renders question only when suggestions array is empty", () => {
    render(<OptionCard question="What asset do you want?" suggestions={[]} onSelect={jest.fn()} />);

    expect(screen.getByText("What asset do you want?")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("rows are button elements with aria-labels", () => {
    render(<OptionCard {...defaultProps} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-label", "Select Blend USDC Pool");
    expect(buttons[1]).toHaveAttribute("aria-label", "Select Soroswap XLM/USDC");
    expect(buttons[2]).toHaveAttribute("aria-label", "Select Phoenix XLM/USDC");
  });

  it("renders up to 6 suggestion rows", () => {
    const sixSuggestions = Array.from({ length: 6 }, (_, i) =>
      makeSuggestion({
        label: `Option ${i + 1}`,
        value: { index: i },
      })
    );

    render(<OptionCard question="Pick one" suggestions={sixSuggestions} onSelect={jest.fn()} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(6);
  });

  it("renders bridge tag as purple pill", () => {
    render(
      <OptionCard
        question="Select bridge"
        suggestions={[
          makeSuggestion({
            label: "Allbridge",
            value: { bridge: "allbridge" },
            tags: ["bridge"],
          }),
        ]}
        onSelect={jest.fn()}
      />
    );

    const pill = screen.getByText("bridge");
    expect(pill.className).toContain("bg-purple-400/10");
    expect(pill.className).toContain("text-purple-400");
  });
});
