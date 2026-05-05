"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { DeployStepper } from "@/features/account/components/deploy-stepper";
import { useOnboardingDeploy } from "@/features/account/hooks/use-onboarding-deploy";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

interface Props {
  publicKey: string;
  preset: RiskPreset;
  onComplete: () => void;
}

export function StepCreateAccount({ publicKey, preset, onComplete }: Props) {
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

  const ctaLabel = isDeploying
    ? "Signing…"
    : deployCompleted && !setupCompleted
      ? "Retry setup (Transaction 2 of 2)"
      : "Sign with your wallet";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl text-foreground tracking-tight">
          Create your smart account
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          One-time setup. You'll sign{" "}
          <span className="font-semibold text-foreground">two transactions</span> in your wallet —
          one to deploy your smart account, one to grant the agent permission to rebalance. We
          never hold your keys.
        </p>
      </div>

      <Button
        variant="gradient"
        size="lg"
        className="h-11 w-full"
        onClick={() => void deploy()}
        disabled={isDeploying}
      >
        {isDeploying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {ctaLabel}
      </Button>

      {(isDeploying || deploySubStep === "done") && (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <DeployStepper
            subStep={deploySubStep}
            deployCompleted={deployCompleted}
            setupCompleted={setupCompleted}
          />
        </div>
      )}

      {deployError && (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-lg px-3 py-2.5 text-xs",
            deployErrorWasRejection
              ? "border border-amber-500/20 bg-amber-500/5"
              : "border border-destructive/20 bg-destructive/5",
          )}
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0",
                deployErrorWasRejection ? "text-amber-400" : "text-destructive",
              )}
            />
            <p
              className={cn(
                "leading-relaxed",
                deployErrorWasRejection ? "text-amber-200/90" : "text-destructive",
              )}
            >
              {deployError}
            </p>
          </div>
          {deployErrorWasRejection && (
            <button
              type="button"
              onClick={() => void retry()}
              className="self-end rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-200 text-xs transition-colors hover:bg-amber-500/15"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
