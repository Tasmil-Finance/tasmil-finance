"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@/shared/context/wallet-context";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useOnboardingStore } from "@/store/use-onboarding";

// Onborda disabled — mock hook to avoid provider errors
const useOnborda = () => ({ startOnborda: (_name?: string) => {} });

/**
 * Triggers the welcome modal on first authentication.
 * Place once in the OnboardingProvider.
 */
export function useOnboardingTrigger() {
  const { isAuthenticated } = useWallet();
  const { hasCompletedWelcome, openWelcomeModal } = useOnboardingStore();
  const prevAuthRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current && !hasCompletedWelcome) {
      openWelcomeModal();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, hasCompletedWelcome, openWelcomeModal]);
}

/**
 * Auto-starts a page-specific tour on first visit.
 * Call in each page component: usePageTour("agents-tour")
 */
export function usePageTour(tourName: string) {
  const { isAuthenticated } = useWallet();
  const { hasCompletedWelcome, completedTours } = useOnboardingStore();
  const { startOnborda } = useOnborda();
  const isMobile = useIsMobile();
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (
      hasTriggered.current ||
      !isAuthenticated ||
      !hasCompletedWelcome ||
      completedTours.includes(tourName) ||
      isMobile
    ) {
      return;
    }
    hasTriggered.current = true;
    // Delay to let page content render and mount data-onborda elements
    const timer = setTimeout(() => startOnborda(tourName), 800);
    return () => clearTimeout(timer);
  }, [isAuthenticated, hasCompletedWelcome, completedTours, tourName, startOnborda, isMobile]);
}
