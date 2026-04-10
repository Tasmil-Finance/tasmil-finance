"use client";

import { AlertCircle, CheckCircle, Loader2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";

import {
  useDeployAccount,
  useFundAccount,
  usePresets,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "../hooks/use-account-api";
import type { RiskPreset } from "../types";
import { FundForm } from "./fund-form";
import { PresetCard } from "./preset-card";

type Step = 1 | 2 | 3;

/** Sub-steps within Step 1 (Create Account) */
type DeploySubStep =
  | "idle" // Not started
  | "building_deploy" // Building deploy TX from backend
  | "signing_deploy" // Waiting for user to sign TX 1/2
  | "submitting_deploy" // Submitting + confirming deploy TX
  | "building_setup" // Building setup TX from backend
  | "signing_setup" // Waiting for user to sign TX 2/2
  | "submitting_setup" // Submitting + confirming setup TX
  | "done"; // Both TXs confirmed

const STEPS: { step: Step; label: string }[] = [
  { step: 1, label: "Create Account" },
  { step: 2, label: "Choose Strategy" },
  { step: 3, label: "Fund" },
];

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
    case "done":
      return "Account created successfully!";
    default:
      return "";
  }
}

export function OnboardingPage() {
  const router = useRouter();
  const { account } = useWalletStore();
  const publicKey = account ?? null;

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset | null>(null);

  // Deploy sub-step tracking
  const [deploySubStep, setDeploySubStep] = useState<DeploySubStep>("idle");
  const [deployCompleted, setDeployCompleted] = useState(false); // Deploy TX confirmed; setup can be retried
  const [deployError, setDeployError] = useState<string | null>(null);

  // Guard: prevent double-click while flow is in progress
  const flowInProgressRef = useRef(false);

  const { data: presets, isLoading: presetsLoading } = usePresets();
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const fundAccount = useFundAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  // Helper to get StellarWalletsKit + passphrase
  const getStellarKit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const passphrase =
      process.env["NEXT_PUBLIC_STELLAR_PASSPHRASE"] ?? "Test SDF Network ; September 2015";
    return { StellarWalletsKit, passphrase };
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
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(result.xdr, {
      address: publicKey,
      networkPassphrase: passphrase,
    });

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

    // Should always be exactly 1 TX now (configure_session_key)
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

    setDeploySubStep("submitting_setup");
    await submitTx.mutateAsync({ signedXdr: signed.signedTxXdr });

    setDeploySubStep("done");
    return true;
  };

  // ---- Combined flow: Deploy + Setup (exactly 2 signatures) ----
  const handleDeploy = async () => {
    if (!publicKey || flowInProgressRef.current) return;

    flowInProgressRef.current = true;
    setDeployError(null);

    try {
      // If deploy already confirmed (e.g., retry after setup failure), skip to setup
      if (!deployCompleted) {
        await handleDeployTx();
      }

      await handleSetupTx();
      setCurrentStep(2);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Account creation failed:", message);

      // User-friendly error messages
      if (
        message.includes("User rejected") ||
        message.includes("user rejected") ||
        message.includes("User denied")
      ) {
        setDeployError("Transaction signing was cancelled. Please try again.");
      } else if (message.includes("insufficient") || message.includes("Insufficient")) {
        setDeployError("Insufficient XLM balance. Please fund your wallet and try again.");
      } else if (message.includes("timed out")) {
        setDeployError("Transaction confirmation timed out. Please try again.");
      } else {
        setDeployError(message);
      }

      // Reset sub-step to idle so the button is clickable again,
      // but keep deployCompleted if deploy TX was already confirmed
      setDeploySubStep("idle");
    } finally {
      flowInProgressRef.current = false;
    }
  };

  // ---- Step 2 → 3 ----
  const handleContinueToFund = async () => {
    if (!selectedPreset || !publicKey) return;
    try {
      await updatePreset.mutateAsync({ publicKey, preset: selectedPreset });
      setCurrentStep(3);
    } catch (err) {
      console.error("Failed to save preset:", err);
    }
  };

  // ---- Step 3: Fund account ----
  const handleFund = async (amount: number, token: "USDC" | "XLM") => {
    if (!publicKey) return;
    try {
      const result = await fundAccount.mutateAsync({
        publicKey,
        amount,
        token,
      });

      // Sign via StellarWalletsKit if XDR returned
      if (!result?.xdr) {
        console.error("Fund: no XDR returned from backend");
        return;
      }

      const { StellarWalletsKit, passphrase } = await getStellarKit();
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(result.xdr, {
        address: publicKey,
        networkPassphrase: passphrase,
      });
      await submitTx.mutateAsync({
        signedXdr: signedTxXdr,
        publicKey,
        txType: "fund",
        amount,
        token,
      });

      router.push("/farming");
    } catch (err) {
      console.error("Fund failed:", err);
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
  const isFunding = fundAccount.isPending || submitTx.isPending;

  // Determine the button label for Step 1
  const getDeployButtonLabel = (): string => {
    if (isDeploying) return getDeployStatusLabel(deploySubStep);
    if (deployCompleted) return "Retry Setup (Transaction 2 of 2)";
    return "Create Smart Account";
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-bold text-3xl text-foreground">Set Up Your Account</h1>
        <p className="text-muted-foreground">
          Create a self-custody smart account, pick a strategy, and fund it.
        </p>
      </div>

      {/* Step indicators */}
      <div className="mx-auto mb-10 flex max-w-md items-center justify-between">
        {STEPS.map(({ step, label }, idx) => (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 font-medium text-sm transition-colors",
                  currentStep > step
                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                    : currentStep === step
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/20 text-muted-foreground"
                )}
              >
                {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-xs",
                  currentStep >= step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-3 mb-5 h-px w-16",
                  currentStep > step ? "bg-emerald-500/50" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === 1 && (
        <div className="mx-auto max-w-lg space-y-6 text-center">
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

            {/* Progress info when deploying */}
            {isDeploying && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="font-medium text-primary text-sm">
                  {getDeployStatusLabel(deploySubStep)}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  You will need to sign 2 transactions total to create your account.
                </p>
              </div>
            )}

            {/* Deploy completed but setup pending (retry scenario) */}
            {deployCompleted && deploySubStep === "idle" && (
              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="font-medium text-amber-400 text-sm">
                  Deploy confirmed ✓ — Setup still needed
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  Your account was deployed but session key setup didn&apos;t complete. Click below
                  to sign the setup transaction (1 signature needed).
                </p>
              </div>
            )}
          </div>

          <Button
            variant="gradient"
            size="lg"
            className="h-12 w-full"
            onClick={handleDeploy}
            disabled={isDeploying}
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
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-semibold text-foreground text-xl">Choose Your Strategy</h2>
            <p className="text-muted-foreground text-sm">
              Select a risk profile. The AI engine will allocate across pools accordingly.
            </p>
          </div>

          {presetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {presets?.map((preset) => (
                <PresetCard
                  key={preset.name}
                  preset={preset}
                  selected={selectedPreset === preset.name}
                  onSelect={() => setSelectedPreset(preset.name)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Button
              variant="gradient"
              size="lg"
              className="h-12 w-full max-w-sm"
              onClick={handleContinueToFund}
              disabled={!selectedPreset}
            >
              Continue with {selectedPreset ?? "..."}
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="mx-auto max-w-lg space-y-6">
          <div className="text-center">
            <h2 className="font-semibold text-foreground text-xl">Fund Your Account</h2>
            <p className="text-muted-foreground text-sm">
              Deposit funds to start earning yield with the{" "}
              <span className="font-medium text-foreground">{selectedPreset}</span> strategy.
            </p>
          </div>

          <FundForm onFund={handleFund} isLoading={isFunding} />

          {fundAccount.isError && (
            <p className="text-center text-destructive text-sm">
              Funding failed. Please try again.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
