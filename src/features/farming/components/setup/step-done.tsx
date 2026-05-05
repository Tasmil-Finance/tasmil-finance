"use client";

import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function StepDone() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => router.replace("/farming"), 1500);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
      <CheckCircle2 className="h-16 w-16 text-emerald-400" />
      <h1 className="font-bold text-2xl text-foreground tracking-tight">All set.</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Your smart account is ready. Tasmil will start rebalancing your deposit shortly.
      </p>
      <p className="text-xs text-muted-foreground/70">Redirecting to your dashboard…</p>
    </div>
  );
}
