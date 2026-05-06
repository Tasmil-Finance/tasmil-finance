"use client";

import { Check } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export type StepState = "inactive" | "active" | "done";

export interface Step {
  id: string;
  label: string;
  state: StepState;
}

interface ProgressStepperProps {
  steps: Step[];
  className?: string;
}

export function ProgressStepper({ steps, className }: ProgressStepperProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Row 1: dots + connectors at the same level */}
      <div className="flex w-full items-center">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <div
              data-step={step.id}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold text-xs transition-all duration-300",
                step.state === "done" &&
                  "animate-stepper-pop border-green-500 bg-green-500 text-white",
                step.state === "active" && "border-primary bg-primary/10 text-primary",
                step.state === "inactive" && "border-border bg-background text-muted-foreground"
              )}
            >
              {step.state === "done" ? <Check className="h-4 w-4" /> : <span>{i + 1}</span>}
            </div>

            {/* Connector between this dot and the next */}
            {i < steps.length - 1 && (
              <div className="h-0.5 flex-1 overflow-hidden rounded-full">
                <div
                  className={cn(
                    "h-full w-full rounded-full transition-all duration-500 ease-out",
                    step.state === "done" ? "bg-green-500" : "bg-border"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Row 2: labels mirror dot-row structure so each label centers under its dot */}
      <div className="mt-2 flex w-full items-start">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <span
              className={cn(
                "w-9 shrink-0 text-center font-medium text-xs leading-tight",
                step.state === "done" && "text-green-600",
                step.state === "active" && "text-primary",
                step.state === "inactive" && "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {/* spacer mirrors the connector flex-1 */}
            {i < steps.length - 1 && <div className="flex-1" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
