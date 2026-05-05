"use client";

import { AlertCircle, Check, ChevronLeft, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useOnboardingDeploy } from "@/features/account/hooks/use-onboarding-deploy";
import type { DeploySubStep, RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";

interface Props {
  publicKey: string;
  preset: RiskPreset;
  onComplete: () => void;
  onBack?: () => void;
}

type TxState = "idle" | "active" | "done";

function deployState(subStep: DeploySubStep, deployCompleted: boolean): TxState {
  if (deployCompleted) return "done";
  if (
    subStep === "building_deploy" ||
    subStep === "signing_deploy" ||
    subStep === "submitting_deploy"
  ) {
    return "active";
  }
  return "idle";
}

function setupTxState(
  subStep: DeploySubStep,
  setupCompleted: boolean,
  deployCompleted: boolean
): TxState {
  if (setupCompleted) return "done";
  if (
    subStep === "building_setup" ||
    subStep === "signing_setup" ||
    subStep === "submitting_setup" ||
    subStep === "applying_preset"
  ) {
    return "active";
  }
  if (deployCompleted) return "active";
  return "idle";
}

export function StepCreateAccount({ publicKey, preset, onComplete, onBack }: Props) {
  const {
    deploy,
    retry,
    isDeploying,
    deploySubStep,
    deployCompleted,
    setupCompleted,
    deployError,
    deployErrorWasRejection,
    allDone,
  } = useOnboardingDeploy({ publicKey: publicKey || null, selectedPreset: preset });

  useEffect(() => {
    if (allDone) onComplete();
  }, [allDone, onComplete]);

  const txDeploy = deployState(deploySubStep, deployCompleted);
  const txSetup = setupTxState(deploySubStep, setupCompleted, deployCompleted);

  const ctaLabel = isDeploying
    ? "Signing…"
    : deployCompleted && !setupCompleted
      ? "Continue (2 of 2)"
      : "Sign with your wallet";

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center bg-background px-6 pt-6">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute top-4 left-1/2 inline-flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-10 md:gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-bold text-5xl text-foreground tracking-tight md:text-6xl lg:text-7xl">
            Create Smart wallet
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground text-sm leading-relaxed md:text-base">
            You'll sign <span className="font-semibold text-foreground">two transactions</span> in
            your wallet — one to deploy your smart account, one to grant the agent permission to
            rebalance. We never hold your keys.
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <TxLabeledCircle index={1} label="Deploy" state={txDeploy} />
          <div className="h-px w-12 bg-border md:w-20" />
          <TxLabeledCircle index={2} label="Setup" state={txSetup} />
        </div>

        <button
          type="button"
          onClick={() => (deployErrorWasRejection ? void retry() : void deploy())}
          disabled={isDeploying}
          aria-label={ctaLabel}
          className={cn(
            "relative flex h-[240px] w-[240px] shrink-0 items-center justify-center rounded-full font-medium text-lg text-zinc-900 transition-transform duration-200 md:h-[320px] md:w-[320px] md:text-xl",
            !isDeploying && "hover:scale-[1.02] active:scale-[0.99]",
            isDeploying && "cursor-not-allowed opacity-90"
          )}
          style={{
            background:
              "radial-gradient(circle at 30% 25%, rgba(197,240,255,0.95) 0%, rgba(125,217,255,0.92) 25%, rgba(56,182,240,0.88) 55%, rgba(0,140,200,0.85) 100%), radial-gradient(circle at 75% 75%, rgba(0,191,255,0.55), transparent 60%)",
            boxShadow:
              "0 0 100px rgba(0,191,255,0.35), inset 0 4px 50px rgba(255,255,255,0.3), inset 0 -8px 50px rgba(2,80,120,0.4)",
          }}
        >
          {isDeploying ? <Loader2 className="h-7 w-7 animate-spin" /> : ctaLabel}
        </button>

        {deployError && (
          <div
            className={cn(
              "mx-auto flex max-w-md flex-col gap-2 rounded-lg px-4 py-3 text-sm",
              deployErrorWasRejection
                ? "border border-amber-500/30 bg-amber-500/10"
                : "border border-destructive/30 bg-destructive/10"
            )}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  deployErrorWasRejection ? "text-amber-400" : "text-destructive"
                )}
              />
              <p
                className={cn(
                  "leading-relaxed",
                  deployErrorWasRejection ? "text-amber-200/95" : "text-destructive"
                )}
              >
                {deployError}
              </p>
            </div>
            {deployErrorWasRejection && (
              <button
                type="button"
                onClick={() => void retry()}
                className="self-end rounded-md border border-amber-500/40 bg-amber-500/15 px-3 py-1 font-medium text-amber-200 text-xs transition-colors hover:bg-amber-500/25"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TxLabeledCircleProps {
  index: number;
  label: string;
  state: TxState;
}

function TxLabeledCircle({ index, label, state }: TxLabeledCircleProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border-2 font-mono text-sm transition-colors md:h-20 md:w-20 md:text-base",
          state === "idle" && "border-border bg-zinc-900 text-muted-foreground",
          state === "active" && "border-primary/60 bg-zinc-800 text-primary",
          state === "done" && "border-primary/80 bg-primary/15 text-primary"
        )}
      >
        {state === "active" ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : state === "done" ? (
          <Check className="h-5 w-5" />
        ) : (
          index
        )}
      </div>
      <span
        className={cn(
          "font-medium text-xs",
          state === "idle" ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}
