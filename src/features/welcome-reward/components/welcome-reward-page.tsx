"use client";

import { ArrowLeft, CheckCircle2, Compass, Gift, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import { useWelcomeReward } from "../hooks/use-welcome-reward";

const COUNTING_RULES = [
  {
    title: "Supported routes only",
    description: "Only supported Tasmil-routed transactions count in the current phase.",
    icon: Sparkles,
    iconClassName: "text-primary",
  },
  {
    title: "Hash reported from client",
    description: "The client reports only the transaction hash.",
    icon: Compass,
    iconClassName: "text-sky-300",
  },
  {
    title: "Memo verified on backend",
    description:
      "The backend verifies the memo on-chain and derives supported volume from that transaction.",
    icon: CheckCircle2,
    iconClassName: "text-emerald-300",
  },
];

const SUPPORTED_APPS = ["Blend Protocol", "Aquarius", "Stellar DEX", "DeFindex"];

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export function WelcomeRewardPage() {
  const router = useRouter();
  const { status, isLoading, isError, refetch } = useWelcomeReward();

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center p-6 lg:p-10">
        <Card className="w-full max-w-xl border-border bg-card shadow-sm">
          <CardContent className="p-8">
            <p className="font-medium text-foreground text-lg">Loading reward progress...</p>
            <p className="mt-2 text-muted-foreground text-sm">
              Checking your current tracked volume and unlock status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center p-6 lg:p-10">
        <Card className="w-full max-w-xl border-border bg-card shadow-sm">
          <CardContent className="p-8">
            <p className="font-semibold text-foreground text-xl">Reward progress unavailable</p>
            <p className="mt-2 text-muted-foreground text-sm">
              The reward tracker could not load right now. Retry without leaving your session.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => void refetch()} variant="outline">
                Retry
              </Button>
              <Link href="/chat/new">
                <Button>Back To Chat</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-6 lg:py-10">
      <div className="mb-6 space-y-3">
        <Link
          href="/chat/new"
          className="inline-flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chat
        </Link>

        <div className="space-y-2">
          <Badge
            variant="secondary"
            className="border border-primary/20 bg-primary/10 text-[11px] text-primary uppercase tracking-[0.16em]"
          >
            Welcome reward
          </Badge>
          <h1 className="font-semibold text-2xl text-foreground">Track your reserved reward</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            This page shows how close this wallet is to unlocking its reserved welcome reward.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)]">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <Gift className="h-5 w-5" />
              </div>

              <div className="space-y-2">
                <Badge
                  variant="secondary"
                  className="border border-border bg-muted/40 text-[11px] text-muted-foreground uppercase tracking-[0.16em]"
                >
                  {status.unlocked ? "Unlocked" : "In progress"}
                </Badge>
                <CardTitle className="text-2xl">
                  {status.unlocked ? "Reward unlocked" : "Trade ≥ $10 volume to unlock"}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {status.unlocked && status.unlockedAt
                    ? `Unlocked on ${new Date(status.unlockedAt).toLocaleString()}.`
                    : "Hit $10 in cumulative gross volume to unlock this reward."}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-xl border border-border bg-muted/10 p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
                    Tracked volume
                  </p>
                  <p className="mt-1 font-semibold text-2xl text-foreground">
                    {formatUsd(status.currentVolumeUsd)} of {formatUsd(status.targetVolumeUsd)}
                  </p>
                </div>
                <p className="font-medium text-foreground text-sm">
                  {Math.round(status.progressPercent)}% complete
                </p>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#B5EAFF] to-[#00BFFF] transition-all"
                  style={{ width: `${Math.min(status.progressPercent, 100)}%` }}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/10 p-4">
                <p className="font-medium text-foreground text-sm">Reserved for this wallet</p>
                <p className="mt-1 text-muted-foreground text-sm">
                  The reward was reserved when you authenticated with your Stellar wallet for the
                  first time.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/10 p-4">
                <p className="font-medium text-foreground text-sm">
                  {status.unlocked ? "Unlocked on" : "Unlock target"}
                </p>
                <p className="mt-1 text-muted-foreground text-sm">
                  {status.unlocked && status.unlockedAt
                    ? new Date(status.unlockedAt).toLocaleString()
                    : "Progress counts toward the first $10 in cumulative gross volume."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="gradient" onClick={() => router.push("/chat/new")}>
                Keep Trading
              </Button>
              {process.env.NEXT_PUBLIC_APP_ENV === "development" ? (
                <Button variant="outline" onClick={() => router.push("/aggregator")}>
                  Open Aggregator
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">How volume counts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {COUNTING_RULES.map(({ title, description, icon: Icon, iconClassName }) => (
                <div key={title} className="rounded-xl border border-border bg-muted/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 ring-1 ring-border">
                      <Icon className={`h-4 w-4 ${iconClassName}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{title}</p>
                      <p className="mt-1 text-muted-foreground text-sm">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Supported apps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Volume is currently tracked for supported flows routed through these apps.
              </p>

              <div className="flex flex-wrap gap-2">
                {SUPPORTED_APPS.map((app) => (
                  <Badge
                    key={app}
                    variant="secondary"
                    className="border border-border bg-muted/40 px-3 py-1 text-foreground"
                  >
                    {app}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
