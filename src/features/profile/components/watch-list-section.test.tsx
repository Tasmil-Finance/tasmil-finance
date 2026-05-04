import { act, fireEvent, render, screen } from "@testing-library/react";
import { keyOf, useWatchList } from "@/store/use-watch-list";
import { WatchListSection } from "./watch-list-section";

const pushMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  localStorage.clear();
  useWatchList.setState({ items: [] });
  pushMock.mockClear();
});

describe("WatchListSection", () => {
  it("renders nothing when empty", () => {
    const { container } = render(<WatchListSection />);
    expect(container.textContent).not.toMatch(/watching/i);
  });

  it("renders rows when items present", () => {
    act(() => {
      useWatchList.getState().addAsset({ symbol: "BLND", contractId: "C_BLND" });
      useWatchList.getState().addAsset({ symbol: "AQUA", contractId: "C_AQUA" });
    });
    render(<WatchListSection />);
    expect(screen.getByText("BLND")).toBeInTheDocument();
    expect(screen.getByText("AQUA")).toBeInTheDocument();
  });

  it("clicking remove drops the asset by composite key", () => {
    act(() =>
      useWatchList.getState().addAsset({ symbol: "BLND", contractId: "C_BLND" })
    );
    render(<WatchListSection />);
    const removeBtn = screen.getByRole("button", { name: /remove blnd/i });
    fireEvent.click(removeBtn);
    const k = keyOf({ symbol: "BLND", chain: "stellar", contractId: "C_BLND" });
    expect(useWatchList.getState().isWatched(k)).toBe(false);
  });

  it("clicking row body navigates to aggregator with stored chain", () => {
    act(() =>
      useWatchList.getState().addAsset({ symbol: "BLND", contractId: "C_BLND" })
    );
    render(<WatchListSection />);
    const rowBtn = screen.getByRole("button", { name: /open blnd in aggregator/i });
    fireEvent.click(rowBtn);
    expect(pushMock).toHaveBeenCalledWith("/aggregator?tokenIn=BLND&chainIn=stellar");
  });
});
