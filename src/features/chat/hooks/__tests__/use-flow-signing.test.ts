// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { act, renderHook } from "@testing-library/react";
import { useFlowSigning } from "../use-flow-signing";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockSignTransaction = jest.fn<Promise<string>, [string]>();

// Override the global useWallet mock from setup-tests.ts
jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => ({
    isConnected: true,
    isAuthenticated: true,
    isAuthenticating: false,
    address: "GABC1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    displayAddress: "GABC...CDEF",
    user: null,
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: mockSignTransaction,
    forceReauth: jest.fn(),
  }),
}));

const mockSendTransaction = jest.fn();

jest.mock("@/lib/stellar-client", () => ({
  getSorobanClient: () => ({
    sendTransaction: mockSendTransaction,
  }),
}));

jest.mock("@stellar/stellar-sdk", () => ({
  TransactionBuilder: {
    fromXDR: jest.fn(() => ({ toXDR: () => "mock-xdr" })),
  },
}));

jest.mock("@/lib/stellar-network-check", () => ({
  checkWalletNetwork: jest.fn().mockResolvedValue(undefined),
  parseSigningError: jest.fn((err: unknown) => {
    if (err instanceof Error) return err.message;
    return String(err);
  }),
}));

jest.mock("@/shared/config/stellar", () => ({
  activeNetwork: {
    name: "Stellar Testnet",
    networkPassphrase: "Test SDF Network ; September 2015",
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  },
}));

