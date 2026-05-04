import { render, screen } from "@testing-library/react";
import { ActivityList } from "./activity-list";
import { useAccountActivity } from "../hooks/use-account-activity";

jest.mock("../hooks/use-account-activity");

const SAMPLE = [
  { id: "a1", type: "DEPOSIT",  amount: 100, token: "USDC", createdAt: "2026-05-04T10:00:00Z" },
  { id: "a2", type: "HARVEST",  amount: 5,   token: "BLND", createdAt: "2026-05-04T11:00:00Z" },
  { id: "a3", type: "WITHDRAW", amount: 50,  token: "USDC", createdAt: "2026-05-03T22:00:00Z" },
  { id: "a4", type: "BACKSTOP_QUEUE", amount: 10, token: "BLND", createdAt: "2026-05-03T20:00:00Z" },
];

beforeEach(() => {
  (useAccountActivity as jest.Mock).mockReturnValue({
    activities: SAMPLE,
    isLoading: false,
    error: null,
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("ActivityList", () => {
  it("renders all activities when category='all'", () => {
    render(<ActivityList walletAddress="GA..." category="all" />);
    expect(screen.getByText(/DEPOSIT|Deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/HARVEST|Harvest/i)).toBeInTheDocument();
    expect(screen.getByText(/WITHDRAW|Withdraw/i)).toBeInTheDocument();
  });

  it("filters to PROTOCOL_TYPES when category='protocol'", () => {
    render(<ActivityList walletAddress="GA..." category="protocol" />);
    expect(screen.queryByText(/Harvest/i)).toBeNull();
    expect(screen.queryByText(/Backstop/i)).toBeNull();
    expect(screen.getByText(/Deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/Withdraw/i)).toBeInTheDocument();
  });

  it("filters to REWARD_TYPES when category='reward' AND prefixes amount with +", () => {
    render(<ActivityList walletAddress="GA..." category="reward" />);
    expect(screen.queryByText(/Deposit/i)).toBeNull();
    expect(screen.getByText(/Harvest/i)).toBeInTheDocument();
    expect(screen.getByText(/Backstop/i)).toBeInTheDocument();
    const amountTexts = screen.getAllByText(/^\+/);
    expect(amountTexts.length).toBeGreaterThan(0);
  });

  it("renders empty state copy per category when no matches", () => {
    (useAccountActivity as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: false,
      error: null,
    });

    const { rerender } = render(<ActivityList walletAddress="GA..." category="all" />);
    expect(screen.getByText(/No activity yet/i)).toBeInTheDocument();

    rerender(<ActivityList walletAddress="GA..." category="protocol" />);
    expect(screen.getByText(/No protocol activity yet/i)).toBeInTheDocument();

    rerender(<ActivityList walletAddress="GA..." category="reward" />);
    expect(screen.getByText(/No rewards yet/i)).toBeInTheDocument();
  });

  it("renders loading skeleton when isLoading=true", () => {
    (useAccountActivity as jest.Mock).mockReturnValue({
      activities: [],
      isLoading: true,
      error: null,
    });

    render(<ActivityList walletAddress="GA..." category="all" />);
    expect(document.querySelectorAll('[data-testid="activity-skeleton-row"]').length).toBeGreaterThan(0);
  });
});
