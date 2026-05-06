import { fireEvent, render, screen } from "@testing-library/react";
import type { DiscoveredPool } from "../types";
import { FarmingPools } from "./farming-pools";

const POOLS_GRID = "grid-cols-[2fr_1fr_1fr_1fr_80px_24px]";

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
      <FarmingPools pools={[usdcPool, xlmPool]} isLoading={false} assetFilter="USDC" />
    );
    const dataRows = container.querySelectorAll('[data-pools-row="true"]');
    expect(dataRows.length).toBe(1);
  });

  it("renders empty state when no pools match filter", () => {
    render(<FarmingPools pools={[xlmPool]} isLoading={false} assetFilter="USDC" />);
    expect(screen.getByText(/no depositable pools/i)).toBeInTheDocument();
  });
});

describe("FarmingPools inPositionKeys", () => {
  const blendUsdcPool = {
    ...samplePool,
    id: "p-blend",
    protocol: "blend",
    assetSymbol: "USDC",
    pairedAssetSymbol: undefined,
  } as unknown as DiscoveredPool;
  const soroswapLpPool = {
    ...samplePool,
    id: "p-soro",
    protocol: "soroswap",
    assetSymbol: "USDC",
    pairedAssetSymbol: "XLM",
  } as unknown as DiscoveredPool;

  it("renders Active pill for matching protocol+derived-name key", () => {
    const inPositionKeys = new Set(["blend:USDC"]);
    render(
      <FarmingPools
        pools={[blendUsdcPool, soroswapLpPool]}
        isLoading={false}
        inPositionKeys={inPositionKeys}
      />
    );
    expect(screen.getAllByText(/^Active$/).length).toBe(1);
  });

  it("renders Active pill for paired-asset LP key", () => {
    const inPositionKeys = new Set(["soroswap:USDC/XLM"]);
    render(
      <FarmingPools
        pools={[blendUsdcPool, soroswapLpPool]}
        isLoading={false}
        inPositionKeys={inPositionKeys}
      />
    );
    expect(screen.getAllByText(/^Active$/).length).toBe(1);
  });

  it("renders no Active pill when key does not match", () => {
    const inPositionKeys = new Set(["aquarius:USDC"]);
    render(
      <FarmingPools
        pools={[blendUsdcPool, soroswapLpPool]}
        isLoading={false}
        inPositionKeys={inPositionKeys}
      />
    );
    expect(screen.queryByText(/^Active$/)).toBeNull();
  });

  it("matches with case-insensitive protocol on the row side", () => {
    const inPositionKeys = new Set(["blend:USDC"]);
    const upperPool = { ...blendUsdcPool, protocol: "BLEND" } as unknown as DiscoveredPool;
    render(<FarmingPools pools={[upperPool]} isLoading={false} inPositionKeys={inPositionKeys} />);
    expect(screen.getAllByText(/^Active$/).length).toBe(1);
  });
});

describe("FarmingPools onSelectPool", () => {
  const pool = {
    ...samplePool,
    id: "p-click",
    protocol: "blend",
    assetSymbol: "USDC",
  } as unknown as DiscoveredPool;

  it("invokes onSelectPool when row is clicked", () => {
    const onSelectPool = jest.fn();
    const { container } = render(
      <FarmingPools pools={[pool]} isLoading={false} onSelectPool={onSelectPool} />
    );
    const row = container.querySelector('[data-pools-row="true"]') as HTMLElement;
    fireEvent.click(row);
    expect(onSelectPool).toHaveBeenCalledTimes(1);
    expect(onSelectPool).toHaveBeenCalledWith(expect.objectContaining({ id: "p-click" }));
  });

  it("invokes onSelectPool when row receives Enter key", () => {
    const onSelectPool = jest.fn();
    const { container } = render(
      <FarmingPools pools={[pool]} isLoading={false} onSelectPool={onSelectPool} />
    );
    const row = container.querySelector('[data-pools-row="true"]') as HTMLElement;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onSelectPool).toHaveBeenCalledTimes(1);
  });

  it("row is not interactive when onSelectPool not provided", () => {
    const { container } = render(<FarmingPools pools={[pool]} isLoading={false} />);
    const row = container.querySelector('[data-pools-row="true"]') as HTMLElement;
    expect(row.getAttribute("role")).not.toBe("button");
    expect(row.getAttribute("tabindex")).toBeNull();
  });
});
