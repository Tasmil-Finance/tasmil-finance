import { fireEvent, render, screen } from "@testing-library/react";
import type { ActivityItem } from "@/features/account/types";
import { ProtocolHistoryView } from "./protocol-history";

jest.mock("../hooks/use-account-activity-infinite", () => ({
  useAccountActivityInfinite: jest.fn(),
}));

import { useAccountActivityInfinite } from "../hooks/use-account-activity-infinite";

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

describe("ProtocolHistoryView", () => {
  beforeEach(() => {
    mockHook.mockReset();
  });

  it("renders all protocol activities", () => {
    mockReturn([blendDeposit, soroswapRebalance]);
    render(<ProtocolHistoryView walletAddress="G..." />);
    expect(screen.getAllByTestId("activity-row")).toHaveLength(2);
  });

  it("filters to selected protocol when chip clicked", () => {
    mockReturn([blendDeposit, soroswapRebalance]);
    render(<ProtocolHistoryView walletAddress="G..." />);
    fireEvent.click(screen.getByRole("radio", { name: /^blend$/i }));
    expect(screen.getAllByTestId("activity-row")).toHaveLength(1);
  });

  it("shows empty state when no activities", () => {
    mockReturn([]);
    render(<ProtocolHistoryView walletAddress="G..." />);
    expect(screen.getByText(/no protocol activity/i)).toBeInTheDocument();
  });
});
