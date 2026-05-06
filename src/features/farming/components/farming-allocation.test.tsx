import { render } from "@testing-library/react";
import { FarmingAllocation } from "./farming-allocation";

const positions = [
  {
    poolName: "Blend USDC",
    protocol: "blend",
    poolType: "lending",
    allocationPercent: 50,
    valueUsd: 500,
    apy: 0.05,
  },
  {
    poolName: "Soroswap LP",
    protocol: "soroswap",
    poolType: "lp",
    allocationPercent: 50,
    valueUsd: 500,
    apy: 0.07,
  },
];

describe("FarmingAllocation color stability", () => {
  it("assigns same color to same protocol regardless of order", () => {
    const { container: c1 } = render(
      <FarmingAllocation positions={positions} unallocatedWalletUsd={0} isLoading={false} />
    );
    const { container: c2 } = render(
      <FarmingAllocation
        positions={[...positions].reverse()}
        unallocatedWalletUsd={0}
        isLoading={false}
      />
    );
    const swatches1 = c1.querySelectorAll('[data-protocol-swatch="blend"]');
    const swatches2 = c2.querySelectorAll('[data-protocol-swatch="blend"]');
    expect(swatches1.length).toBeGreaterThan(0);
    expect(swatches2.length).toBeGreaterThan(0);
    expect(swatches1[0]?.getAttribute("style")).toBe(swatches2[0]?.getAttribute("style"));
  });
});
