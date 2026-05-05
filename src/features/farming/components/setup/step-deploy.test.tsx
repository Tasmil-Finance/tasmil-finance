import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useDeployAccount,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "@/features/account/hooks/use-account-api";
import { StepDeploy } from "./step-deploy";

jest.mock("@/features/account/hooks/use-account-api");
jest.mock("@creit.tech/stellar-wallets-kit/sdk", () => ({
  StellarWalletsKit: {
    signTransaction: jest.fn().mockResolvedValue({ signedTxXdr: "signed-xdr" }),
  },
}));

const mockMutation = (onSuccess?: () => void) => ({
  mutateAsync: jest.fn().mockResolvedValue({ xdr: "deploy-xdr", setupTxs: ["setup-xdr"] }),
  isPending: false,
  ...(onSuccess ? { onSuccess } : {}),
});

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const qc = new QueryClient();
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

describe("StepDeploy", () => {
  beforeEach(() => {
    (useDeployAccount as jest.Mock).mockReturnValue(mockMutation());
    (useSetupAccount as jest.Mock).mockReturnValue(mockMutation());
    (useSubmitTx as jest.Mock).mockReturnValue(mockMutation());
    (useUpdatePreset as jest.Mock).mockReturnValue(mockMutation());
  });

  it("renders review block + Create CTA", () => {
    render(
      <StepDeploy
        publicKey="GABC"
        asset="USDC"
        mode="AUTO"
        preset="Balanced"
        estimatedApy={5.4}
        onComplete={jest.fn()}
      />,
      { wrapper }
    );
    expect(screen.getByText(/USDC/)).toBeInTheDocument();
    expect(screen.getByText(/Auto/)).toBeInTheDocument();
    expect(screen.getByText(/Balanced/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create smart account/ })).toBeInTheDocument();
  });

  it("calls onComplete on full happy-path", async () => {
    const onComplete = jest.fn();
    render(
      <StepDeploy
        publicKey="GABC"
        asset="USDC"
        mode="AUTO"
        preset="Balanced"
        estimatedApy={5.4}
        onComplete={onComplete}
      />,
      { wrapper }
    );
    await userEvent.click(screen.getByRole("button", { name: /Create smart account/ }));
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
  });

  it("classifies user-rejection errors and shows Retry", async () => {
    (useDeployAccount as jest.Mock).mockReturnValue({
      mutateAsync: jest
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error("User rejected"), { userRejected: true })),
      isPending: false,
    });
    render(
      <StepDeploy
        publicKey="GABC"
        asset="USDC"
        mode="AUTO"
        preset="Balanced"
        estimatedApy={5.4}
        onComplete={jest.fn()}
      />,
      { wrapper }
    );
    await userEvent.click(screen.getByRole("button", { name: /Create smart account/ }));
    expect(await screen.findByText(/Signing was cancelled/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
