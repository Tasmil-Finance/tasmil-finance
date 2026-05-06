import { act, render, screen } from "@testing-library/react";
import { useWatchList } from "@/store/use-watch-list";
import type { WalletToken } from "../../hooks/use-wallet-tokens";
import { TokenList } from "../token-list";

// Heavy children that do their own data fetching aren't relevant to this test.
jest.mock("../add-asset-dialog", () => ({ AddAssetDialog: () => null }));
jest.mock("../add-trustline-dialog", () => ({ AddTrustlineDialog: () => null }));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const SAMPLE_TOKEN: WalletToken = {
  assetCode: "USDC",
  assetIssuer: "GA...USDC",
  assetType: "credit_alphanum4",
  balance: 100,
  price: 1,
  valueUsd: 100,
};

beforeEach(() => {
  localStorage.clear();
  useWatchList.setState({ items: [] });
  act(() => {
    useWatchList.getState().addAsset({ symbol: "BLND" });
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("TokenList", () => {
  it("renders WatchListSection chip + empty-state copy when tokens array is empty", () => {
    render(<TokenList tokens={[]} totalUsd={0} isLoading={false} />);

    expect(screen.getByRole("button", { name: /Open BLND in aggregator/i })).toBeInTheDocument();
    expect(screen.getByText(/No token balances found/i)).toBeInTheDocument();
  });

  it("renders WatchListSection chip + token row when tokens array is non-empty", () => {
    render(<TokenList tokens={[SAMPLE_TOKEN]} totalUsd={100} isLoading={false} />);

    expect(screen.getByRole("button", { name: /Open BLND in aggregator/i })).toBeInTheDocument();
    expect(screen.getAllByText(/USDC/).length).toBeGreaterThan(0);
  });

  it("renders Watch Asset and Add Trustline buttons in BOTH branches", () => {
    const { rerender } = render(<TokenList tokens={[]} totalUsd={0} isLoading={false} />);

    expect(screen.getByRole("button", { name: /Watch Asset/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Trustline/i })).toBeInTheDocument();

    rerender(<TokenList tokens={[SAMPLE_TOKEN]} totalUsd={100} isLoading={false} />);

    expect(screen.getByRole("button", { name: /Watch Asset/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Trustline/i })).toBeInTheDocument();
  });
});
