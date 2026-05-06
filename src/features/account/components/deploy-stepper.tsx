"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DeploySubStep } from "../types";

type StepKey = "deploy" | "setup" | "preset";
type StepState = "pending" | "active" | "done";

interface Step {
  key: StepKey;
  label: string;
}

const STEPS: Step[] = [
  { key: "deploy", label: "Deploy account" },
  { key: "setup", label: "Configure session key" },
  { key: "preset", label: "Apply strategy" },
];

function activeStepKey(subStep: DeploySubStep): StepKey | null {
  if (
    subStep === "building_deploy" ||
    subStep === "signing_deploy" ||
    subStep === "submitting_deploy"
  ) {
    return "deploy";
  }
  if (
    subStep === "building_setup" ||
    subStep === "signing_setup" ||
    subStep === "submitting_setup"
  ) {
    return "setup";
  }
  if (subStep === "applying_preset") return "preset";
  return null;
}

interface DeployStepperProps {
  subStep: DeploySubStep;
  deployCompleted: boolean;
  setupCompleted: boolean;
  /** Sub-step text below bar (e.g. "Sign transaction 2 of 2 — Configure Session Key"). Pass undefined to hide. */
  statusText?: string;
}

export function DeployStepper({
  subStep,
  deployCompleted,
  setupCompleted,
  statusText,
}: DeployStepperProps) {
  const active = activeStepKey(subStep);

  const stateOf = (key: StepKey): StepState => {
    if (key === "deploy") {
      return deployCompleted ? "done" : active === "deploy" ? "active" : "pending";
    }
    if (key === "setup") {
      return setupCompleted ? "done" : active === "setup" ? "active" : "pending";
    }
    if (key === "preset") {
      return subStep === "done" ? "done" : active === "preset" ? "active" : "pending";
    }
    return "pending";
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const state = stateOf(step.key);
          const isLast = idx === STEPS.length - 1;
          return (
            <div key={step.key} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-medium text-[10px]",
                  state === "done" && "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                  state === "active" && "border-primary/50 bg-primary/15 text-primary",
                  state === "pending" && "border-white/10 bg-white/3 text-muted-foreground/60"
                )}
              >
                {state === "done" ? (
                  <Check className="h-3 w-3" />
                ) : state === "active" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className={cn(
                  "truncate text-xs",
                  state === "done" && "text-emerald-300",
                  state === "active" && "text-foreground",
                  state === "pending" && "text-muted-foreground/70"
                )}
              >
                {step.label}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "h-px flex-1",
                    state === "done" ? "bg-emerald-500/40" : "bg-white/8"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {statusText && (
        <p className="text-[11px] text-muted-foreground">
          <span className="text-primary">{statusText}</span>
          <span className="text-muted-foreground/70"> · keep Freighter open</span>
        </p>
      )}
    </div>
  );
}
