"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useWalletStatus } from "@/features/whitelist/hooks/use-wallet-waitlist";
import { fireConfettiBurst } from "@/features/whitelist/lib/confetti-burst";
import {
  buildReferralUrl,
  buildXShareText,
  copyToClipboard,
  openXShare,
} from "@/features/whitelist/lib/share-to-x";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent } from "@/shared/ui/card";
import { Typography } from "@/shared/ui/typography";
import { ProgressStepper, type Step } from "./ui/stepper";
import { SuccessBanner } from "./ui/success-banner";

interface WaitlistScreen3Props {
  /** Email submitted in Screen2 this session u2014 null if skipped */
  submittedEmail: string | null;
}

export function WaitlistScreen3({ submittedEmail }: WaitlistScreen3Props) {
  const { address, displayAddress } = useWallet();
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useWalletStatus(address);
  const [copied, setCopied] = useState(false);
  const [attachedEmail, setAttachedEmail] = useState<string | null>(submittedEmail);

  // Restore email from localStorage on mount (persists across page revisits)
  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setAttachedEmail(saved);
  }, [address]);

  // Sync submittedEmail prop u2192 local state + localStorage
  useEffect(() => {
    if (!submittedEmail || !address) return;
    setAttachedEmail(submittedEmail);
    localStorage.setItem(`waitlist_email_${address}`, submittedEmail);

    // Fire confetti on email step dot
    setTimeout(() => {
      const dot = document.querySelector("[data-step='email']") as HTMLElement | null;
      if (dot) fireConfettiBurst(dot);
    }, 250);

    // Background refetch to sync server state
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", "status", address] });
    }, 300);
  }, [submittedEmail, address, queryClient]);

  const hasEmailCompleted = !!(status?.hasEmail || attachedEmail);

  const steps: Step[] = [
    { id: "wallet", label: "Connect", state: "done" },
    { id: "email", label: "Email", state: hasEmailCompleted ? "done" : "inactive" },
    { id: "done", label: "Done", state: hasEmailCompleted ? "done" : "active" },
  ];

  const referralUrl = buildReferralUrl(status?.referralCode) ?? null;

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
    openXShare(buildXShareText(referralUrl));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ProgressStepper steps={steps} />

      {/* Wallet identity */}
      <div className="space-y-0.5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
        <p className="font-semibold text-foreground text-sm leading-tight">
          Registered as <span className="font-mono">{displayAddress}</span>
        </p>
        <p className="text-muted-foreground text-xs leading-tight">Wallet verified.</p>
      </div>

      {/* Stats */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <Typography variant="small" className="text-muted-foreground">
              Your queue rank
            </Typography>
            <Typography variant="h2" className="mt-0.5 font-bold">
              {status?.queueRank != null ? `#${String(status.queueRank)}` : "u2014"}
              {status?.totalEntries != null && status?.queueRank != null && (
                <span className="ml-2 font-normal text-base text-muted-foreground">
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
              {status?.successfulReferralCount ?? 0}
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* Referral link */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <Typography variant="small" className="mb-2 text-muted-foreground">
            Your referral link
          </Typography>
          {referralUrl ? (
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden text-ellipsis rounded-lg border border-border bg-background px-3 py-2 font-mono text-muted-foreground text-xs">
                {referralUrl}
              </div>
              <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button size="icon" variant="outline" onClick={handleShareX} className="shrink-0">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-muted-foreground text-xs italic">
              Referral link will appear after registration sync completes.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Success banner if email was submitted */}
      {hasEmailCompleted && <SuccessBanner email={attachedEmail ?? ""} />}

      {/* Share CTA */}
      <Button variant="gradient" size="lg" onClick={handleShareX} className="w-full">
        Share on X to climb the queue
      </Button>
    </div>
  );
}
