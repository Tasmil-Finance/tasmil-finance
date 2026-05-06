import { fireEvent, render, screen } from "@testing-library/react";
import type { HistoryRange } from "../hooks/use-portfolio-history";
import { PerformanceChart } from "./performance-chart";

describe("PerformanceChart", () => {
  it("renders placeholder copy when isPlaceholder", () => {
    render(
      <PerformanceChart
        data={[]}
        range="7d"
        isPlaceholder={true}
        isLoading={false}
        onRangeChange={() => {}}
      />
    );
    expect(screen.getByText(/daily portfolio history rolls up overnight/i)).toBeInTheDocument();
  });

  it("renders skeleton when isLoading", () => {
    const { container } = render(
      <PerformanceChart
        data={[]}
        range="7d"
        isPlaceholder={false}
        isLoading={true}
        onRangeChange={() => {}}
      />
    );
    expect(container.querySelector('[data-testid="chart-skeleton"]')).not.toBeNull();
  });

  it("calls onRangeChange when a range button is clicked", () => {
    const onRangeChange = jest.fn();
    render(
      <PerformanceChart
        data={[]}
        range="7d"
        isPlaceholder={true}
        isLoading={false}
        onRangeChange={onRangeChange}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "30d" }));
    expect(onRangeChange).toHaveBeenCalledWith<[HistoryRange]>("30d");
  });

  it("highlights the active range", () => {
    render(
      <PerformanceChart
        data={[]}
        range="30d"
        isPlaceholder={true}
        isLoading={false}
        onRangeChange={() => {}}
      />
    );
    const active = screen.getByRole("button", { name: "30d" });
    expect(active).toHaveAttribute("aria-pressed", "true");
  });
});
