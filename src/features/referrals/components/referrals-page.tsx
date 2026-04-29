"use client";

import { Check, Copy, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { useReferralSnapshot } from "../hooks/use-referral-snapshot";
import type { ReferralEvent } from "../lib/fetch-referral";
import { LinkXDialog } from "./link-x-dialog";

const SHARE_BASE_URL = "https://tasmil.finance/r";

function buildShareUrl(code: string): string {
  return `${SHARE_BASE_URL}/${code}`;
}

function buildTweetIntent(code: string): string {
  const text = `I'm using @TasmilFinance — try it: ${buildShareUrl(code)}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo}mo ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr}y ago`;
}

function formatKind(kind: ReferralEvent["kind"]): string {
  switch (kind) {
    case "JOIN":
      return "Join bonus";
    case "X_SHARE":
      return "X share";
    default:
      return kind;
  }
}

export function ReferralsPage() {
  const snapshot = useReferralSnapshot();
  const [copied, setCopied] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  if (snapshot.isLoading) {
    return (
      <main
        data-testid="referrals-loading"
        className="mx-auto flex w-full max-w-3xl items-center justify-center px-6 py-10 text-muted-foreground text-sm"
      >
        <span
          aria-hidden
          className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
        />
        Loading referrals…
      </main>
    );
  }

  if (snapshot.isError || !snapshot.data) {
    const message =
      snapshot.error instanceof Error ? snapshot.error.message : "Failed to load referrals";
    return (
      <main
        data-testid="referrals-error"
        className="mx-auto w-full max-w-3xl px-6 py-10 text-destructive text-sm"
      >
        {message}
      </main>
    );
  }

  const { referralCode, totalEarnedCredits, joinClaimedAt, xLinked, recentEvents } = snapshot.data;
  const hasCode = !!referralCode;
  const shareUrl = hasCode ? buildShareUrl(referralCode as string) : "";

  const handleCopyLink = async () => {
    if (!hasCode) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — non-fatal
    }
  };

  const handleShareOnX = () => {
    if (!hasCode || typeof window === "undefined") return;
    window.open(buildTweetIntent(referralCode as string), "_blank", "noopener,noreferrer");
  };

  return (
    <main
      data-testid="referrals-root"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10"
    >
      <header>
        <h1 className="font-bold text-2xl tracking-tight">Referrals</h1>
        <p className="text-muted-foreground text-sm">
          Share your code, get credits when friends join.
        </p>
      </header>

      <Card data-testid="referrals-code-card">
        <CardHeader>
          <CardTitle className="text-base">Your referral code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasCode ? (
            <>
              <div className="flex items-center gap-2">
                <code
                  data-testid="referrals-code"
                  className="flex-1 break-all rounded-md bg-muted px-3 py-2 font-mono text-sm"
                >
                  {referralCode}
                </code>
              </div>
              <p className="text-muted-foreground text-xs">
                Share link: <span className="font-mono">{shareUrl}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  data-testid="referrals-copy-link"
                  variant="outline"
                  onClick={handleCopyLink}
                  disabled={!hasCode}
                >
                  {copied ? <Check /> : <Copy />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
                {xLinked ? (
                  <Button
                    data-testid="referrals-share-x"
                    onClick={handleShareOnX}
                    disabled={!hasCode}
                  >
                    <Share2 />
                    Share on X
                  </Button>
                ) : (
                  <Button
                    data-testid="referrals-link-x"
                    variant="outline"
                    onClick={() => setLinkDialogOpen(true)}
                    disabled={!hasCode}
                  >
                    Link your X account
                  </Button>
                )}
              </div>
            </>
          ) : (
            <p data-testid="referrals-empty" className="text-muted-foreground text-sm">
              No referral code yet — complete waitlist signup to receive one.
            </p>
          )}
        </CardContent>
      </Card>

      <Card data-testid="referrals-stats-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-muted-foreground text-xs">Total earned</p>
            <p
              data-testid="referrals-total-credits"
              className="font-semibold text-2xl tabular-nums"
            >
              {totalEarnedCredits.toLocaleString()} credits
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Join bonus</p>
            <Badge
              data-testid="referrals-join-badge"
              variant={joinClaimedAt ? "default" : "secondary"}
            >
              {joinClaimedAt ? "Claimed" : "Not yet"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="referrals-events-card">
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <p data-testid="referrals-events-empty" className="text-muted-foreground text-sm">
              No referral events yet.
            </p>
          ) : (
            <Table data-testid="referrals-events-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEvents.map((event, idx) => (
                  <TableRow
                    key={`${event.kind}-${event.occurredAt}-${idx}`}
                    data-testid={`referrals-events-row-${event.kind}`}
                  >
                    <TableCell>{formatKind(event.kind)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {event.creditsAwarded > 0 ? `+${event.creditsAwarded}` : event.creditsAwarded}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {relativeTime(event.occurredAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LinkXDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
    </main>
  );
}
