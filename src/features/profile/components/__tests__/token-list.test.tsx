import { render, screen } from "@testing-library/react";
import type { WalletToken } from "../../hooks/use-wallet-tokens";
import { TokenList } from "../token-list";

jest.mock("../add-trustline-dialog", () => ({
  AddTrustlineDialog: () => null,
}));

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

afterEach(() => {
  jest.resetAllMocks();
});

describe("TokenList", () => {
  it("renders empty-state copy when tokens array is empty", () => {
    render(<TokenList tokens={[]} totalUsd={0} isLoading={false} />);
    expect(screen.getByText(/No token balances found/i)).toBeInTheDocument();
  });

  it("renders token row when tokens array is non-empty", () => {
    render(<TokenList tokens={[SAMPLE_TOKEN]} totalUsd={100} isLoading={false} />);
    expect(screen.getAllByText(/USDC/).length).toBeGreaterThan(0);
  });

  it("renders only the Add Trustline button (no Watch Asset)", () => {
    render(<TokenList tokens={[]} totalUsd={0} isLoading={false} />);
    expect(screen.getByRole("button", { name: /Add Trustline/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Watch Asset/i })).not.toBeInTheDocument();
  });
});