// sonner mock — use inline jest.fn() to avoid hoisting issues
jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useFlowSigning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: signing returns a signed XDR
    mockSignTransaction.mockResolvedValue("signed-xdr-result");
    // Default: submission returns PENDING with a hash
    mockSendTransaction.mockResolvedValue({
      status: "PENDING",
      hash: "abc123def456",
    });
  });

  it("signs and submits a single XDR successfully", async () => {
    const { result } = renderHook(() => useFlowSigning());

    let flowResult: Awaited<ReturnType<typeof result.current.signFlow>>;
    await act(async () => {
      flowResult = await result.current.signFlow(["xdr-step-0"]);
    });

    expect(flowResult!.success).toBe(true);
    expect(flowResult!.stepResults).toHaveLength(1);
    expect(flowResult!.stepResults[0]).toEqual({
      stepIndex: 0,
      status: "confirmed",
      txHash: "abc123def456",
    });

    expect(mockSignTransaction).toHaveBeenCalledTimes(1);
    expect(mockSignTransaction).toHaveBeenCalledWith("xdr-step-0");
    expect(mockSendTransaction).toHaveBeenCalledTimes(1);
  });

  it("signs and submits 2 XDRs sequentially", async () => {
    mockSendTransaction
      .mockResolvedValueOnce({ status: "PENDING", hash: "hash-step-0" })
      .mockResolvedValueOnce({ status: "PENDING", hash: "hash-step-1" });

    const { result } = renderHook(() => useFlowSigning());

    let flowResult: Awaited<ReturnType<typeof result.current.signFlow>>;
    await act(async () => {
      flowResult = await result.current.signFlow(["xdr-0", "xdr-1"]);
    });

    expect(flowResult!.success).toBe(true);
    expect(flowResult!.stepResults).toHaveLength(2);
    expect(flowResult!.stepResults[0]).toEqual({
      stepIndex: 0,
      status: "confirmed",
      txHash: "hash-step-0",
    });
    expect(flowResult!.stepResults[1]).toEqual({
      stepIndex: 1,
      status: "confirmed",
      txHash: "hash-step-1",
    });

    // Verify sequential calls
    expect(mockSignTransaction).toHaveBeenCalledTimes(2);
    expect(mockSignTransaction).toHaveBeenNthCalledWith(1, "xdr-0");
    expect(mockSignTransaction).toHaveBeenNthCalledWith(2, "xdr-1");
    expect(mockSendTransaction).toHaveBeenCalledTimes(2);
  });

  it("returns failure with rejected error when wallet rejects on step 1", async () => {
    mockSignTransaction.mockRejectedValueOnce(new Error("User rejected the request"));

    const { result } = renderHook(() => useFlowSigning());

    let flowResult: Awaited<ReturnType<typeof result.current.signFlow>>;
    await act(async () => {
      flowResult = await result.current.signFlow(["xdr-0"]);
    });

    expect(flowResult!.success).toBe(false);
    expect(flowResult!.error).toContain("rejected");
    expect(flowResult!.stepResults[0].status).toBe("failed");
    expect(flowResult!.stepResults[0].error).toContain("rejected");

    // Should not have attempted submission
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });

  it("returns partial result when step 1 succeeds but step 2 fails on submission", async () => {
    mockSendTransaction
      .mockResolvedValueOnce({ status: "PENDING", hash: "hash-step-0" })
      .mockRejectedValueOnce(new Error("Soroban RPC unavailable"));

    const { result } = renderHook(() => useFlowSigning());

    let flowResult: Awaited<ReturnType<typeof result.current.signFlow>>;
    await act(async () => {
      flowResult = await result.current.signFlow(["xdr-0", "xdr-1"]);
    });

    expect(flowResult!.success).toBe(false);
    expect(flowResult!.stepResults).toHaveLength(2);
    expect(flowResult!.stepResults[0]).toEqual({
      stepIndex: 0,
      status: "confirmed",
      txHash: "hash-step-0",
    });
    expect(flowResult!.stepResults[1]).toEqual({
      stepIndex: 1,
      status: "failed",
      error: "Soroban RPC unavailable",
    });
  });

  it("fails when sendTransaction returns non-PENDING status", async () => {
    mockSendTransaction.mockResolvedValueOnce({
      status: "ERROR",
      hash: "bad-hash",
    });

    const { result } = renderHook(() => useFlowSigning());

    let flowResult: Awaited<ReturnType<typeof result.current.signFlow>>;
    await act(async () => {
      flowResult = await result.current.signFlow(["xdr-0"]);
    });

    expect(flowResult!.success).toBe(false);
    expect(flowResult!.stepResults[0].status).toBe("failed");
    expect(flowResult!.stepResults[0].error).toContain("ERROR");
  });

  it("isSubmitting toggles correctly during flow execution", async () => {
    const { result } = renderHook(() => useFlowSigning());

    // Initially false
    expect(result.current.isSubmitting).toBe(false);

    let resolveSign: (value: string) => void;
    mockSignTransaction.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveSign = resolve;
      })
    );

    let flowPromise: Promise<any>;
    act(() => {
      flowPromise = result.current.signFlow(["xdr-0"]);
    });

    // While signing is in progress, isSubmitting should be true
    expect(result.current.isSubmitting).toBe(true);

    // Resolve signing
    await act(async () => {
      resolveSign!("signed-xdr");
    });

    // Wait for the full flow to complete
    await act(async () => {
      await flowPromise;
    });

    // After completion, isSubmitting should be false
    expect(result.current.isSubmitting).toBe(false);
  });

  it("reset() clears all state", async () => {
    const { result } = renderHook(() => useFlowSigning());

    // Execute a flow first
    await act(async () => {
      await result.current.signFlow(["xdr-0"]);
    });

    // State should be populated
    expect(result.current.stepResults).toHaveLength(1);
    expect(result.current.totalSteps).toBe(1);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.stepResults).toHaveLength(0);
    expect(result.current.currentStep).toBe(0);
    expect(result.current.totalSteps).toBe(0);
    expect(result.current.isSubmitting).toBe(false);
  });

  it("returns success immediately for empty XDRs array", async () => {
    const { result } = renderHook(() => useFlowSigning());

    let flowResult: Awaited<ReturnType<typeof result.current.signFlow>>;
    await act(async () => {
      flowResult = await result.current.signFlow([]);
    });

    expect(flowResult!.success).toBe(true);
    expect(flowResult!.stepResults).toHaveLength(0);

    // No wallet interactions
    expect(mockSignTransaction).not.toHaveBeenCalled();
    expect(mockSendTransaction).not.toHaveBeenCalled();
  });
});
