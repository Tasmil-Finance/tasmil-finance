"use client";

import { Wallet } from "lucide-react";
import { useWallet } from "@/shared/context/wallet-context";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { ProgressStepper, type Step } from "./ui/stepper";
import { WaitlistContactFormV2 } from "./waitlist-contact-form-v2";

interface WaitlistScreen2Props {
  onEmailSuccess: (email: string) => void;
  onSkip: () => void;
}

const STEPS: Step[] = [
  { id: "wallet", label: "Connect", state: "done" },
  { id: "email", label: "Email", state: "active" },
  { id: "done", label: "Done", state: "inactive" },
];

export function WaitlistScreen2({ onEmailSuccess, onSkip }: WaitlistScreen2Props) {
  const { displayAddress } = useWallet();

  return (
    <div className="flex flex-col gap-4">
      <ProgressStepper steps={STEPS} />

      <div className="text-center">
        <Typography variant="h4" className="text-center font-bold uppercase tracking-wide">
          One More Step
        </Typography>
        <Typography variant="small" className="mt-1 text-center text-muted-foreground">
          Add your email to receive your access code when we launch.
        </Typography>
      </div>

      {/* Compact wallet identity */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
          <Wallet className="h-4 w-4 text-primary" />
        </div>
        <div>
          <Typography variant="small" className="font-medium text-foreground">
            Wallet registered
          </Typography>
          <Typography variant="small" className="text-muted-foreground">
            {displayAddress}
          </Typography>
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <Typography variant="p" className="mb-1 font-semibold text-foreground">
          Complete your setup
        </Typography>
        <Typography variant="small" className="mb-4 block text-muted-foreground">
          We&apos;ll notify you once early access opens.
        </Typography>
        <WaitlistContactFormV2 onSuccess={onEmailSuccess} />
      </div>

      <Button
        type="button"
        variant="link"
        onClick={onSkip}
        className="h-auto p-0 text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
      >
        Skip for now
      </Button>
    </div>
  );
}
