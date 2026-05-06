import { fireEvent, render, screen } from "@testing-library/react";
import type { DiscoveredPool } from "../types";
import { PoolDetailDrawer } from "./pool-detail-drawer";

const samplePool = {
  id: "p1",
  protocol: "soroswap",
  poolAddress: "C...",
  poolType: "lp",
  asset: "USDC",
  assetSymbol: "USDC",
  pairedAssetSymbol: "XLM",
  currentApy: 0.1234,
  tvlUsd: 4_200_000,
  riskScore: 3,
  strategyContractAddress: "C...",
  enabled: true,
  lastUpdated: new Date().toISOString(),
} as unknown as DiscoveredPool;

describe("PoolDetailDrawer", () => {
  const noop = () => {};

  it("does not render content when closed", () => {
    render(
      <PoolDetailDrawer
        open={false}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={0}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.queryByText(/Soroswap/i)).toBeNull();
  });

  it("renders pool name, APY, TVL when open", () => {
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={0}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.getByText(/USDC\/XLM/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.34%/)).toBeInTheDocument();
    expect(screen.getByText(/\$4\.20M/)).toBeInTheDocument();
  });

  it("renders Deposit button when not revoked", () => {
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={0}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.getByRole("button", { name: /^deposit$/i })).toBeInTheDocument();
  });

  it("does not render Withdraw button when userPositionUsd is 0", () => {
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={0}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.queryByRole("button", { name: /withdraw/i })).toBeNull();
  });

  it("renders Withdraw button + Your Position when userPositionUsd > 0", () => {
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={1234.56}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.getByRole("button", { name: /withdraw/i })).toBeInTheDocument();
    expect(screen.getByText(/your position/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1,234\.56/)).toBeInTheDocument();
  });

  it("replaces Deposit with Reactivate Session when isRevoked", () => {
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={0}
        isRevoked={true}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.queryByRole("button", { name: /^deposit$/i })).toBeNull();
    expect(screen.getByRole("button", { name: /reactivate/i })).toBeInTheDocument();
  });

  it("invokes onDeposit with pool when Deposit clicked", () => {
    const onDeposit = jest.fn();
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={0}
        isRevoked={false}
        onDeposit={onDeposit}
        onWithdraw={noop}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^deposit$/i }));
    expect(onDeposit).toHaveBeenCalledWith(samplePool);
  });

  it("invokes onWithdraw with pool when Withdraw clicked", () => {
    const onWithdraw = jest.fn();
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={samplePool}
        userPositionUsd={500}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={onWithdraw}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /withdraw/i }));
    expect(onWithdraw).toHaveBeenCalledWith(samplePool);
  });

  it("renders nothing when pool is null even if open", () => {
    render(
      <PoolDetailDrawer
        open={true}
        onOpenChange={noop}
        pool={null}
        userPositionUsd={0}
        isRevoked={false}
        onDeposit={noop}
        onWithdraw={noop}
      />
    );
    expect(screen.queryByText(/your position/i)).toBeNull();
  });
});
