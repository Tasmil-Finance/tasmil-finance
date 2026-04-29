"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function ReferralLandingPage({ params }: PageProps) {
  const router = useRouter();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    void (async () => {
      const { code } = await params;
      // Persist for the waitlist signup form to pick up.
      try {
        localStorage.setItem("tasmil.referral.pendingCode", code);
      } catch {
        /* storage disabled — non-fatal */
      }
      router.replace(`/?ref=${encodeURIComponent(code)}`);
    })();
  }, [params, router]);

  return (
    <main
      data-testid="referral-landing"
      className="flex min-h-screen items-center justify-center text-muted-foreground text-sm"
    >
      Redirecting…
    </main>
  );
}
