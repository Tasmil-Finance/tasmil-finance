"use client";

import { AlertCircle, CheckCircle, Info, Loader2, ShieldCheck, Wallet, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { activeNetwork } from "@/shared/config/stellar";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { useWalletStore } from "@/store/use-wallet";

import {
  useDeployAccount,
  usePresets,
  useSetupAccount,
  useSubmitTx,
  useUpdatePreset,
} from "../hooks/use-account-api";
import type { DeploySubStep, RiskPreset } from "../types";
import { DeployStepper } from "./deploy-stepper";
import { PresetCard } from "./preset-card";

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
  const { connect } = useWallet();
  const publicKey = account ?? null;

  // User's preset pick. Defaults to Balanced (most users should start here).
  const [selectedPreset, setSelectedPreset] = useState<RiskPreset>(DEFAULT_PRESET);

  // Base asset the user plans to deposit. Persist to sessionStorage so a
  // mid-flow re-render (e.g. after TX 1 confirms and React remounts the
  // OnboardingPage because position.status flips to DEPLOYING) doesn't
  // reset the pick back to USDC and cause the UI to flash mid-signup.
  const [selectedBaseAsset, setSelectedBaseAsset] = useState<"USDC" | "XLM">(() => {
    if (typeof window === "undefined") return "USDC";
    const stored = window.sessionStorage.getItem("tasmil.onboarding.baseAsset");
    return stored === "XLM" ? "XLM" : "USDC";
  });
  // Keep sessionStorage in sync so reloads / remounts restore the choice.
  const updateBaseAsset = (next: "USDC" | "XLM") => {
    setSelectedBaseAsset(next);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("tasmil.onboarding.baseAsset", next);
    }
  };

  // Deploy sub-step tracking
  const [deploySubStep, setDeploySubStep] = useState<DeploySubStep>("idle");
  const [deployCompleted, setDeployCompleted] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployErrorWasRejection, setDeployErrorWasRejection] = useState(false);

  // Guard: prevent double-click while flow is in progress
  const flowInProgressRef = useRef(false);

  const { data: presets, isLoading: presetsLoading } = usePresets(selectedBaseAsset);
  const deployAccount = useDeployAccount();
  const setupAccount = useSetupAccount();
  const submitTx = useSubmitTx();
  const updatePreset = useUpdatePreset();

  // Helper to get StellarWalletsKit + passphrase
  const getStellarKit = async () => {
    const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit/sdk");
    const passphrase = activeNetwork.networkPassphrase;
    return { StellarWalletsKit, passphrase };
  };

  /**
   * Normalise wallet-signing result: some Stellar wallet adapters RESOLVE
   * with an empty / undefined signedTxXdr on user rejection instead of
   * throwing. Treat any non-string / empty result as an explicit cancel.
   */
  const assertSigned = (signResult: { signedTxXdr?: string } | null | undefined): string => {
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
    setDeployErrorWasRejection(false);

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
          presetErr?.message ?? presetErr
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
      // Navigate ONLY when the full flow (deploy + setup) succeeded. Preset
      // apply is best-effort and already caught above, so a preset failure
      // still lets us navigate to the dashboard where the user can retry.
      if (allDone) {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem("tasmil.onboarding.baseAsset");
        }
        router.push("/farming");
      }
    }
  };

  const isDeploying = deploySubStep !== "idle" && deploySubStep !== "done";
  const getDeployButtonLabel = (): string => {
    if (isDeploying) return getDeployStatusLabel(deploySubStep);
    if (deployCompleted && !setupCompleted) return "Retry Setup (Transaction 2 of 2)";
    return "Create Smart Account";
  };

  // Warning shown below any preset whose effective APY is below this floor.
  // Users deserve a heads-up before picking an allocation that pays ~nothing.
  const LOW_APY_THRESHOLD_PCT = 1;
  const showLowApyWarning =
    presets?.some((p) => p.name === selectedPreset && p.estimatedApy < LOW_APY_THRESHOLD_PCT) ??
    false;

  const selectedApy =
    presets?.find((p) => p.name === selectedPreset)?.estimatedApy?.toFixed(2) ?? "—";

  const allocationSummary = useMemo(() => {
    const preset = presets?.find((p) => p.name === selectedPreset);
    const topPools = preset?.topPools ?? [];
    if (topPools.length === 0) return "—";
    return topPools
      .slice(0, 3)
      .map((p) => `${p.name} ${Math.round(p.weight)}%`)
      .join(" · ");
  }, [presets, selectedPreset]);

  // ---- Not connected ----
  if (!publicKey) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
          <Wallet className="h-8 w-8 text-primary" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-2xl text-foreground">Earn yield on Stellar, automated.</h1>
          <p className="max-w-md text-muted-foreground text-sm">
            Connect your wallet to set up a Smart Account that lets the agent rebalance your funds
            across audited yield pools.
          </p>
        </div>

        <Button
          variant="gradient"
          size="lg"
          className="h-11 px-8"
          onClick={() => {
            void connect();
          }}
        >
          Connect Wallet
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Self-custody
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            Revokable any time
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-emerald-400" />
            Session-key automation
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-8">
      {/* Header — page title + explainer + page-level trust chips */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-medium text-muted-foreground text-xs uppercase tracking-widest">
            Set up your farming account
          </h1>
          <p className="max-w-2xl text-foreground text-sm">
            A smart account on Stellar that lets the agent rebalance your funds across yield pools.{" "}
            <span className="text-muted-foreground">
              You stay in custody and can revoke access any time.
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Self-custody — your keys, your funds
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-emerald-400" />
            Session-key automation (scoped permissions)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            Revokable any time
          </span>
        </div>
      </div>

      {/* ── Row 1: asset picker (compact inline) ─────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">
            1
          </span>
          Deposit asset
        </span>
        <div className="flex gap-2">
          {[
            { id: "USDC" as const, label: "USDC", hint: "stablecoin" },
            { id: "XLM" as const, label: "XLM", hint: "native" },
          ].map((asset) => {
            const isActive = selectedBaseAsset === asset.id;
            return (
              <button
                type="button"
                key={asset.id}
                disabled={isDeploying}
                onClick={() => !isDeploying && updateBaseAsset(asset.id)}
                className={cn(
                  "rounded-xl border px-3.5 py-1.5 text-sm transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  isActive
                    ? "border-primary/50 bg-primary/10 text-foreground ring-1 ring-primary/40"
                    : "border-white/8 bg-white/3 text-muted-foreground hover:border-white/12 hover:text-foreground"
                )}
              >
                <span className="font-semibold">{asset.label}</span>
                <span className="ml-1.5 text-muted-foreground/60 text-xs">· {asset.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Row 2: strategy cards ────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">
          2
        </span>
        <span className="text-muted-foreground text-xs uppercase tracking-widest">Strategy</span>
        <span className="text-muted-foreground/60 text-xs">· change any time</span>
      </div>
      {presetsLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/6 bg-white/3 py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : presets && presets.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {presets.map((preset) => (
            <PresetCard
              key={preset.name}
              preset={preset}
              selected={selectedPreset === preset.name}
              onSelect={() => !isDeploying && setSelectedPreset(preset.name)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/10 p-4 text-center text-muted-foreground text-sm">
          Strategy options are loading — refresh the page if this persists.
        </div>
      )}

      {/* Low-APY banner (only when relevant) */}
      {showLowApyWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
          <p className="text-amber-200/90">
            <span className="font-medium text-amber-200">
              {selectedPreset} with {selectedBaseAsset} pays &lt;1% right now.
            </span>{" "}
            {selectedBaseAsset === "XLM"
              ? "Mainnet XLM lending demand is low. Try Balanced/Aggressive or switch to USDC for 5–9% APY."
              : "Pool yields fluctuate — you can change strategy any time."}
          </p>
        </div>
      )}

      {/* ── Row 3: CTA bar (summary + create button + guarantees) ────────── */}
      <div className="mt-1 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-white/3 to-transparent p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Selection summary */}
          <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Asset
              </p>
              <p className="font-semibold text-foreground">{selectedBaseAsset}</p>
            </div>
            <div className="h-6 w-px bg-white/8" />
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Strategy
              </p>
              <p className="font-semibold text-foreground">{selectedPreset}</p>
            </div>
            <div className="h-6 w-px bg-white/8" />
            <div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Est. APY
              </p>
              <p className="font-mono font-semibold text-primary">{selectedApy}%</p>
            </div>
            <div className="h-6 w-px bg-white/8" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Allocation
              </p>
              <p className="truncate text-foreground text-xs">{allocationSummary}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-stretch gap-1 md:w-[260px]">
            <Button
              variant="gradient"
              size="lg"
              className="h-11 w-full"
              onClick={handleDeploy}
              disabled={isDeploying || presetsLoading}
            >
              {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getDeployButtonLabel()}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground/70">
              2 wallet signatures · ~30s
            </p>
          </div>
        </div>

        {/* Progress / retry / error banners (inline, below CTA row) */}
        {(isDeploying || deployCompleted) && deploySubStep !== "done" && (
          <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <DeployStepper
              subStep={deploySubStep}
              deployCompleted={deployCompleted}
              setupCompleted={setupCompleted}
              statusText={isDeploying ? getDeployStatusLabel(deploySubStep) : undefined}
            />
          </div>
        )}
        {deployError && (
          <div
            className={cn(
              "mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs",
              deployErrorWasRejection
                ? "border border-amber-500/20 bg-amber-500/5"
                : "border border-destructive/20 bg-destructive/5"
            )}
          >
            <AlertCircle
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0",
                deployErrorWasRejection ? "text-amber-400" : "text-destructive"
              )}
            />
            <div className="flex-1">
              <p className={deployErrorWasRejection ? "text-amber-200" : "text-destructive"}>
                {deployError}
              </p>
            </div>
            {deployErrorWasRejection && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 shrink-0 px-3 text-xs"
                onClick={handleDeploy}
                disabled={isDeploying}
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
