"use client";

import { Sparkles } from "lucide-react";

export function RewardsCard() {
  return (
    <div
      data-stub="true"
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5"
    >
      <Sparkles className="absolute top-4 right-4 h-12 w-12 text-primary/30" aria-hidden />
      <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
        NEW · 15% APR
      </span>
      <h3 className="mt-3 font-semibold text-foreground text-lg leading-tight">
        Earn smarter <br /> with Tasmil rewards
      </h3>
      <div className="mt-4 flex flex-col gap-1 text-sm">
        <p className="text-xs text-muted-foreground">Total Tasmil Rewards</p>
        <p className="font-mono font-semibold text-foreground tabular-nums">— TASMIL</p>
      </div>
      <button
        type="button"
        disabled
        className="mt-4 w-full rounded-lg bg-primary/20 py-2 text-sm font-semibold text-primary/70"
      >
        Stake TASMIL — coming soon
      </button>
    </div>
  );
}
