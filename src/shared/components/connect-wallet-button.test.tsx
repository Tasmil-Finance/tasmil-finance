import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectWalletButton } from "./connect-wallet-button";

jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => mockWallet(),
}));
jest.mock("@/features/credits/use-credits", () => ({
  useCredits: () => mockCredits(),
}));
jest.mock("@/shared/config/stellar", () => ({
  isMainnet: true,
  getExplorerUrl: (_kind: string, addr: string) => `https://stellar.expert/${addr}`,
}));
jest.mock("./replay-menu-item", () => ({
  ReplayMenuItem: () => <div data-testid="replay-menu-item" />,
}));

const mockWallet = jest.fn();
const mockCredits = jest.fn();

beforeEach(() => {
  mockWallet.mockReturnValue({
    isConnected: false,
    address: null,
    displayAddress: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
  });
  mockCredits.mockReturnValue({ data: { credits: 1247 }, isLoading: false });
});

describe("ConnectWalletButton variant='topbar'", () => {
  it("renders Connect Wallet button when disconnected", () => {
    render(<ConnectWalletButton variant="topbar" />);
    expect(screen.getByTestId("connect-wallet")).toHaveTextContent(/connect wallet/i);
  });

  it("renders pill with gradient avatar + displayAddress when connected", () => {
    mockWallet.mockReturnValue({
      isConnected: true,
      address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVWXY",
      displayAddress: "GABC…XY",
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    render(<ConnectWalletButton variant="topbar" />);
    const trigger = screen.getByTestId("wallet-connected");
    expect(trigger).toHaveTextContent("GABC…XY");
    expect(trigger.querySelector(".bg-gradient-to-br")).not.toBeNull();
  });

  it("opens dropdown with Credits row showing formatted balance", async () => {
    mockWallet.mockReturnValue({
      isConnected: true,
      address: "GABC123",
      displayAddress: "GABC…123",
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    const user = userEvent.setup();
    render(<ConnectWalletButton variant="topbar" />);
    await user.click(screen.getByTestId("wallet-connected"));
    const creditsRow = await screen.findByTestId("wallet-credits-row");
    expect(creditsRow).toHaveTextContent("Credits");
    expect(creditsRow).toHaveTextContent("1,247");
  });

  it("Credits row shows em-dash while loading", async () => {
    mockWallet.mockReturnValue({
      isConnected: true,
      address: "GABC123",
      displayAddress: "GABC…123",
      connect: jest.fn(),
      disconnect: jest.fn(),
    });
    mockCredits.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<ConnectWalletButton variant="topbar" />);
    await user.click(screen.getByTestId("wallet-connected"));
    const creditsRow = await screen.findByTestId("wallet-credits-row");
    expect(creditsRow).toHaveTextContent("—");
  });
});
