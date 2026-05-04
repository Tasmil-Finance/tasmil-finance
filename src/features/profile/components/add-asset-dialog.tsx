"use client";

import { Check, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TokenImage } from "@/shared/components/token-image";
import { Button } from "@/shared/ui/button-v2";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { keyOf, useWatchList } from "@/store/use-watch-list";

const DEFAULT_SYMBOLS = ["USDC", "XLM", "BLND", "AQUA", "USDT", "EURC", "yXLM", "SHX"] as const;

interface RegistryToken {
  symbol: string;
  name?: string;
  chains?: string[];
  addresses?: Record<string, string>;
}

interface RegistryResponse {
  tokens?: RegistryToken[];
}

function shorten(addr?: string): string | null {
  if (!addr) return null;
  if (addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Status = "idle" | "loading" | "error" | "ready";

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const [tokens, setTokens] = useState<RegistryToken[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const isWatched = useWatchList((s) => s.isWatched);
  const addAsset = useWatchList((s) => s.addAsset);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toUpperCase()), 200);
    return () => clearTimeout(id);
  }, [query]);

  const fetchTokens = useCallback(() => {
    setStatus("loading");
    fetch("/api/tokens")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: RegistryResponse) => {
        setTokens(data.tokens ?? []);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!open) return;
    if (status !== "idle") return;
    fetchTokens();
  }, [open, status, fetchTokens]);

  const filtered = useMemo(() => {
    if (!debounced) {
      // Curated default: preserve DEFAULT_SYMBOLS order, skip any missing from registry.
      const bySymbol = new Map(tokens.map((t) => [t.symbol?.toUpperCase(), t]));
      return DEFAULT_SYMBOLS.flatMap((sym) => {
        const t = bySymbol.get(sym);
        return t ? [t] : [];
      });
    }
    return tokens.filter((t) => t.symbol?.toUpperCase().includes(debounced)).slice(0, 30);
  }, [tokens, debounced]);

  function handleAdd(token: RegistryToken) {
    addAsset({
      symbol: token.symbol,
      chain: "stellar",
      contractId: token.addresses?.stellar,
    });
    onOpenChange(false);
    setQuery("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Watch Asset
          </DialogTitle>
          <DialogDescription>
            Search by symbol and add to your portfolio watchlist.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assets…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {status === "loading" && (
            <ul className="flex flex-col gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  data-testid="watchlist-row-skeleton"
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-7 w-16 rounded-md" />
                </li>
              ))}
            </ul>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-sm text-muted-foreground">Couldn&rsquo;t load assets.</p>
              <Button variant="outline" size="sm" onClick={fetchTokens}>
                Retry
              </Button>
            </div>
          )}

          {status === "ready" && debounced && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No matches for &ldquo;{debounced}&rdquo;.
            </p>
          )}

          {status === "ready" && (
            <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {filtered.map((t) => {
                const k = keyOf({
                  symbol: t.symbol,
                  chain: "stellar",
                  contractId: t.addresses?.stellar,
                });
                const watched = isWatched(k);
                return (
                  <li
                    key={`${t.symbol}-${t.addresses?.stellar ?? "native"}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/30"
                  >
                    <TokenImage alt={t.symbol} className="h-8 w-8 rounded-full text-[10px]" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{t.symbol}</div>
                      {t.addresses?.stellar && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {shorten(t.addresses.stellar)}
                        </div>
                      )}
                    </div>
                    {watched ? (
                      <Button size="sm" variant="ghost" disabled className="gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Watching
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleAdd(t)}>
                        Watch
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
