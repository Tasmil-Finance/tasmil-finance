"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { useWalletStatus } from "@/features/whitelist/hooks/use-wallet-waitlist";
import { WaitlistScreen1 } from "./waitlist-screen1";
import { WaitlistScreen2 } from "./waitlist-screen2";
import { WaitlistScreen3 } from "./waitlist-screen3";

interface WaitlistPhaseBoardProps {
  referredByCode?: string | null;
}

export function WaitlistPhaseBoard({ referredByCode }: WaitlistPhaseBoardProps) {
  const { isConnected, address } = useWallet();
  const { data: walletStatus, isLoading: isStatusLoading, isError: isStatusError } = useWalletStatus(address);
  const [skipped, setSkipped] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);

  // isRegistered stays true for the rest of the session once the user joins,
  // even if the background status refetch fails and clears the query cache.
  const isRegistered = !!walletStatus || hasJoined;
  const hasEmail = !!(walletStatus?.hasEmail || submittedEmail);

  // Show spinner only while the initial status check is in flight (not on error).
  // Prevents Screen 1 flashing briefly for already-registered wallets.
  // If the backend errors (down / 5xx), fail fast and show Screen 1.
  const showLoadingSpinner = isConnected && !!address && isStatusLoading && !isStatusError;

  const showScreen: 1 | 2 | 3 =
    !isConnected || !isRegistered ? 1
    : !hasEmail && !skipped ? 2
    : 3;

  function handleEmailSuccess(email: string) {
    setSubmittedEmail(email);
  }

  function handleSkip() {
    setSkipped(true);
  }

  return (
    <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm">
      {showLoadingSpinner ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {showScreen === 1 && (
            <WaitlistScreen1
              referredByCode={referredByCode}
              onJoined={() => setHasJoined(true)}
            />
          )}
          {showScreen === 2 && (
            <WaitlistScreen2 onEmailSuccess={handleEmailSuccess} onSkip={handleSkip} />
          )}
          {showScreen === 3 && <WaitlistScreen3 submittedEmail={submittedEmail} />}
        </>
      )}
    </div>
  );
}
