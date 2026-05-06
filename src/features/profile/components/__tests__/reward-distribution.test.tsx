import { fireEvent, render, screen } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import type { ProtocolPositionGroup } from "../../hooks/use-defi-positions";
import { RewardDistribution } from "../reward-distribution";

jest.mock("../../hooks/use-account-activity-infinite", () => ({
  useAccountActivityInfinite: jest.fn(),
}));
jest.mock("../../hooks/use-defi-positions", () => ({
  useDefiPositions: jest.fn(),
}));

import { useAccountActivityInfinite } from "../../hooks/use-account-activity-infinite";
import { useDefiPositions } from "../../hooks/use-defi-positions";

const mockActivity = useAccountActivityInfinite as unknown as jest.Mock;
const mockPositions = useDefiPositions as unknown as jest.Mock;

const harvest: ActivityItem = {
  id: "h1",
  type: "HARVEST",
  category: "reward",
  amountUsd: 5,
  metadata: {
    perPool: [
      { poolId: "p1", protocol: "blend", token: "BLND", amount: 1.5, amountUsd: 3 },
      { poolId: "p2", protocol: "blend", token: "BLND", amount: 1.0, amountUsd: 2 },
    ],
  },
  createdAt: new Date().toISOString(),
};

const blendGroup: ProtocolPositionGroup = {
  protocol: "blend",
  displayName: "Blend",
  icon: null,
  totalValueUsd: 800,
  rewards: { amount: 0.42, token: "BLND" },
  positions: [{ name: "Blend USDC", type: "supply", asset: "USDC", valueUsd: 500 }],
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

function setPositions(groups: ProtocolPositionGroup[], isLoading = false) {
  mockPositions.mockReturnValue({
    groups,
    vaultPnl: null,
    totalValueUsd: groups.reduce((s, g) => s + g.totalValueUsd, 0),
    isLoading,
    loadingProtocols: [],
  });
}

describe("RewardDistribution", () => {
  beforeEach(() => {
    mockActivity.mockReset();
    mockPositions.mockReset();
  });

  it("renders section header, 4 KPIs, per-token chips, and harvest rows", () => {
    setActivity([harvest]);
    setPositions([blendGroup]);
    render(<RewardDistribution walletAddress="G..." />);

    expect(screen.getByText("Reward Distribution")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText(/0\.42\s*BLND/)).toBeInTheDocument();
    expect(screen.getByText("Lifetime")).toBeInTheDocument();
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByText("Harvests")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Last harvest")).toBeInTheDocument();
    expect(screen.getByText(/By token/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.5\s*BLND/)).toBeInTheDocument();
    expect(screen.getAllByTestId("activity-row")).toHaveLength(1);
  });

  it("expands per-pool breakdown on click", () => {
    setActivity([harvest]);
    setPositions([blendGroup]);
    render(<RewardDistribution walletAddress="G..." />);
    fireEvent.click(screen.getByRole("button", { name: /harvest details/i }));
    expect(screen.getByText(/1\.5\s*BLND/)).toBeInTheDocument();
    expect(screen.getByText(/^\+1\s*BLND/)).toBeInTheDocument();
  });

  it("shows empty state with auto-harvest copy when no harvests", () => {
    setActivity([]);
    setPositions([]);
    render(<RewardDistribution walletAddress="G..." />);
    expect(screen.getByText(/auto-harvest runs every 4/i)).toBeInTheDocument();
  });

  it("renders em-dash for Pending when no claimable rewards exist", () => {
    setActivity([harvest]);
    setPositions([{ ...blendGroup, rewards: undefined }]);
    render(<RewardDistribution walletAddress="G..." />);
    const pendingCell = screen.getByText("Pending").closest("div");
    expect(pendingCell).toHaveTextContent("—");
  });

  it("surfaces activity-load error in destructive banner", () => {
    setActivity([], { error: new Error("boom") });
    setPositions([]);
    render(<RewardDistribution walletAddress="G..." />);
    expect(screen.getByText(/could not load rewards/i)).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });
});
