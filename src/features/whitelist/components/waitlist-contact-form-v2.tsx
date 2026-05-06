"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useWalletStatus } from "@/features/whitelist/hooks/use-wallet-waitlist";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button-v2";
import { Input } from "@/shared/ui/input";
import { Typography } from "@/shared/ui/typography";

interface WaitlistContactFormV2Props {
  onSuccess: (email: string) => void;
}

function isValidEmail(email: string): boolean {
  return /@/.test(email) && /\./.test(email);
}

export function WaitlistContactFormV2({ onSuccess }: WaitlistContactFormV2Props) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const { address } = useWallet();
  const { refetch: refetchStatus } = useWalletStatus(address);

  // Pre-fill email from localStorage if user previously attached one
  useEffect(() => {
    if (!address) return;
    const saved = localStorage.getItem(`waitlist_email_${address}`);
    if (saved) setEmail(saved);
  }, [address]);

  const emailValid = isValidEmail(email.trim());
  const canSubmit = emailValid && !isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address ?? "",
          email: email.trim().toLowerCase(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({
          message: "Failed to attach email",
        }));
        throw new Error(err.message ?? "Failed to attach email");
      }

      setIsExiting(true);
      setTimeout(() => {
        refetchStatus();
        onSuccess(email.trim().toLowerCase());
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${error ? "animate-shake" : ""} ${isExiting ? "animate-fade-slide-out" : ""}`}
    >
      {/* Responsive layout: row on desktop, stacked on mobile */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        {/* Email input */}
        <div className="relative flex-1">
          <Input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            className={`h-11 w-full rounded-xl border bg-background px-3 py-2 pr-10 text-foreground text-sm transition-colors duration-200 placeholder:text-muted-foreground ${
              email.length > 0
                ? emailValid
                  ? "border-green-500 focus-visible:ring-green-500/30"
                  : "border-border"
                : "border-border"
            }`}
            required
          />
          {email.length > 0 && emailValid && (
            <div className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 animate-stepper-pop">
              <svg className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!canSubmit}
          variant={canSubmit ? "gradient" : "outline"}
          size="lg"
          className="h-11 shrink-0 px-6 transition-all duration-200"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Attach"}
        </Button>
      </div>

      {/* Error — stable below form, no layout jump */}
      {error && (
        <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2">
          <Typography variant="small" className="text-destructive">
            {error}
          </Typography>
        </div>
      )}
    </form>
  );
}
