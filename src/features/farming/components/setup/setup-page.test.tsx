import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStellarBalances } from "@/features/account/hooks/use-stellar-balance";
import { usePresets } from "@/features/account/hooks/use-account-api";
import { useWalletStore } from "@/store/use-wallet";
import { useFarmingActions } from "@/features/farming/hooks/use-farming-actions";
import { SetupPage } from "./setup-page";

const replace = jest.fn();
jest.mock("@/features/account/hooks/use-stellar-balance");
jest.mock("@/features/account/hooks/use-account-api");
jest.mock("@/store/use-wallet");
jest.mock("@/features/farming/hooks/use-farming-actions");
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace }),
  useSearchParams: () => new URLSearchParams(),
}));
const mockUseWallet = jest.fn();
jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => mockUseWallet(),
}));
jest.mock("./step-create-account", () => ({
  StepCreateAccount: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>
      mock-create-account
    </button>
  ),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
  sessionStorage.clear();
  replace.mockClear();
  (useWalletStore as unknown as jest.Mock).mockReturnValue({ account: "GABC" });
  mockUseWallet.mockReturnValue({ isConnected: true, connect: jest.fn() });
  (useStellarBalances as jest.Mock).mockReturnValue({ data: { usdc: 100, xlm: 200 } });
  (usePresets as jest.Mock).mockReturnValue({
    data: [
      { name: "Safe", estimatedApy: 3.1, poolCount: 1, poolTypes: [], risks: [], topPools: [] },
      { name: "Balanced", estimatedApy: 5.4, poolCount: 3, poolTypes: [], risks: [], topPools: [] },
      { name: "Aggressive", estimatedApy: 8.8, poolCount: 4, poolTypes: [], risks: [], topPools: [] },
    ],
  });
  (useFarmingActions as jest.Mock).mockReturnValue({
    fund: jest.fn().mockResolvedValue(true),
    isPending: false,
  });
});

describe("SetupPage", () => {
  it("auto-advances past Step 1 when already connected", () => {
    render(<SetupPage />, { wrapper });
    expect(screen.getByRole("heading", { name: /tasmil agent strategy/i })).toBeInTheDocument();
  });

  it("walks Strategy -> Create Account -> Deposit -> Done", async () => {
    render(<SetupPage />, { wrapper });
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByRole("button", { name: /mock-create-account/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /mock-create-account/i }));
    expect(screen.getByText(/your deposit/i)).toBeInTheDocument();
  });

  it("shows Step 1 connect screen when wallet disconnected", () => {
    mockUseWallet.mockReturnValue({ isConnected: false, connect: jest.fn() });
    render(<SetupPage />, { wrapper });
    expect(screen.getByRole("heading", { name: /get started/i })).toBeInTheDocument();
  });
});
