"use client";

import { TrendingUp, Users } from "lucide-react";
import { Typography } from "@/shared/ui/typography";

export function ReferralLoopCard() {
  return (
    <div className="rounded-xl border border-border bg-card/80 p-6">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
        <TrendingUp className="h-6 w-6 text-primary" />
      </div>
      <Typography variant="h4" className="mb-2 font-semibold tracking-tight">
        Climb the queue with referrals
      </Typography>
      <Typography variant="p" className="mb-4 text-muted-foreground text-sm leading-6">
        Every friend who connects their wallet using your link moves you up. The more successful
        referrals, the higher you rank.
      </Typography>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="font-bold text-[10px]">1</span>
          </div>
          <Typography variant="small" className="text-muted-foreground">
            Share your unique referral link
          </Typography>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="font-bold text-[10px]">2</span>
          </div>
          <Typography variant="small" className="text-muted-foreground">
            Friend connects their Stellar wallet
          </Typography>
        </div>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="font-bold text-[10px]">3</span>
          </div>
          <Typography variant="small" className="text-muted-foreground">
            You move up the waitlist queue
          </Typography>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/50 bg-background/50 px-3 py-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Typography variant="small" className="text-muted-foreground">
          Top referrers get priority early access
        </Typography>
      </div>
    </div>
  );
}
