"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createQuote } from "@/features/topup/lib/create-quote";
import { useAuthStore } from "@/store/use-auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ packageId: string }>;
}

export default function FiatQuotePage({ params }: PageProps) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isExpired = useAuthStore((s) => s.isTokenExpired());
  const [error, setError] = useState<string | null>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    void (async () => {
      const { packageId } = await params;
      if (!accessToken || isExpired) {
        router.replace(`/login?next=/topup/${packageId}/quote/fiat`);
        return;
      }
      try {
        const quote = await createQuote(packageId, "FIAT");
        router.replace(`/topup/${quote.topupId}/wait`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown error";
        setError(message);
      }
    })();
  }, [accessToken, isExpired, params, router]);

  return (
    <div
      data-testid="topup-quote-fiat-loader"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground text-sm"
    >
      {error ? (
        <>
          <p className="text-destructive">Failed to create quote: {error}</p>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-muted"
            onClick={() => router.replace("/topup")}
          >
            Back to Top up
          </button>
        </>
      ) : (
        <>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden />
          <p>Creating fiat quote…</p>
        </>
      )}
    </div>
  );
}
