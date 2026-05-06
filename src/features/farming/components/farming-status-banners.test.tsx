import { fireEvent, render, screen } from "@testing-library/react";
import { FarmingStatusBanners } from "./farming-status-banners";

describe("FarmingStatusBanners", () => {
  it("renders HALTED banner", () => {
    render(
      <FarmingStatusBanners
        status="HALTED"
        balanceStale={false}
        sessionKeyStale={false}
        onRefresh={() => {}}
        onDeposit={() => {}}
      />
    );
    expect(screen.getByText(/bot halted/i)).toBeInTheDocument();
  });

  it("renders AWAITING_FUND banner with Deposit action", () => {
    const onDeposit = jest.fn();
    render(
      <FarmingStatusBanners
        status="AWAITING_FUND"
        balanceStale={false}
        sessionKeyStale={false}
        onRefresh={() => {}}
        onDeposit={onDeposit}
      />
    );
    expect(screen.getByText(/unfunded/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /deposit/i }));
    expect(onDeposit).toHaveBeenCalled();
  });

  it("renders sessionKeyStale banner with Refresh action", () => {
    const onRefresh = jest.fn();
    render(
      <FarmingStatusBanners
        status="ACTIVE"
        balanceStale={false}
        sessionKeyStale={true}
        onRefresh={onRefresh}
        onDeposit={() => {}}
      />
    );
    expect(screen.getByText(/new yield strategies/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /refresh/i }));
    expect(onRefresh).toHaveBeenCalled();
  });

  it("renders balanceStale banner", () => {
    render(
      <FarmingStatusBanners
        status="ACTIVE"
        balanceStale={true}
        sessionKeyStale={false}
        onRefresh={() => {}}
        onDeposit={() => {}}
      />
    );
    expect(screen.getByText(/balance is stale/i)).toBeInTheDocument();
  });

  it("renders nothing when ACTIVE, no stale flags", () => {
    const { container } = render(
      <FarmingStatusBanners
        status="ACTIVE"
        balanceStale={false}
        sessionKeyStale={false}
        onRefresh={() => {}}
        onDeposit={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("stacks multiple banners in priority order: HALTED first", () => {
    render(
      <FarmingStatusBanners
        status="HALTED"
        balanceStale={true}
        sessionKeyStale={true}
        onRefresh={() => {}}
        onDeposit={() => {}}
      />
    );
    const banners = screen.getAllByRole("alert");
    expect(banners[0]).toHaveTextContent(/bot halted/i);
  });
});
