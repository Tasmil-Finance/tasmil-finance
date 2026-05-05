import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DiscoveredPool } from "../../types";
import { ProtocolPoolsExpand } from "./protocol-pools-expand";

const pools: DiscoveredPool[] = [
  {
    id: "blend-usdc",
    protocol: "blend",
    poolType: "lending",
    poolAddress: "C…",
    strategyContractAddress: "C…",
    asset: "USDC",
    assetSymbol: "USDC",
    currentApy: 0.0486,
    tvlUsd: 50_000_000,
    riskScore: 2,
    enabled: true,
    lastUpdated: "2026-01-01T00:00:00Z",
  },
  {
    id: "blend-xlm",
    protocol: "blend",
    poolType: "lending",
    poolAddress: "C…",
    strategyContractAddress: "C…",
    asset: "XLM",
    assetSymbol: "XLM",
    currentApy: 0.0321,
    tvlUsd: 31_000_000,
    riskScore: 2,
    enabled: true,
    lastUpdated: "2026-01-01T00:00:00Z",
  },
];

describe("ProtocolPoolsExpand", () => {
  it("renders one row per pool with checkbox state", () => {
    render(
      <ProtocolPoolsExpand pools={pools} excluded={[]} onChange={jest.fn()} />
    );
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
    expect(screen.getAllByRole("checkbox").every((c) => (c as HTMLInputElement).checked)).toBe(true);
  });

  it("emits the new excluded list on un-check", async () => {
    const onChange = jest.fn();
    render(<ProtocolPoolsExpand pools={pools} excluded={[]} onChange={onChange} />);
    await userEvent.click(screen.getAllByRole("checkbox")[1]!);
    expect(onChange).toHaveBeenCalledWith(["blend-xlm"]);
  });
});
