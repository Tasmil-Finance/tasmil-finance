import { render, screen } from "@testing-library/react";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Value" value="$12,345.67" />);
    expect(screen.getByText("Total Value")).toBeInTheDocument();
    expect(screen.getByText("$12,345.67")).toBeInTheDocument();
  });

  it("renders positive delta with success tone", () => {
    render(<StatCard label="P&L" value="$200" delta={{ text: "+2.3%", tone: "positive" }} />);
    expect(screen.getByText("+2.3%")).toHaveClass("text-emerald-400");
  });

  it("renders negative delta with destructive tone", () => {
    render(<StatCard label="P&L" value="-$50" delta={{ text: "-1.2%", tone: "negative" }} />);
    expect(screen.getByText("-1.2%")).toHaveClass("text-red-400");
  });

  it("renders sparkline placeholder copy when isPlaceholder", () => {
    render(<StatCard label="APY" value="7.41%" sparklineState="placeholder" />);
    expect(screen.getByText(/trend coming soon/i)).toBeInTheDocument();
  });

  it("has aria-label combining label and value", () => {
    render(<StatCard label="Total Value" value="$12,345.67" />);
    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("aria-label", "Total Value: $12,345.67");
  });
});
