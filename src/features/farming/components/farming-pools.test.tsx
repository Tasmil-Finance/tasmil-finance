import { render, screen } from "@testing-library/react";
import type { DiscoveredPool } from "../types";
import { FarmingPools } from "./farming-pools";

const POOLS_GRID = "grid-cols-[2fr_1fr_1fr_1fr_80px]";

const samplePool: DiscoveredPool = {
  id: "p1",
  protocol: "blend",
  poolAddress: "C...",
  poolType: "lending",
  asset: "USDC",
  assetSymbol: "USDC",
  pairedAssetSymbol: undefined,
  currentApy: 0.05,
  tvlUsd: 1_000_000,
  riskScore: 3,
  strategyContractAddress: "C...",
  enabled: true,
  lastUpdated: new Date().toISOString(),
};

describe("FarmingPools", () => {
  it("skeleton + data rows share column template", () => {
    const { container, rerender } = render(<FarmingPools pools={[]} isLoading={true} />);
    const skeletonRows = container.querySelectorAll('[data-pools-row="true"]');
    expect(skeletonRows.length).toBeGreaterThan(0);
    skeletonRows.forEach((row) => expect(row.className).toContain(POOLS_GRID));

    rerender(<FarmingPools pools={[samplePool]} isLoading={false} />);
    const dataRows = container.querySelectorAll('[data-pools-row="true"]');
    expect(dataRows.length).toBeGreaterThan(0);
    dataRows.forEach((row) => expect(row.className).toContain(POOLS_GRID));
  });

  it("renders pool name and APY", () => {
    render(<FarmingPools pools={[samplePool]} isLoading={false} />);
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("5.00%")).toBeInTheDocument();
  });
});

const usdcPool = { ...samplePool, id: "p-usdc", assetSymbol: "USDC" } as DiscoveredPool;
const xlmPool = { ...samplePool, id: "p-xlm", assetSymbol: "XLM" } as DiscoveredPool;

describe("FarmingPools assetFilter", () => {
  it("renders both pools when no filter", () => {
    const { container } = render(<FarmingPools pools={[usdcPool, xlmPool]} isLoading={false} />);
    const dataRows = container.querySelectorAll('[data-pools-row="true"]');
    expect(dataRows.length).toBe(2);
  });

  it("filters to USDC pools when assetFilter=USDC", () => {
    const { container } = render(
      <FarmingPools pools={[usdcPool, xlmPool]} isLoading={false} assetFilter="USDC" />,
    );
    const dataRows = container.querySelectorAll('[data-pools-row="true"]');
    expect(dataRows.length).toBe(1);
  });

  it("renders empty state when no pools match filter", () => {
    render(<FarmingPools pools={[xlmPool]} isLoading={false} assetFilter="USDC" />);
    expect(screen.getByText(/no depositable pools/i)).toBeInTheDocument();
  });
});
