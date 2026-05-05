"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useOnboardingDeploy } from "@/features/account/hooks/use-onboarding-deploy";
import { DeployStepper } from "@/features/account/components/deploy-stepper";
import type { RiskPreset } from "@/features/account/types";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";

interface Props {
  publicKey: string;
  asset: string;
  mode: string;
  preset: RiskPreset;
  estimatedApy: number;
  customMarkets?: string[];
  onComplete: () => void;
}

export function StepDeploy({
  publicKey,
  asset,
  mode,
  preset,
  estimatedApy,
  onComplete,
}: Props) {
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
      : "Create smart account";

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-[#888]">Asset</dt>
        <dd className="text-right font-medium">{asset}</dd>

        <dt className="text-[#888]">Mode</dt>
        <dd className="text-right font-medium">{mode === "AUTO" ? "Auto" : "Custom"}</dd>

        <dt className="text-[#888]">Strategy</dt>
        <dd className="text-right font-medium">{preset}</dd>

        <dt className="text-[#888]">Est. APY</dt>
        <dd className="text-right font-mono tabular-nums">{estimatedApy.toFixed(2)}%</dd>
      </dl>

      <Button
        size="lg"
        className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
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
              : "border border-destructive/20 bg-destructive/5"
          )}
        >
          <div className="flex items-start gap-2">
            <AlertCircle
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0",
                deployErrorWasRejection ? "text-amber-400" : "text-destructive"
              )}
            />
            <p
              className={cn(
                "leading-relaxed",
                deployErrorWasRejection ? "text-amber-200/90" : "text-destructive"
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
