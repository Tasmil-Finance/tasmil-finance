"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TokenImage } from "@/shared/components/token-image";
import { keyOf, useWatchList } from "@/store/use-watch-list";

export function WatchListSection() {
  const items = useWatchList((s) => s.items);
  const removeAsset = useWatchList((s) => s.removeAsset);
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
        Watching · {items.length}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const k = keyOf(item);
          const chain = item.chain ?? "stellar";
          return (
            <div
              key={k}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
            >
              <button
                type="button"
                aria-label={`Open ${item.symbol} in aggregator`}
                onClick={() => router.push(`/aggregator?tokenIn=${item.symbol}&chainIn=${chain}`)}
                className="flex items-center gap-1.5 hover:opacity-80"
              >
                <TokenImage alt={item.symbol} className="h-5 w-5 rounded-full text-[9px]" />
                <span className="font-medium text-foreground text-sm">{item.symbol}</span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${item.symbol}`}
                onClick={() => removeAsset(k)}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
