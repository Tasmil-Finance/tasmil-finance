"use client";

import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useWatchList } from "@/store/use-watch-list";

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

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const [tokens, setTokens] = useState<RegistryToken[]>([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const addAsset = useWatchList((s) => s.addAsset);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toUpperCase()), 200);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!open || tokens.length > 0) return;
    let cancelled = false;
    fetch("/api/tokens")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: RegistryResponse) => {
        if (!cancelled) setTokens(data.tokens ?? []);
      })
      .catch(() => {
        // Silent failure: dialog stays usable but empty
      });
    return () => {
      cancelled = true;
    };
  }, [open, tokens.length]);

  const filtered = useMemo(() => {
    if (!debounced) return [];
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

          {!debounced && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Search to add assets to your watchlist.
            </p>
          )}

          {debounced && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No matches for &ldquo;{debounced}&rdquo;.
            </p>
          )}

          <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {filtered.map((t) => (
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
                <Button size="sm" variant="outline" onClick={() => handleAdd(t)}>
                  Watch
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
