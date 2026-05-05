import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepStrategy } from "./step-strategy";

const presets = [
  { name: "Safe" as const, estimatedApy: 3.1, poolCount: 1, poolTypes: [], risks: [], topPools: [] },
  { name: "Balanced" as const, estimatedApy: 5.4, poolCount: 3, poolTypes: [], risks: [], topPools: [] },
  { name: "Aggressive" as const, estimatedApy: 8.8, poolCount: 4, poolTypes: [], risks: [], topPools: [] },
];

const defaultProps = {
  asset: "USDC" as const,
  mode: "AUTO" as const,
  preset: "Balanced" as const,
  customMarkets: [] as string[],
  balances: { usdc: 100, xlm: 200 },
  presets,
  onAssetChange: jest.fn(),
  onModeChange: jest.fn(),
  onPresetChange: jest.fn(),
  onCustomMarketsChange: jest.fn(),
};

describe("StepStrategy", () => {
  it("renders three sections: asset, mode, presets", () => {
    render(<StepStrategy {...defaultProps} />);
    expect(screen.getByText("Deposit asset")).toBeInTheDocument();
    expect(screen.getByText("Allocation mode")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /balanced/i })).toBeInTheDocument();
  });

  it("calls onAssetChange when XLM pill clicked", async () => {
    const onAssetChange = jest.fn();
    render(<StepStrategy {...defaultProps} onAssetChange={onAssetChange} />);
    await userEvent.click(screen.getByRole("button", { name: /xlm/i }));
    expect(onAssetChange).toHaveBeenCalledWith("XLM");
  });

  it("calls onPresetChange when Aggressive selected", async () => {
    const onPresetChange = jest.fn();
    render(<StepStrategy {...defaultProps} onPresetChange={onPresetChange} />);
    await userEvent.click(screen.getByRole("radio", { name: /aggressive/i }));
    expect(onPresetChange).toHaveBeenCalledWith("Aggressive");
  });

  it("CUSTOM mode shows pool picker instead of presets", () => {
    render(<StepStrategy {...defaultProps} mode="CUSTOM" />);
    expect(screen.queryByRole("radio", { name: /balanced/i })).toBeNull();
    expect(screen.getByText(/custom mode/i)).toBeInTheDocument();
  });
});
