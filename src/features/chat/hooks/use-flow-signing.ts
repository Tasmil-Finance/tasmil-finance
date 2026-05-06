"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { checkWalletNetwork, parseSigningError } from "@/lib/stellar-network-check";
import { activeNetwork } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";

export type FlowStepStatus = "pending" | "signing" | "submitting" | "confirmed" | "failed";

export interface FlowStepResult {
  stepIndex: number;
  status: FlowStepStatus;
  txHash?: string;
  error?: string;
}

export interface FlowSigningResult {
  success: boolean;
  stepResults: FlowStepResult[];
  error?: string;
}

interface UseFlowSigningReturn {
  /** Sign and submit an array of XDR strings sequentially */
  signFlow: (xdrs: string[]) => Promise<FlowSigningResult>;
  /** Whether any step is currently being signed/submitted */
  isSubmitting: boolean;
  /** Per-step status tracking */
  stepResults: FlowStepResult[];
  /** Current step index being processed (0-based) */
  currentStep: number;
  /** Total steps in current flow */
  totalSteps: number;
  /** Reset all state for a new flow */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Helpers (pure / module-level to reduce cognitive complexity in the hook)
// ---------------------------------------------------------------------------

function isUserRejection(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes("rejected") || lower.includes("denied") || lower.includes("cancel");
}

function failStep(index: number, error: string): FlowStepResult {
  return { stepIndex: index, status: "failed", error };
}

async function submitSignedXdr(signedXdr: string): Promise<{ hash: string }> {
  const { TransactionBuilder, Horizon } = await import("@stellar/stellar-sdk");
  const signedTx = TransactionBuilder.fromXDR(signedXdr, activeNetwork.networkPassphrase);

  // Detect classic vs Soroban: if ALL operations are non-invokeHostFunction
  // (e.g. changeTrust, payment) → submit via Horizon.  Otherwise → Soroban RPC.
  const ops = (signedTx as any).operations ?? [];
  const isClassic = ops.length > 0 && ops.every((op: any) => op.type !== "invokeHostFunction");

  if (isClassic) {
    const horizon = new Horizon.Server(activeNetwork.horizonUrl, {
      allowHttp: activeNetwork.horizonUrl.startsWith("http://"),
    });
    const response = await horizon.submitTransaction(signedTx as any);
    return { hash: response.hash };
  }

  // Soroban operations (invokeHostFunction) → submit via Soroban RPC
  const { getSorobanClient } = await import("@/lib/stellar-client");
  const soroban = getSorobanClient();
  const response = await soroban.sendTransaction(signedTx as any);

  if (response.status === "PENDING") {
    return { hash: response.hash };
  }
  throw new Error(`Transaction failed with status: ${response.status}`);
}

/** Handle signing errors, show appropriate toast, and return a failure result. */
function handleSignError(
  i: number,
  signErr: unknown,
  results: FlowStepResult[]
): FlowSigningResult {
  const msg = parseSigningError(signErr);
  const rejected = isUserRejection(msg);
  const errorMsg = rejected ? "Transaction rejected by user" : msg;

  results[i] = failStep(i, errorMsg);

  if (rejected) {
    toast.error("Transaction rejected", { description: "You cancelled the transaction" });
  } else {
    toast.error(`Step ${i + 1} signing failed`, { description: msg });
  }

  return { success: false, stepResults: results, error: errorMsg };
}

/** Sign a single XDR: network check + wallet sign. Returns the signed XDR or null on error. */
async function signStepXdr(
  xdr: string,
  signTransaction: (xdr: string) => Promise<string>
): Promise<string> {
  await checkWalletNetwork();
  return signTransaction(xdr);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFlowSigning(): UseFlowSigningReturn {
  const { signTransaction } = useWallet();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepResults, setStepResults] = useState<FlowStepResult[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setStepResults([]);
    setCurrentStep(0);
    setTotalSteps(0);
  }, []);

  const signFlow = useCallback(
    async (xdrs: string[]): Promise<FlowSigningResult> => {
      if (xdrs.length === 0) {
        return { success: true, stepResults: [] };
      }

      const results: FlowStepResult[] = xdrs.map((_, i) => ({
        stepIndex: i,
        status: "pending" as FlowStepStatus,
      }));
      setStepResults([...results]);
      setTotalSteps(xdrs.length);
      setCurrentStep(0);
      setIsSubmitting(true);

      const failAndStop = (i: number, msg: string, toastTitle: string): FlowSigningResult => {
        results[i] = failStep(i, msg);
        setStepResults([...results]);
        setIsSubmitting(false);
        toast.error(toastTitle, { description: msg });
        return { success: false, stepResults: results, error: msg };
      };

      for (let i = 0; i < xdrs.length; i++) {
        setCurrentStep(i);
        results[i] = { stepIndex: i, status: "signing" };
        setStepResults([...results]);

        // Sign phase
        let signedXdr: string;
        try {
          signedXdr = await signStepXdr(xdrs[i]!, signTransaction);
        } catch (err) {
          const result = handleSignError(i, err, results);
          setStepResults([...results]);
          setIsSubmitting(false);
          return result;
        }

        // Submit phase
        results[i] = { stepIndex: i, status: "submitting" };
        setStepResults([...results]);
        toast.info(`Submitting step ${i + 1} of ${xdrs.length}...`);

        try {
          const { hash } = await submitSignedXdr(signedXdr);
          results[i] = { stepIndex: i, status: "confirmed", txHash: hash };
          setStepResults([...results]);
          toast.success(`Step ${i + 1} submitted`, {
            description: `Hash: ${hash.slice(0, 8)}...`,
          });
        } catch (submitErr) {
          return failAndStop(i, parseSigningError(submitErr), `Step ${i + 1} submission failed`);
        }
      }

      setIsSubmitting(false);
      toast.success("All transactions submitted successfully!");
      return { success: true, stepResults: results };
    },
    [signTransaction]
  );

  return {
    signFlow,
    isSubmitting,
    stepResults,
    currentStep,
    totalSteps,
    reset,
  };
}
