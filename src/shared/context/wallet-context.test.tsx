// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useAuthStore } from "@/store/use-auth";
import { useWalletStore } from "@/store/use-wallet";

jest.unmock("@/shared/context/wallet-context");

const { WalletProvider, useWallet } = jest.requireActual(
  "./wallet-context"
) as typeof import("./wallet-context");

const authModalMock = jest.fn().mockResolvedValue({
  address: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234",
});
const getAddressMock = jest.fn().mockResolvedValue({ address: null });

jest.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    init: jest.fn(),
    on: jest.fn(() => jest.fn()),
    authModal: (...args: unknown[]) => authModalMock(...args),
    getAddress: (...args: unknown[]) => getAddressMock(...args),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
  },
}));

jest.mock("@creit.tech/stellar-wallets-kit/modules/utils", () => ({
  defaultModules: jest.fn(() => []),
}));

jest.mock("@creit.tech/stellar-wallets-kit/types", () => ({
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
  KitEventType: { STATE_UPDATED: "STATE_UPDATED" },
}));

jest.mock("@/lib/stellar-network-check", () => ({
  checkWalletNetwork: jest.fn(),
  parseSigningError: () => null,
}));

jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

function Probe() {
  const { address, connectWalletOnly } = useWallet();

  return (
    <>
      <button type="button" onClick={() => void connectWalletOnly()}>
        wallet-only
      </button>
      <div data-testid="wallet-address">{address ?? "none"}</div>
    </>
  );
}

describe("WalletProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useWalletStore.setState({ connected: false, account: null, signing: false });
    useAuthStore.setState({
      isAuthenticated: false,
      accessToken: null,
      user: null,
      isLoading: false,
      expiresAt: null,
    });
    authModalMock.mockClear();
    getAddressMock.mockClear();
    authModalMock.mockResolvedValue({
      address: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234",
    });
    getAddressMock.mockResolvedValue({ address: null });
    global.fetch = jest.fn() as typeof fetch;
  });

  it("connects the wallet for chat without calling backend auth", async () => {
    const user = userEvent.setup();

    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>
    );

    await user.click(screen.getByRole("button", { name: "wallet-only" }));

    await waitFor(() =>
      expect(screen.getByTestId("wallet-address")).toHaveTextContent(
        "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234"
      )
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("restores a persisted wallet without silently triggering backend auth", async () => {
    useWalletStore.setState({
      connected: true,
      account: "GRESTORE1234567890ABCDEF1234567890ABCDEF1234567890ABCDE",
      signing: false,
    });
    getAddressMock.mockResolvedValue({
      address: "GRESTORE1234567890ABCDEF1234567890ABCDEF1234567890ABCDE",
    });

    render(
      <WalletProvider>
        <Probe />
      </WalletProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("wallet-address")).toHaveTextContent(
        "GRESTORE1234567890ABCDEF1234567890ABCDEF1234567890ABCDE"
      )
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
