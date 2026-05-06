import { fireEvent, render, screen } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import type { ProtocolStats } from "../../hooks/use-protocol-stats";
import { ProtocolOverview } from "../protocol-overview";

jest.mock("../../hooks/use-account-activity-infinite", () => ({
  useAccountActivityInfinite: jest.fn(),
}));
jest.mock("../../hooks/use-protocol-stats", () => ({
  useProtocolStats: jest.fn(),
}));

import { useAccountActivityInfinite } from "../../hooks/use-account-activity-infinite";
import { useProtocolStats } from "../../hooks/use-protocol-stats";

const mockActivity = useAccountActivityInfinite as unknown as jest.Mock;
const mockStats = useProtocolStats as unknown as jest.Mock;

const blendDeposit: ActivityItem = {
  id: "1",
  type: "DEPOSIT",
  category: "protocol",
  amount: 1,
  amountUsd: 1,
  token: "USDC",
  pool: { protocol: "blend", name: "blend USDC", assetSymbol: "USDC" },
  createdAt: new Date().toISOString(),
};

const soroswapRebalance: ActivityItem = {
  id: "2",
  type: "REBALANCE",
  category: "protocol",
  amount: 0.5,
  amountUsd: 0.5,
  token: "XLM",
  pool: { protocol: "soroswap", name: "soroswap XLM", assetSymbol: "XLM" },
  createdAt: new Date().toISOString(),
};

const STATS_OK: ProtocolStats = {
  tvl: "$1,247.83",
  netDeposits: "$1,200.00",
  positionsCount: "4 / 2",
  blendedApy: "8.42%",
  isLoading: false,
};

function setActivity(
  activities: ActivityItem[],
  extras: Partial<{ isLoading: boolean; error: Error | null }> = {},
) {
  mockActivity.mockReturnValue({
    activities,
    isLoading: extras.isLoading ?? false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    error: extras.error ?? null,
  });
}

describe("ProtocolOverview", () => {
  beforeEach(() => {
    mockActivity.mockReset();
    mockStats.mockReset();
    mockStats.mockReturnValue(STATS_OK);
  });

  it("renders section header, KPI grid, filter chips, and activity rows", () => {
    setActivity([blendDeposit, soroswapRebalance]);
    render(<ProtocolOverview walletAddress="G..." />);

    expect(screen.getByText("Protocol Overview")).toBeInTheDocument();
    expect(screen.getByText("$1,247.83")).toBeInTheDocument();
    expect(screen.getByText("4 / 2")).toBeInTheDocument();
    expect(screen.getByText("8.42%")).toBeInTheDocument();
    expect(screen.getAllByTestId("activity-row")).toHaveLength(2);
  });

  it("filters to selected protocol when chip clicked", () => {
    setActivity([blendDeposit, soroswapRebalance]);
    render(<ProtocolOverview walletAddress="G..." />);
    fireEvent.click(screen.getByRole("radio", { name: /^blend$/i }));
    expect(screen.getAllByTestId("activity-row")).toHaveLength(1);
  });

  it("shows empty state when no activities", () => {
    setActivity([]);
    render(<ProtocolOverview walletAddress="G..." />);
    expect(screen.getByText(/no protocol activity/i)).toBeInTheDocument();
  });

  it("shows skeleton in KPI grid while stats loading", () => {
    setActivity([]);
    mockStats.mockReturnValue({ ...STATS_OK, isLoading: true });
    const { container } = render(<ProtocolOverview walletAddress="G..." />);
    expect(container.querySelectorAll('[class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it("surfaces activity-load error in destructive banner", () => {
    setActivity([], { error: new Error("boom") });
    render(<ProtocolOverview walletAddress="G..." />);
    expect(screen.getByText(/could not load activity/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });
});
