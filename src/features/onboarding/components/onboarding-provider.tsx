"use client";

import { useState } from "react";
import { OnboardingDialog } from "./onboarding-dialog";
import { useOnboarding } from "@/hooks/use-onboarding";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { completeOnboarding } = useOnboarding();
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      {children}
      <OnboardingDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            // If user closes dialog without completing, mark as completed anyway
            // You might want to change this behavior based on your requirements
            completeOnboarding();
          }
        }}
      />
    </>
  );
}