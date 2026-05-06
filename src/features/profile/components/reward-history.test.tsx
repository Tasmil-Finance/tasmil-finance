import { fireEvent, render, screen } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import { RewardHistoryView } from "./reward-history";

jest.mock("../hooks/use-account-activity-infinite", () => ({
  useAccountActivityInfinite: jest.fn(),
}));

import { useAccountActivityInfinite } from "../hooks/use-account-activity-infinite";

const harvest: ActivityItem = {
  id: "h1",
  type: "HARVEST",
  category: "reward",
  amountUsd: 5,
  metadata: {
    perPool: [
      {
        poolId: "p1",
        protocol: "blend",
        token: "BLND",
        amount: 1.5,
        amountUsd: 3,
      },
      {
        poolId: "p2",
        protocol: "blend",
        token: "BLND",
        amount: 1.0,
        amountUsd: 2,
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

const mockHook = useAccountActivityInfinite as unknown as jest.Mock;

function mockReturn(activities: ActivityItem[]) {
  mockHook.mockReturnValue({
    activities,
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    error: null,
  });
}

describe("RewardHistoryView", () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it("renders summary card and harvest rows", () => {
    mockReturn([harvest]);
    render(<RewardHistoryView walletAddress="G..." />);
    expect(screen.getByText(/Lifetime rewards/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("activity-row")).toHaveLength(1);
  });

  it("expands per-pool breakdown on click", () => {
    mockReturn([harvest]);
    render(<RewardHistoryView walletAddress="G..." />);
    fireEvent.click(screen.getByRole("button", { name: /harvest details/i }));
    expect(screen.getByText(/1\.5\s*BLND/)).toBeInTheDocument();
    expect(screen.getByText(/^\+1\s*BLND/)).toBeInTheDocument();
  });

  it("shows empty state with auto-harvest copy", () => {
    mockReturn([]);
    render(<RewardHistoryView walletAddress="G..." />);
    expect(screen.getByText(/auto-harvest runs every 4/i)).toBeInTheDocument();
  });
});
