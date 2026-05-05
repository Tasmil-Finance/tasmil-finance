"use client";

import { useRef, useState } from "react";
import { activeNetwork } from "@/shared/config/stellar";
import type { DeploySubStep, RiskPreset } from "../types";
import {
  useDeployAccount,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "./use-account-api";

const DEFAULT_PRESET: RiskPreset = "Balanced";

interface SignResult {
  signedTxXdr?: string;
}

function assertSigned(signResult: SignResult | null | undefined): string {
  const xdr = signResult?.signedTxXdr;
  if (typeof xdr !== "string" || xdr.length === 0) {
    const err = new Error("User rejected transaction signing");
    (err as Error & { userRejected?: boolean }).userRejected = true;
    throw err;
  }
  return xdr;
}

export interface UseOnboardingDeployArgs {
  publicKey: string | null;
  selectedPreset: RiskPreset;
}

export interface UseOnboardingDeployResult {
  deploy: () => Promise<void>;
  retry: () => Promise<void>;
  clearError: () => void;
  isDeploying: boolean;
  deploySubStep: DeploySubStep;
  deployCompleted: boolean;
  setupCompleted: boolean;
  deployError: string | null;
  deployErrorWasRejection: boolean;
  /** True after the full deploy → setup → preset chain finished successfully. */
  allDone: boolean;
}

/**
 * Encapsulates the multi-TX onboarding flow:
 *   1. Deploy keeper-wallet contract (sign + submit)
 *   2. Configure session key (sign + submit)
 *   3. Apply chosen risk preset (best-effort)
 *
 * Surfaces sub-step state, classified errors, and a single deploy() entry.
 * Caller decides post-success routing (e.g. router.push("/farming")).
 */
export function useOnboardingDeploy({
  publicKey,
  selectedPreset,
}: UseOnboardingDeployArgs): UseOnboardingDeployResult {
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  const [deploySubStep, setDeploySubStep] = useState<DeploySubStep>("idle");
  const [deployCompleted, setDeployCompleted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployErrorWasRejection, setDeployErrorWasRejection] = useState(false);
  const [allDone, setAllDone] = useState(false);

  const flowInProgressRef = useRef(false);

  const getStellarKit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const passphrase = activeNetwork.networkPassphrase;
    return { StellarWalletsKit, passphrase };
  };

  const handleDeployTx = async (): Promise<boolean> => {
    if (!publicKey) return false;

    setDeploySubStep("building_deploy");
    const result = await deployAccount.mutateAsync(publicKey);

    if (!result?.xdr) {
      throw new Error("No deploy transaction returned from server");
    }

    setDeploySubStep("signing_deploy");
    const { StellarWalletsKit, passphrase } = await getStellarKit();
    const signed = await StellarWalletsKit.signTransaction(result.xdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });
    const signedTxXdr = assertSigned(signed);

    setDeploySubStep("submitting_deploy");
    await submitTx.mutateAsync({
      signedXdr: signedTxXdr,
      publicKey,
      txType: "deploy",
    });

    setDeployCompleted(true);
    return true;
  };

  const handleSetupTx = async (): Promise<boolean> => {
    if (!publicKey) return false;

    setDeploySubStep("building_setup");
    const setupResult = await setupAccount.mutateAsync(publicKey);
    const setupXdrs = setupResult?.setupTxs ?? [];

    if (setupXdrs.length === 0) {
      throw new Error("No setup transaction returned from server");
    }

    const setupXdr = setupXdrs[0];
    if (!setupXdr) {
      throw new Error("Invalid setup transaction payload");
    }

    setDeploySubStep("signing_setup");
    const { StellarWalletsKit, passphrase } = await getStellarKit();
    const signed = await StellarWalletsKit.signTransaction(setupXdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });
    const signedTxXdr = assertSigned(signed);

    setDeploySubStep("submitting_setup");
    await submitTx.mutateAsync({
      signedXdr: signedTxXdr,
      publicKey,
      txType: "setup",
    });

    setSetupCompleted(true);
    return true;
  };

  const applyChosenPreset = async (): Promise<boolean> => {
    if (!publicKey) return false;
    if (selectedPreset === DEFAULT_PRESET) return true;

    setDeploySubStep("applying_preset");
    await updatePreset.mutateAsync({
      publicKey,
      preset: selectedPreset.toUpperCase(),
    });
    return true;
  };

  const deploy = async () => {
    if (!publicKey || flowInProgressRef.current) return;

    flowInProgressRef.current = true;
    setDeployError(null);
    setDeployErrorWasRejection(false);

    let succeeded = false;
    try {
      if (!deployCompleted) await handleDeployTx();
      if (!setupCompleted) await handleSetupTx();
      try {
        await applyChosenPreset();
      } catch (presetErr: unknown) {
        const m = presetErr instanceof Error ? presetErr.message : String(presetErr);
        console.warn("Preset application failed; leaving account on default BALANCED:", m);
      }
      setDeploySubStep("done");
      succeeded = true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Account creation failed:", message);

      const rejected =
        (err as { userRejected?: boolean })?.userRejected === true ||
        message.includes("User rejected") ||
        message.includes("user rejected") ||
        message.includes("User denied") ||
        message.includes("declined") ||
        message.includes("cancelled");
      if (rejected) {
        setDeployErrorWasRejection(true);
        setDeployError(
          deployCompleted && !setupCompleted
            ? "Signing was cancelled. Your account was deployed but session-key setup didn't complete — click Retry to finish."
            : "Signing was cancelled in your wallet. Click Retry to try again."
        );
      } else if (message.includes("insufficient") || message.includes("Insufficient")) {
        setDeployErrorWasRejection(false);
        setDeployError("Insufficient XLM balance. Please fund your wallet and try again.");
      } else if (message.includes("timed out")) {
        setDeployErrorWasRejection(false);
        setDeployError("Transaction confirmation timed out. Please try again.");
      } else {
        setDeployErrorWasRejection(false);
        setDeployError(message);
      }
      setDeploySubStep("idle");
    } finally {
      flowInProgressRef.current = false;
      if (succeeded) setAllDone(true);
    }
  };

  const clearError = () => {
    setDeployError(null);
    setDeployErrorWasRejection(false);
  };

  const retry = async () => {
    clearError();
    await deploy();
  };

  const isDeploying = deploySubStep !== "idle" && deploySubStep !== "done";

  return {
    deploy,
    retry,
    clearError,
    isDeploying,
    deploySubStep,
    deployCompleted,
    setupCompleted,
    deployError,
    deployErrorWasRejection,
    allDone,
  };
}
