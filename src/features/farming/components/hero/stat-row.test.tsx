import { render, screen } from "@testing-library/react";
import { StatRow } from "./stat-row";

describe("StatRow", () => {
  it("renders three cards with provided values", () => {
    render(
      <StatRow
        totalValueUsd={12345.67}
        allTimePnlUsd={234}
        allTimePnlPercent={2.3}
        currentApy={0.0741}
      />
    );
    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("$12,345.67")).toBeInTheDocument();
    expect(screen.getByText("All-Time P&L")).toBeInTheDocument();
    expect(screen.getByText("Current APY")).toBeInTheDocument();
    expect(screen.getByText("7.41%")).toBeInTheDocument();
  });

  it("uses negative tone when P&L is negative", () => {
    render(
      <StatRow totalValueUsd={1000} allTimePnlUsd={-50} allTimePnlPercent={-5} currentApy={0.05} />
    );
    expect(screen.getByText("-5.00%")).toHaveClass("text-red-400");
  });

  it("hides delta on APY card", () => {
    render(
      <StatRow totalValueUsd={1000} allTimePnlUsd={0} allTimePnlPercent={0} currentApy={0.05} />
    );
    const apyLabel = screen.getByText("Current APY");
    const apyCard = apyLabel.closest("article");
    expect(apyCard?.querySelector(".text-emerald-400, .text-red-400")).toBeNull();
  });
});
