"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TokenImage } from "@/shared/components/token-image";
import { useWatchList } from "@/store/use-watch-list";

export function WatchListSection() {
  const items = useWatchList((s) => s.items);
  const removeAsset = useWatchList((s) => s.removeAsset);
  const router = useRouter();

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Watching · {items.length}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5"
          >
            <button
              type="button"
              aria-label={`Open ${item.symbol} in aggregator`}
              onClick={() =>
                router.push(`/aggregator?tokenIn=${item.symbol}&chainIn=stellar`)
              }
              className="flex items-center gap-1.5 hover:opacity-80"
            >
              <TokenImage alt={item.symbol} className="h-5 w-5 rounded-full text-[9px]" />
              <span className="text-sm font-medium text-foreground">{item.symbol}</span>
            </button>
            <button
              type="button"
              aria-label={`Remove ${item.symbol}`}
              onClick={() => removeAsset(item.symbol)}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
