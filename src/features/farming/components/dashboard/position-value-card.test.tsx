import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PositionValueCard } from "./position-value-card";

// Recharts in jsdom needs ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;

describe("PositionValueCard", () => {
  it("renders heading, hero balance, deposited and earnings", () => {
    render(
      <PositionValueCard
        totalBalanceUsd={53920.55}
        totalDepositedUsd={49874.8}
        lifetimeEarningsUsd={4045.75}
        lifetimeEarningsPct={8.11}
        chartSeries={[
          { t: 1, v: 100 },
          { t: 2, v: 110 },
        ]}
        onAddFunds={jest.fn()}
        onDeactivate={jest.fn()}
      />,
    );
    expect(screen.getByText(/position value/i)).toBeInTheDocument();
    expect(screen.getByText(/53,920.55/)).toBeInTheDocument();
    expect(screen.getByText(/49,874.80/)).toBeInTheDocument();
    expect(screen.getByText(/8.11%/)).toBeInTheDocument();
  });

  it("Add funds button calls onAddFunds", async () => {
    const onAddFunds = jest.fn();
    render(
      <PositionValueCard
        totalBalanceUsd={0}
        totalDepositedUsd={0}
        lifetimeEarningsUsd={0}
        lifetimeEarningsPct={0}
        chartSeries={[]}
        onAddFunds={onAddFunds}
        onDeactivate={jest.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /add funds/i }));
    expect(onAddFunds).toHaveBeenCalled();
  });

  it("Deactivate button calls onDeactivate", async () => {
    const onDeactivate = jest.fn();
    render(
      <PositionValueCard
        totalBalanceUsd={0}
        totalDepositedUsd={0}
        lifetimeEarningsUsd={0}
        lifetimeEarningsPct={0}
        chartSeries={[]}
        onAddFunds={jest.fn()}
        onDeactivate={onDeactivate}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /deactivate/i }));
    expect(onDeactivate).toHaveBeenCalled();
  });

  it("renders 'History building…' placeholder when chartSeries is empty", () => {
    render(
      <PositionValueCard
        totalBalanceUsd={0}
        totalDepositedUsd={0}
        lifetimeEarningsUsd={0}
        lifetimeEarningsPct={0}
        chartSeries={[]}
        onAddFunds={jest.fn()}
        onDeactivate={jest.fn()}
      />,
    );
    expect(screen.getByText(/history building/i)).toBeInTheDocument();
  });
});
