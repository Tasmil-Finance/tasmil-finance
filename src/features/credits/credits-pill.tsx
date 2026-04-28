"use client";

import { Coins } from "lucide-react";
import Link from "next/link";
import { useCredits } from "./use-credits";

export function CreditsPill() {
  const { data, isLoading } = useCredits();
  const credits = data?.credits ?? 0;
  const display = isLoading ? "—" : new Intl.NumberFormat("en-US").format(credits);

  return (
    <Link
      href="/profile/credits"
      data-testid="credits-pill"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 font-medium text-foreground text-xs transition-colors hover:bg-muted"
    >
      <Coins className="h-3.5 w-3.5 text-primary" />
      <span data-testid="credits-pill-amount">{display}</span>
      <span className="text-muted-foreground">credits</span>
    </Link>
  );
}
