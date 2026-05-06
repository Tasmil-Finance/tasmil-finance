import { renderHook } from "@testing-library/react";
import type { ProtocolPositionGroup, VaultPnL } from "../use-defi-positions";
import { useProtocolStats } from "../use-protocol-stats";

jest.mock("../use-defi-positions", () => ({
  useDefiPositions: jest.fn(),
}));
import { useDefiPositions } from "../use-defi-positions";

const mockHook = useDefiPositions as unknown as jest.Mock;

function setHook(args: {
  groups: ProtocolPositionGroup[];
  vaultPnl: VaultPnL | null;
  totalValueUsd: number;
  isLoading?: boolean;
}) {
  mockHook.mockReturnValue({
    groups: args.groups,
    vaultPnl: args.vaultPnl,
    totalValueUsd: args.totalValueUsd,
    isLoading: args.isLoading ?? false,
    loadingProtocols: [],
  });
}

const blendGroup: ProtocolPositionGroup = {
  protocol: "blend",
  displayName: "Blend",
  icon: null,
  totalValueUsd: 800,
  positions: [
    { name: "Blend USDC", type: "supply", asset: "USDC", valueUsd: 500 },
    { name: "Blend XLM", type: "supply", asset: "XLM", valueUsd: 300 },
  ],
};

const soroswapGroup: ProtocolPositionGroup = {
  protocol: "soroswap",
  displayName: "Soroswap",
  icon: null,
  totalValueUsd: 447.83,
  positions: [{ name: "XLM/USDC", type: "lp", asset: "XLM/USDC", valueUsd: 447.83 }],
};

const vaultPnl: VaultPnL = {
  profitUsd: 47.83,
  profitPercent: 3.99,
  totalDepositedUsd: 1500,
  totalWithdrawnUsd: 300,
  netDepositsUsd: 1200,
  currentApy: 8.42,
};

describe("useProtocolStats", () => {
  beforeEach(() => mockHook.mockReset());

  it("derives all 4 KPIs from useDefiPositions output", () => {
    setHook({
      groups: [blendGroup, soroswapGroup],
      vaultPnl,
      totalValueUsd: 1247.83,
    });
    const { result } = renderHook(() => useProtocolStats("G..."));

    expect(result.current.tvl).toBe("$1,247.83");
    expect(result.current.netDeposits).toBe("$1,200.00");
    expect(result.current.positionsCount).toBe("3 / 2");
    expect(result.current.blendedApy).toBe("8.42%");
    expect(result.current.isLoading).toBe(false);
  });

  it("returns em-dash for VaultPnL-derived KPIs when vaultPnl is null", () => {
    setHook({
      groups: [blendGroup],
      vaultPnl: null,
      totalValueUsd: 800,
    });
    const { result } = renderHook(() => useProtocolStats("G..."));

    expect(result.current.tvl).toBe("$800.00");
    expect(result.current.netDeposits).toBe("—");
    expect(result.current.blendedApy).toBe("—");
    expect(result.current.positionsCount).toBe("2 / 1");
  });

  it("propagates isLoading", () => {
    setHook({
      groups: [],
      vaultPnl: null,
      totalValueUsd: 0,
      isLoading: true,
    });
    const { result } = renderHook(() => useProtocolStats("G..."));

    expect(result.current.isLoading).toBe(true);
  });

  it("omits empty groups from protocols count", () => {
    setHook({
      groups: [blendGroup, { ...soroswapGroup, positions: [] }],
      vaultPnl,
      totalValueUsd: 800,
    });
    const { result } = renderHook(() => useProtocolStats("G..."));

    expect(result.current.positionsCount).toBe("2 / 1");
  });

  it("memoizes result across re-renders with stable inputs", () => {
    const groups = [blendGroup];
    setHook({ groups, vaultPnl, totalValueUsd: 800 });
    const { result, rerender } = renderHook(() => useProtocolStats("G..."));

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
