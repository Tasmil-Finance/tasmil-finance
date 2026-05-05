"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button-v2";
import { StepDots } from "../shared/step-dots";

interface Props {
  currentStep: number;
  totalSteps: number;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  hideCta?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function SetupShell({
  currentStep,
  totalSteps,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
  hideCta,
  onBack,
  children,
}: Props) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
        <div className="flex w-32 items-center gap-2">
          {onBack ? (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="-ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="h-8 w-8" aria-hidden />
          )}
          <span className="text-muted-foreground text-xs">Tasmil</span>
        </div>
        <StepDots current={currentStep} total={totalSteps} />
        <span className="w-32 text-right text-[10px] text-muted-foreground/70">
          Step {currentStep} of {totalSteps}
        </span>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-8 md:py-12">
        <div className="w-full">{children}</div>
      </main>

      {!hideCta && (
        <footer
          className={cn(
            "sticky bottom-0 z-10 flex items-center justify-end border-t border-border bg-background/95 px-4 py-3 backdrop-blur"
          )}
        >
          <Button
            variant="gradient"
            size="lg"
            className="h-11 rounded-full px-8"
            onClick={onCta}
            disabled={ctaDisabled || ctaLoading}
          >
            {ctaLabel}
          </Button>
        </footer>
      )}
    </div>
  );
}
