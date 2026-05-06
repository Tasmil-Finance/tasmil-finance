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

  it("renders no sparkline slot when no sparkline prop provided", () => {
    const { container } = render(<StatCard label="APY" value="7.41%" />);
    expect(screen.queryByText(/trend coming soon/i)).not.toBeInTheDocument();
    expect(container.querySelector(".h-10")).toBeNull();
  });

  it("renders sparkline slot when sparkline prop provided", () => {
    const { container } = render(
      <StatCard label="APY" value="7.41%" sparkline={<svg data-testid="spark" />} />
    );
    expect(container.querySelector(".h-10")).not.toBeNull();
    expect(screen.getByTestId("spark")).toBeInTheDocument();
  });

  it("has aria-label combining label and value", () => {
    render(<StatCard label="Total Value" value="$12,345.67" />);
    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("aria-label", "Total Value: $12,345.67");
  });
});
