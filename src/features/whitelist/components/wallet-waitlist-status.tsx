"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Copy, ExternalLink, Check } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { useWalletStatus } from "@/features/whitelist/hooks/use-wallet-waitlist";
import {
  buildReferralUrl,
  buildXShareText,
  openXShare,
  copyToClipboard,
} from "@/features/whitelist/lib/share-to-x";
import { fireConfettiBurst } from "@/features/whitelist/lib/confetti-burst";
import { ProgressStepper, type Step } from "./ui/stepper";
import { SuccessBanner } from "./ui/success-banner";
import { WaitlistContactFormV2 } from "./waitlist-contact-form-v2";
import { Button } from "@/shared/ui/button-v2";
import { Typography } from "@/shared/ui/typography";
import { Card, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";

export function WalletWaitlistStatus() {
  const { address, displayAddress } = useWallet();
  const { data: status, isLoading } = useWalletStatus(address);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [attachedEmail, setAttachedEmail] = useState<string | null>(null);

  // Restore email from localStorage on mount (persists across page revisits)
  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setAttachedEmail(saved);
  }, [address]);

  // Consider email done as soon as local state is set (optimistic) or API confirms it
  const hasEmailCompleted = status?.hasEmail || attachedEmail !== null;

  const steps: Step[] = [
    { id: "wallet", label: "Wallet", state: "done" },
    {
      id: "email",
      label: "Email",
      state: hasEmailCompleted ? "done" : "active",
    },
    {
      id: "done",
      label: "Done",
      state: hasEmailCompleted ? "done" : "inactive",
    },
  ];

  const referralUrl =
    buildReferralUrl(status?.referralCode) ?? null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) return null;

  async function handleCopy() {
    if (!referralUrl) return;
    const ok = await copyToClipboard(referralUrl);
    if (ok) {
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleShareX() {
    if (!referralUrl) return;
    const text = buildXShareText(referralUrl);
    openXShare(text);
  }

  function handleEmailSuccess(email: string) {
    setAttachedEmail(email);
    if (address) localStorage.setItem(`waitlist_email_${address}`, email);

    // Fire confetti on the email step dot
    setTimeout(() => {
      const step2Dot = document.querySelector("[data-step='email']") as HTMLElement | null;
      if (step2Dot) {
        fireConfettiBurst(step2Dot);
      }
    }, 250);

    // Refetch status in background so server state stays in sync
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
    }, 300);
  }

  const emailTaskDone = hasEmailCompleted;

  return (
    <div className="space-y-4">
      {/* 1 — Wallet identity block (compact) */}
      <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 space-y-0.5">
        <p className="text-sm font-semibold text-foreground leading-tight">
          Registered as <span className="font-mono">{displayAddress}</span>
        </p>
        <p className="text-xs text-muted-foreground leading-tight">
          Wallet verified. Finish setup below.
        </p>
      </div>

      {/* 2 — Stepper (evenly spaced) */}
      <ProgressStepper steps={steps} />

      {/* 3 — Stats block */}
      {/* Queue rank card */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <Typography variant="small" className="text-muted-foreground">
              Your queue rank
            </Typography>
            <Typography variant="h2" className="mt-0.5 font-bold">
              {status.queueRank != null ? '#' + String(status.queueRank) : '—'}
              {status.totalEntries != null && status.queueRank != null && (
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  of {status.totalEntries}
                </span>
              )}
            </Typography>
          </div>
          <div className="text-right">
            <Typography variant="small" className="text-muted-foreground">
              Referrals
            </Typography>
            <Typography variant="h3" className="mt-0.5 font-semibold text-primary">
              {status.successfulReferralCount}
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* Referral link card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <Typography variant="small" className="mb-2 text-muted-foreground">
            Your referral link
          </Typography>
          {referralUrl ? (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
                {referralUrl}
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleShareX}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground italic">
              Referral link will appear after registration sync completes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4 — Dedicated email task card (morphs to success on complete) */}
      {emailTaskDone ? (
        <SuccessBanner email={attachedEmail ?? ""} />
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <Typography variant="p" className="mb-1 font-semibold text-foreground">
            Complete your setup
          </Typography>
          <Typography variant="small" className="mb-4 block text-muted-foreground">
            Add your email to receive your access code when early access opens.
          </Typography>
          <WaitlistContactFormV2 onSuccess={handleEmailSuccess} />
        </div>
      )}

      {/* 5 — Share CTA */}
      <Button
        variant="gradient"
        size="lg"
        onClick={handleShareX}
        className="w-full"
      >
        Share on X to climb the queue
      </Button>
    </div>
  );
}

// Wrapper that shows loading state while fetching status from backend
export function WalletWaitlistStatusWithLoading() {
  const { address } = useWallet();
  const { data: status, isLoading } = useWalletStatus(address);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // If status is null (wallet not registered), show registration button
  if (!status) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
        <p className="text-sm text-muted-foreground">
          Wallet connected but not registered yet.
        </p>
      </div>
    );
  }

  return <WalletWaitlistStatus />;
}
