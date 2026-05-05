import { render, screen } from "@testing-library/react";
import { AprSummaryCard } from "./apr-summary-card";

describe("AprSummaryCard", () => {
  it("renders APR rows, activation date, total deposits", () => {
    render(
      <AprSummaryCard
        netApr={15}
        currentPositionApr={7.61}
        currentMarketName="Moonwell"
        activatedAt="2025-02-05T22:28:00Z"
        totalDepositsUsd={49874.8}
      />
    );
    expect(screen.getByText("Tasmil Net APR")).toBeInTheDocument();
    expect(screen.getByText("15.00%")).toBeInTheDocument();
    expect(screen.getByText("Moonwell 7.61%")).toBeInTheDocument();
    expect(screen.getByText(/feb 5, 2025/i)).toBeInTheDocument();
    expect(screen.getByText(/49,874.80/)).toBeInTheDocument();
  });

  it("renders rewards APR row when provided", () => {
    render(
      <AprSummaryCard
        netApr={15}
        currentPositionApr={7.61}
        currentMarketName="Moonwell"
        rewardsApr={7.39}
        activatedAt="2025-02-05T22:28:00Z"
        totalDepositsUsd={0}
      />
    );
    expect(screen.getByText(/rewards apr/i)).toBeInTheDocument();
    expect(screen.getByText("7.39%")).toBeInTheDocument();
  });
});
