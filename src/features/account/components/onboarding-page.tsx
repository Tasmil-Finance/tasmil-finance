"use client";
import { activeNetwork } from "@/shared/config/stellar";

import { AlertCircle, CheckCircle, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";

import {
  useDeployAccount,
  usePresets,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "../hooks/use-account-api";
import type { RiskPreset } from "../types";
import { PresetCard } from "./preset-card";

/** Sub-steps within Step 1 (Create Account) */
type DeploySubStep =
  | "idle" // Not started
  | "building_deploy" // Building deploy TX from backend
  | "signing_deploy" // Waiting for user to sign TX 1/2
  | "submitting_deploy" // Submitting + confirming deploy TX
  | "building_setup" // Building setup TX from backend
  | "signing_setup" // Waiting for user to sign TX 2/2
  | "submitting_setup" // Submitting + confirming setup TX
  | "applying_preset" // Calling updatePreset after deploy+setup succeed
  | "done"; // Everything confirmed

/** User-friendly labels for each sub-step */
function getDeployStatusLabel(subStep: DeploySubStep): string {
  switch (subStep) {
    case "building_deploy":
      return "Preparing deploy transaction...";
    case "signing_deploy":
      return "Sign transaction 1 of 2 — Deploy Account";
    case "submitting_deploy":
      return "Submitting deploy transaction...";
    case "building_setup":
      return "Preparing setup transaction...";
    case "signing_setup":
      return "Sign transaction 2 of 2 — Configure Session Key";
    case "submitting_setup":
      return "Submitting setup transaction...";
    case "applying_preset":
      return "Applying your strategy...";
    case "done":
      return "Account created successfully!";
    default:
      return "";
  }
}

const DEFAULT_PRESET: RiskPreset = "Balanced";

export function OnboardingPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? null;

  // User's preset pick. Defaults to Balanced (most users should start here).
  // Persisted in local state only until account is created; then pushed to
  // the backend via updatePreset.
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset>(DEFAULT_PRESET);

  // Deploy sub-step tracking
  const [deploySubStep, setDeploySubStep] = useState<DeploySubStep>("idle");
  const [deployCompleted, setDeployCompleted] = useState(false); // TX 1 confirmed; setup retriable
  const [setupCompleted, setSetupCompleted] = useState(false); // TX 2 confirmed; preset apply next
  const [deployError, setDeployError] = useState<string | null>(null);

  // Guard: prevent double-click while flow is in progress
  const flowInProgressRef = useRef(false);

  const { data: presets, isLoading: presetsLoading } = usePresets();
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  // Helper to get StellarWalletsKit + passphrase
  const getStellarKit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const passphrase =
      activeNetwork.networkPassphrase;
    return { StellarWalletsKit, passphrase };
  };

  /**
   * Normalise wallet-signing result: some Stellar wallet adapters RESOLVE
   * with an empty / undefined signedTxXdr on user rejection instead of
   * throwing. Treat any non-string / empty result as an explicit cancel.
   */
  const assertSigned = (
    signResult: { signedTxXdr?: string } | null | undefined,
  ): string => {
    const xdr = signResult?.signedTxXdr;
    if (typeof xdr !== "string" || xdr.length === 0) {
      const err = new Error("User rejected transaction signing");
      (err as Error & { userRejected?: boolean }).userRejected = true;
      throw err;
    }
    return xdr;
  };

  // ---- Step 1a: Deploy keeper wallet contract (TX 1/2) ----
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

  // ---- Step 1b: Configure session key (TX 2/2) ----
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

  // ---- Step 2: Apply the chosen preset (skip if Balanced == default) ----
  const applyChosenPreset = async (): Promise<boolean> => {
    if (!publicKey) return false;

    // Backend seeds BALANCED on signup, so only push when the user picked
    // something else. Saves a request + avoids a noop activity row.
    if (selectedPreset === DEFAULT_PRESET) return true;

    setDeploySubStep("applying_preset");
    // preset API expects uppercase ("SAFE" | "BALANCED" | "AGGRESSIVE")
    await updatePreset.mutateAsync({
      publicKey,
      preset: selectedPreset.toUpperCase(),
    });
    return true;
  };

  // ---- Combined flow: Deploy → Setup → Apply Preset ----
  const handleDeploy = async () => {
    if (!publicKey || flowInProgressRef.current) return;

    flowInProgressRef.current = true;
    setDeployError(null);

    let allDone = false;
    try {
      // TX 1 (skip if already confirmed on a retry)
      if (!deployCompleted) {
        await handleDeployTx();
      }
      // TX 2 (skip if already confirmed on a rare preset-only retry)
      if (!setupCompleted) {
        await handleSetupTx();
      }
      // Preset: non-fatal. If it fails, the account still works on BALANCED
      // and the user can change it later via the Strategy tab.
      try {
        await applyChosenPreset();
      } catch (presetErr: any) {
        console.warn(
          "Preset application failed; leaving account on default BALANCED:",
          presetErr?.message ?? presetErr,
        );
      }
      setDeploySubStep("done");
      allDone = true;
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
        const step = !deployCompleted
          ? "deploy"
          : !setupCompleted
            ? "session-key setup"
            : "strategy update";
        setDeployError(
          `Transaction signing was cancelled at the ${step} step. ` +
            (deployCompleted && !setupCompleted
              ? "Your account was deployed but session key setup didn't complete — click retry to finish."
              : "Please try again."),
        );
      } else if (message.includes("insufficient") || message.includes("Insufficient")) {
        setDeployError("Insufficient XLM balance. Please fund your wallet and try again.");
      } else if (message.includes("timed out")) {
        setDeployError("Transaction confirmation timed out. Please try again.");
      } else {
        setDeployError(message);
      }
      setDeploySubStep("idle");
    } finally {
      flowInProgressRef.current = false;
      // Navigate ONLY when the full flow (deploy + setup) succeeded. Preset
      // apply is best-effort and already caught above, so a preset failure
      // still lets us navigate to the dashboard where the user can retry.
      if (allDone) {
        router.push("/farming");
      }
    }
  };

  // ---- Not connected ----
  if (!publicKey) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
          <Wallet className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mb-2 font-bold text-2xl text-foreground">Connect Your Wallet</h2>
        <p className="text-muted-foreground">
          Connect your Stellar wallet to create a smart account and get started.
        </p>
      </div>
    );
  }

  const isDeploying = deploySubStep !== "idle" && deploySubStep !== "done";
  const getDeployButtonLabel = (): string => {
    if (isDeploying) return getDeployStatusLabel(deploySubStep);
    if (deployCompleted && !setupCompleted) return "Retry Setup (Transaction 2 of 2)";
    return "Create Smart Account";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl text-foreground">Set Up Your Account</h1>
        <p className="text-muted-foreground">
          Pick a strategy, then create your self-custody smart account to start earning.
        </p>
      </div>

      {/* Section 1 — Strategy picker */}
      <section className="mb-10">
        <div className="mb-4 text-center">
          <h2 className="font-semibold text-foreground text-xl">Choose Your Strategy</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            You can change this any time from the dashboard.
          </p>
        </div>

        {presetsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : presets && presets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {presets.map((preset) => (
              <PresetCard
                key={preset.name}
                preset={preset}
                selected={selectedPreset === preset.name}
                onSelect={() => {
                  // Block changing strategy mid-flow — the selection is
                  // locked in once signing starts.
                  if (!isDeploying) setSelectedPreset(preset.name);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted/10 p-6 text-center text-muted-foreground text-sm">
            Strategy options are loading. If this persists, please refresh the page.
          </div>
        )}
      </section>

      {/* Section 2 — Account creation */}
      <section className="mx-auto max-w-lg space-y-6 text-center">
        <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-6">
          <h2 className="font-semibold text-foreground text-xl">Create Smart Account</h2>
          <p className="text-muted-foreground text-sm">
            Your smart account is a self-custody Stellar account with session keys for automated
            rebalancing. You keep full control — only pre-approved actions can be executed by the
            keeper bot.
          </p>
          <ul className="mx-auto max-w-xs space-y-2 text-left text-muted-foreground text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              Self-custody — your keys, your funds
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              Session keys for automated yield
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              Revokable at any time
            </li>
          </ul>

          {/* Selected preset summary — confirms user's choice before signing */}
          {!isDeploying && !deployCompleted && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-left">
              <p className="font-medium text-foreground text-sm">
                Strategy: <span className="text-primary">{selectedPreset}</span>
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                You can change this from the Strategy tab after your account is created.
              </p>
            </div>
          )}

          {/* Progress info when deploying */}
          {isDeploying && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium text-primary text-sm">{getDeployStatusLabel(deploySubStep)}</p>
              <p className="mt-1 text-muted-foreground text-xs">
                You will need to sign 2 transactions total to create your account.
              </p>
            </div>
          )}

          {/* Deploy completed but setup pending (retry scenario) */}
          {deployCompleted && !setupCompleted && deploySubStep === "idle" && (
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="font-medium text-amber-400 text-sm">
                Deploy confirmed ✓ — Setup still needed
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                Your account was deployed but session key setup didn&apos;t complete. Click below to
                sign the setup transaction (1 signature needed).
              </p>
            </div>
          )}
        </div>

        <Button
          variant="gradient"
          size="lg"
          className="h-12 w-full"
          onClick={handleDeploy}
          disabled={isDeploying || presetsLoading}
        >
          {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {getDeployButtonLabel()}
        </Button>

        {deployError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-left">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-destructive text-sm">{deployError}</p>
          </div>
        )}
      </section>
    </div>
  );
}
