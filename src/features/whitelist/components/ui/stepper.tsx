"use client";

import React from "react";
import { Check } from "lucide-react";
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
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                step.state === "done" &&
                  "border-green-500 bg-green-500 text-white animate-stepper-pop",
                step.state === "active" &&
                  "border-primary bg-primary/10 text-primary",
                step.state === "inactive" &&
                  "border-border bg-background text-muted-foreground"
              )}
            >
              {step.state === "done" ? (
                <Check className="h-4 w-4" />
              ) : (
                <span>{i + 1}</span>
              )}
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

      {/* Row 2: labels aligned under their dots */}
      <div className="mt-2 flex w-full justify-between">
        {steps.map((step) => (
          <span
            key={step.id}
            className={cn(
              "text-xs font-medium leading-tight",
              step.state === "done" && "text-green-600",
              step.state === "active" && "text-primary",
              step.state === "inactive" && "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
