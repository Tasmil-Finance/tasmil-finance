"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { TokenImage } from "@/shared/components/token-image";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Skeleton } from "@/shared/ui/skeleton";
import { useTrustlineableTokens } from "../hooks/use-trustlineable-tokens";

export interface AssetPickerValue {
  code: string;
  issuer: string;
}

interface AssetPickerProps {
  value: AssetPickerValue | null;
  onChange: (asset: AssetPickerValue) => void;
  /** Keys (`${code}:${issuer}`) of assets already trustlined; hidden from the list. */
  excludeKeys: Set<string>;
  disabled?: boolean;
}

export function AssetPicker({ value, onChange, excludeKeys, disabled }: AssetPickerProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useTrustlineableTokens();

  const visible = useMemo(
    () => (data ?? []).filter((t) => !excludeKeys.has(`${t.symbol}:${t.issuer}`)),
    [data, excludeKeys],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-transparent px-3 text-sm outline-none transition-colors hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {value ? (
            <span className="flex min-w-0 items-center gap-2">
              <TokenImage alt={value.code} className="h-5 w-5 shrink-0 rounded-full text-[9px]" />
              <span className="truncate font-medium text-foreground">{value.code}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select asset…</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-0">
        <Command>
          <CommandInput placeholder="Search asset…" />
          <CommandList>
            {isLoading && (
              <div className="flex flex-col gap-1 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="flex flex-col items-center gap-2 py-6 text-center text-sm">
                <span className="text-muted-foreground">Couldn&rsquo;t load assets.</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted/30"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !isError && visible.length === 0 && (
              <CommandEmpty>No assets available.</CommandEmpty>
            )}

            {!isLoading && !isError && visible.length > 0 && (
              <>
                <CommandEmpty>No matches.</CommandEmpty>
                <CommandGroup>
                  {visible.map((t) => (
                    <CommandItem
                      key={`${t.symbol}:${t.issuer}`}
                      value={`${t.symbol} ${t.name ?? ""}`}
                      onSelect={() => {
                        onChange({ code: t.symbol, issuer: t.issuer });
                        setOpen(false);
                      }}
                    >
                      <TokenImage
                        alt={t.symbol}
                        className="h-6 w-6 shrink-0 rounded-full text-[10px]"
                      />
                      <div className="flex min-w-0 flex-col">
                        <span className="font-medium text-foreground">{t.symbol}</span>
                        {t.name && (
                          <span className="truncate text-xs text-muted-foreground">{t.name}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
