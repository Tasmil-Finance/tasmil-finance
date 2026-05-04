"use client";

import { PlayCircle } from "lucide-react";
import { DropdownMenuItem } from "@/shared/ui/dropdown-menu";
import { useOnboardingStore } from "@/store/use-onboarding";

export function ReplayMenuItem() {
  const { resetOnboarding, openWelcomeModal } = useOnboardingStore();
  return (
    <DropdownMenuItem
      data-testid="replay-onboarding"
      onSelect={() => {
        resetOnboarding();
        openWelcomeModal();
      }}
    >
      <PlayCircle className="mr-2 h-4 w-4" />
      Replay onboarding
    </DropdownMenuItem>
  );
}
