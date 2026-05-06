import { render, screen } from "@testing-library/react";
import { KpiGrid } from "../kpi-grid";

describe("KpiGrid", () => {
  it("renders label, value, and sub for each cell", () => {
    render(
      <KpiGrid
        cells={[
          { label: "Active TVL", value: "$1,247.83", sub: "across 4 pools" },
          { label: "Net Deposits", value: "$1,200.00", sub: "in − out" },
          { label: "Positions", value: "4 / 2", sub: "positions / protocols" },
          { label: "Blended APY", value: "8.42%", sub: "weighted" },
        ]}
      />,
    );

    expect(screen.getByText("Active TVL")).toBeInTheDocument();
    expect(screen.getByText("$1,247.83")).toBeInTheDocument();
    expect(screen.getByText("across 4 pools")).toBeInTheDocument();
    expect(screen.getByText("4 / 2")).toBeInTheDocument();
  });

  it("renders skeleton in place of value when cell.loading is true", () => {
    const { container } = render(
      <KpiGrid
        cells={[
          { label: "Active TVL", value: "$1.00", sub: "ok" },
          { label: "Net Deposits", value: "—", sub: "—", loading: true },
          { label: "Positions", value: "—", sub: "—", loading: true },
          { label: "Blended APY", value: "—", sub: "—", loading: true },
        ]}
      />,
    );

    expect(screen.getByText("$1.00")).toBeInTheDocument();
    expect(container.querySelectorAll('[class*="animate-pulse"]')).toHaveLength(3 * 2);
  });

  it("renders em-dash when value is undefined", () => {
    render(
      <KpiGrid
        cells={[
          { label: "Active TVL", value: undefined, sub: undefined },
          { label: "Net Deposits", value: "$1.00", sub: "ok" },
          { label: "Positions", value: "1 / 1", sub: "ok" },
          { label: "Blended APY", value: "5%", sub: "ok" },
        ]}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});
