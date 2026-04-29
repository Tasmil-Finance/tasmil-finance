"use client";

import type { AxiosError } from "axios";
import { useEffect, useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import backendAxios from "@/lib/kubb-backend";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

interface VerifyShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface VerifyShareResponse {
  credited: boolean;
  reason?: string;
  creditsAwarded?: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

function unwrap<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "success" in payload) {
    const env = payload as ApiEnvelope<T>;
    if (!env.success) throw new Error("backend reported success=false");
    return env.data;
  }
  return payload as T;
}

type DialogState =
  | { kind: "idle" }
  | { kind: "verifying" }
  | { kind: "success"; creditsAwarded: number }
  | { kind: "already_redeemed" }
  | { kind: "error"; message: string };

const X_SHARE_CREDIT_AMOUNT = 30;

function mapBackendError(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string; error?: string }> | undefined;
  const status = axiosErr?.response?.status;
  const raw =
    axiosErr?.response?.data?.message ||
    axiosErr?.response?.data?.error ||
    (err instanceof Error ? err.message : "");

  if (status === 503) return "Verification temporarily unavailable — please retry in a few minutes.";
  if (status === 400) return "Invalid tweet URL.";
  if (typeof raw !== "string") return "Failed to verify tweet.";
  if (raw.includes("X_NOT_LINKED")) return "Link your X account first.";
  if (raw.includes("TWEET_NOT_ELIGIBLE")) {
    if (raw.includes("replies")) return "Only original tweets — replies are not allowed.";
    if (raw.includes("quotes")) return "Only original tweets — quote-tweets are not allowed.";
    if (raw.includes("retweets")) return "Only original tweets — retweets are not allowed.";
    return "Tweet is not eligible — must be an original tweet.";
  }
  if (raw.includes("TWEET_AUTHOR_MISMATCH"))
    return "This tweet is from a different X account than the one you linked.";
  if (raw.includes("TWEET_TOO_OLD")) return "Tweet must have been posted within the last 24 hours.";
  if (raw.includes("MISSING_REFERRAL_CODE")) return "Tweet must include your referral code.";
  if (raw.includes("INVALID_TWEET_URL")) return "Invalid tweet URL.";
  return raw || "Failed to verify tweet.";
}

export function VerifyShareDialog({ open, onOpenChange }: VerifyShareDialogProps) {
  const [state, setState] = useState<DialogState>({ kind: "idle" });
  const [tweetUrl, setTweetUrl] = useState("");
  const tweetUrlInputId = useId();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setState({ kind: "idle" });
    setTweetUrl("");
  }, [open]);

  const handleVerify = async () => {
    if (!tweetUrl.trim()) {
      setState({ kind: "error", message: "Please paste your tweet URL" });
      return;
    }
    setState({ kind: "verifying" });
    try {
      const res = await backendAxios.post<
        ApiEnvelope<VerifyShareResponse> | VerifyShareResponse
      >("/api/referral/verify-share", { tweetUrl: tweetUrl.trim() });
      const data = unwrap(res.data);
      if (data.credited) {
        const credits = data.creditsAwarded ?? X_SHARE_CREDIT_AMOUNT;
        setState({ kind: "success", creditsAwarded: credits });
        void queryClient.invalidateQueries({ queryKey: ["referral"] });
        return;
      }
      if (data.reason === "ALREADY_REDEEMED") {
        setState({ kind: "already_redeemed" });
        return;
      }
      setState({
        kind: "error",
        message: data.reason ?? "Verification failed for unknown reason.",
      });
    } catch (err) {
      setState({ kind: "error", message: mapBackendError(err) });
    }
  };

  const isBusy = state.kind === "verifying";
  const isTerminal = state.kind === "success" || state.kind === "already_redeemed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="verify-share-dialog-root">
        <DialogHeader>
          <DialogTitle>Verify your share tweet</DialogTitle>
          <DialogDescription>
            Paste the URL of your tweet that includes your referral code. You&apos;ll earn +
            {X_SHARE_CREDIT_AMOUNT} credits per validated tweet.
          </DialogDescription>
        </DialogHeader>

        {state.kind === "error" && (
          <p data-testid="verify-share-dialog-error" className="text-destructive text-sm">
            {state.message}
          </p>
        )}

        {state.kind === "success" && (
          <p data-testid="verify-share-dialog-success" className="text-sm">
            Verified! +{state.creditsAwarded} credits earned. Refresh the page to update your
            balance.
          </p>
        )}

        {state.kind === "already_redeemed" && (
          <p data-testid="verify-share-dialog-already-redeemed" className="text-sm">
            This tweet was already used to claim credits. Post a new tweet with your referral code
            to earn more.
          </p>
        )}

        {!isTerminal && (
          <div className="flex flex-col gap-2">
            <label htmlFor={tweetUrlInputId} className="text-muted-foreground text-xs">
              Paste tweet URL
            </label>
            <Input
              id={tweetUrlInputId}
              data-testid="verify-share-dialog-tweet-url"
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              placeholder="https://x.com/..."
              disabled={isBusy}
            />
            <Button
              data-testid="verify-share-dialog-verify"
              onClick={handleVerify}
              disabled={isBusy || !tweetUrl.trim()}
            >
              {isBusy ? "Verifying…" : "Verify tweet"}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button
            data-testid="verify-share-dialog-close"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
