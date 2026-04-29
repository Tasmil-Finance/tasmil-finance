"use client";

import type { AxiosError } from "axios";
import { useEffect, useId, useState } from "react";
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

interface LinkXDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LinkStartResponse {
  nonce: string;
  intentUrl?: string;
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
  | { kind: "loading" }
  | { kind: "disabled"; message: string }
  | { kind: "ready"; nonce: string; intentUrl?: string }
  | { kind: "verifying" }
  | { kind: "error"; message: string }
  | { kind: "success" };

export function LinkXDialog({ open, onOpenChange }: LinkXDialogProps) {
  const [state, setState] = useState<DialogState>({ kind: "loading" });
  const [tweetUrl, setTweetUrl] = useState("");
  const tweetUrlInputId = useId();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setState({ kind: "loading" });
    setTweetUrl("");

    void (async () => {
      try {
        const res = await backendAxios.post<ApiEnvelope<LinkStartResponse> | LinkStartResponse>(
          "/api/referral/link-x/start"
        );
        if (cancelled) return;
        const data = unwrap(res.data);
        setState({ kind: "ready", nonce: data.nonce, intentUrl: data.intentUrl });
      } catch (err) {
        if (cancelled) return;
        const status = (err as AxiosError | undefined)?.response?.status;
        if (status === 501) {
          setState({
            kind: "disabled",
            message: "X linking is not yet available — coming soon",
          });
        } else {
          const message = err instanceof Error ? err.message : "Failed to start X linking flow";
          setState({ kind: "error", message });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleVerify = async () => {
    if (!tweetUrl.trim()) {
      setState({ kind: "error", message: "Please paste your tweet URL" });
      return;
    }
    setState({ kind: "verifying" });
    try {
      await backendAxios.post("/api/referral/link-x/verify", { tweetUrl: tweetUrl.trim() });
      setState({ kind: "success" });
    } catch (err) {
      const status = (err as AxiosError | undefined)?.response?.status;
      if (status === 501) {
        setState({
          kind: "disabled",
          message: "X linking is not yet available — coming soon",
        });
        return;
      }
      const message = err instanceof Error ? err.message : "Failed to verify tweet";
      setState({ kind: "error", message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="link-x-dialog-root">
        <DialogHeader>
          <DialogTitle>Link your X account</DialogTitle>
          <DialogDescription>
            Compose a verification tweet so we can link your handle to your wallet.
          </DialogDescription>
        </DialogHeader>

        {state.kind === "loading" && (
          <p data-testid="link-x-dialog-loading" className="text-muted-foreground text-sm">
            Preparing verification…
          </p>
        )}

        {state.kind === "disabled" && (
          <p data-testid="link-x-dialog-disabled-message" className="text-muted-foreground text-sm">
            {state.message}
          </p>
        )}

        {state.kind === "error" && (
          <p data-testid="link-x-dialog-error" className="text-destructive text-sm">
            {state.message}
          </p>
        )}

        {(state.kind === "ready" || state.kind === "verifying") && (
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-muted-foreground text-xs">Verification nonce</p>
              <code
                data-testid="link-x-dialog-nonce"
                className="block break-all rounded-md bg-muted px-2 py-1 text-sm"
              >
                {state.kind === "ready" ? state.nonce : ""}
              </code>
            </div>
            {state.kind === "ready" && state.intentUrl ? (
              <Button
                data-testid="link-x-dialog-open-twitter"
                variant="outline"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(state.intentUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                Open Twitter to compose tweet
              </Button>
            ) : null}
            <div className="flex flex-col gap-2">
              <label htmlFor={tweetUrlInputId} className="text-muted-foreground text-xs">
                Paste tweet URL
              </label>
              <Input
                id={tweetUrlInputId}
                data-testid="link-x-dialog-tweet-url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://x.com/..."
                disabled={state.kind === "verifying"}
              />
            </div>
            <Button
              data-testid="link-x-dialog-verify"
              onClick={handleVerify}
              disabled={state.kind === "verifying"}
            >
              {state.kind === "verifying" ? "Verifying…" : "Verify tweet"}
            </Button>
          </div>
        )}

        {state.kind === "success" && (
          <p data-testid="link-x-dialog-success" className="text-sm">
            X account linked. You can close this dialog.
          </p>
        )}

        <DialogFooter>
          <Button
            data-testid="link-x-dialog-close"
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
