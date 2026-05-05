import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AgentHistoryCard } from "./agent-history-card";

const event = (i: number) => ({
  id: String(i),
  title: "Position reallocated to higher-yield lending market",
  detail: `${(50000 + i).toLocaleString()} USDC reallocated to ${(7 + i / 10).toFixed(2)}% lending yield`,
  occurredAt: new Date(`2025-09-${String(30 - i).padStart(2, "0")}T16:01:00Z`).toISOString(),
});

describe("AgentHistoryCard", () => {
  it("renders heading and rows", () => {
    render(<AgentHistoryCard events={[event(0), event(1)]} />);
    expect(screen.getByText(/agent execution history/i)).toBeInTheDocument();
    expect(screen.getAllByText(/position reallocated/i)).toHaveLength(2);
  });

  it("shows empty state when no events", () => {
    render(<AgentHistoryCard events={[]} />);
    expect(screen.getByText(/no agent activity yet/i)).toBeInTheDocument();
  });

  it("paginates when events exceed pageSize", async () => {
    const events = Array.from({ length: 12 }, (_, i) => event(i));
    render(<AgentHistoryCard events={events} pageSize={6} />);
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
    const next = screen.getByRole("button", { name: /next page/i });
    expect(next).toBeEnabled();
    await userEvent.click(next);
    expect(screen.getByText(/2 of 2/)).toBeInTheDocument();
    expect(next).toBeDisabled();
  });
});
