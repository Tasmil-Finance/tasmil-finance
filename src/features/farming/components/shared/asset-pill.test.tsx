import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetPill } from "./asset-pill";

describe("AssetPill", () => {
  it("renders label + hint", () => {
    render(<AssetPill asset="USDC" hint="stablecoin" />);
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText(/stablecoin/i)).toBeInTheDocument();
  });

  it("toggles the active style when selected", () => {
    const { rerender } = render(<AssetPill asset="USDC" />);
    expect(screen.getByRole("button").className).not.toMatch(/border-primary/);
    rerender(<AssetPill asset="USDC" selected />);
    expect(screen.getByRole("button").className).toMatch(/border-primary/);
  });

  it("calls onSelect when clicked", async () => {
    const onSelect = jest.fn();
    render(<AssetPill asset="XLM" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("XLM");
  });

  it("disabled pill does not fire onSelect", async () => {
    const onSelect = jest.fn();
    render(<AssetPill asset="XLM" onSelect={onSelect} disabled />);
    await userEvent.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
