"use client";

import { ShieldCheck, Sparkles, Waypoints } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { WaitlistPhaseBoard } from "@/features/whitelist/components/waitlist-phase-board";
import { ReferralLoopCard } from "@/features/whitelist/components/referral-loop-card";
import { PATHS } from "@/shared/constants/routes";
import { Typography } from "@/shared/ui/typography";

const hybridSections = [
  {
    title: "AI portfolio management, built for real-world rails",
    body:
      "Tasmil Finance is designed for investors who want intelligent allocation, disciplined execution, and a cleaner path into onchain portfolio management without noisy interfaces or fragmented workflows.",
    icon: Sparkles,
  },
  {
    title: "Built on Stellar for fast, efficient access",
    body:
      "We are building on Stellar because it offers efficient settlement, dependable global payment rails, and an ecosystem that matches a more accessible, scalable portfolio experience.",
    icon: Waypoints,
  },
  {
    title: "Early access comes with priority onboarding",
    body:
      "Join the waitlist to receive product updates, launch access, and earlier onboarding opportunities as the first Tasmil Finance experience rolls out on Stellar.",
    icon: ShieldCheck,
  },
] as const;

export default function WhitelistPage() {
  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(82,168,255,0.16),transparent_45%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center sm:px-8 lg:px-12">
          <Typography
            variant="h1"
            className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Tasmil Finance
          </Typography>

          <Typography
            variant="h2"
            className="mt-3 max-w-3xl text-2xl font-medium tracking-tight text-foreground/90 sm:text-3xl lg:text-4xl"
          >
            AI-managed portfolios for the Stellar ecosystem
          </Typography>

          <Typography
            variant="p"
            className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
          >
            Join the waitlist for a more refined way to access automated portfolio
            management on Stellar — designed for faster execution, cleaner workflows,
            and smarter capital allocation from day one.
          </Typography>

          <div className="mt-10 w-full max-w-[440px]">
            <Suspense fallback={<div className="h-40 w-full rounded-2xl border border-border bg-card/80 animate-pulse" />}>
              <WaitlistPhaseBoardWithRef />
            </Suspense>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>Institutional-grade UX</span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Built for Stellar</span>
            <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
            <span>Priority early onboarding</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a
              className="transition-colors hover:text-foreground"
              href={PATHS.TELEGRAM}
              rel="noopener noreferrer"
              target="_blank"
            >
              Telegram
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href={PATHS.X}
              rel="noopener noreferrer"
              target="_blank"
            >
              X / Twitter
            </a>
            <a
              className="transition-colors hover:text-foreground"
              href={PATHS.DOCS}
              rel="noopener noreferrer"
              target="_blank"
            >
              Docs
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[440px] px-6 py-10 sm:px-8">
        <ReferralLoopCard />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-primary">
            Why join now
          </p>
          <Typography
            variant="h3"
            className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            A sharper prelaunch story, without bloated marketing sections
          </Typography>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {hybridSections.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <Typography variant="h4" className="text-lg font-semibold tracking-tight">
                {title}
              </Typography>
              <Typography
                variant="p"
                className="mt-3 text-sm leading-7 text-muted-foreground"
              >
                {body}
              </Typography>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WaitlistPhaseBoardWithRef() {
  const searchParams = useSearchParams();
  const referredByCode = searchParams.get("ref");
  return <WaitlistPhaseBoard referredByCode={referredByCode} />;
}
