import { render, screen, fireEvent, act } from "@testing-library/react";
import { WatchListSection } from "./watch-list-section";
import { useWatchList } from "@/store/use-watch-list";

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
      useWatchList.getState().addAsset({ symbol: "BLND" });
      useWatchList.getState().addAsset({ symbol: "AQUA" });
    });
    render(<WatchListSection />);
    expect(screen.getByText("BLND")).toBeInTheDocument();
    expect(screen.getByText("AQUA")).toBeInTheDocument();
  });

  it("clicking remove drops the asset", () => {
    act(() => useWatchList.getState().addAsset({ symbol: "BLND" }));
    render(<WatchListSection />);
    const removeBtn = screen.getByRole("button", { name: /remove blnd/i });
    fireEvent.click(removeBtn);
    expect(useWatchList.getState().isWatched("BLND")).toBe(false);
  });

  it("clicking row body navigates to aggregator", () => {
    act(() => useWatchList.getState().addAsset({ symbol: "BLND" }));
    render(<WatchListSection />);
    const rowBtn = screen.getByRole("button", { name: /open blnd in aggregator/i });
    fireEvent.click(rowBtn);
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("/aggregator?tokenIn=BLND&chainIn=stellar"),
    );
  });
});
