"use client";

import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/ui/button-v2";
import { StepDots } from "../shared/step-dots";

interface Props {
  currentStep: number;
  totalSteps: number;
  title: string;
  ctaLabel: string;
  onCta: () => void;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onBack?: () => void;
  children: ReactNode;
}

export function StepFrame({
  currentStep,
  totalSteps,
  title,
  ctaLabel,
  onCta,
  ctaDisabled,
  ctaLoading,
  onBack,
  children,
}: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="flex items-center justify-between px-4 h-12 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              aria-label="Back"
              onClick={onBack}
              className="rounded-full p-1.5 hover:bg-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <span className="w-7" aria-hidden />
          )}
          <span className="text-xs text-[#888]">Tasmil</span>
        </div>
        <StepDots current={currentStep} total={totalSteps} />
        <span className="w-16 text-right text-[10px] text-[#555]">
          Step {currentStep} of {totalSteps}
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="flex w-full max-w-[480px] flex-col gap-6">
          <h1 className="text-center font-medium text-xl tracking-tight">{title}</h1>
          {children}
        </div>
      </main>

      <footer className="px-6 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 flex justify-center">
        <Button
          variant="gradient"
          size="lg"
          className="h-11 px-10 rounded-full"
          onClick={onCta}
          disabled={ctaDisabled || ctaLoading}
        >
          {ctaLabel}
        </Button>
      </footer>
    </div>
  );
}
