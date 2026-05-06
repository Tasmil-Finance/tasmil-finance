"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterCategory = "all" | "transfer" | "swap" | "defi" | "other" | "failed";

const CHIPS: ReadonlyArray<{ value: FilterCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "transfer", label: "Send/Receive" },
  { value: "swap", label: "Swap" },
  { value: "defi", label: "DeFi" },
  { value: "other", label: "Other" },
  { value: "failed", label: "Failed" },
];

export interface FilterState {
  filters: FilterCategory[];
  query: string;
}

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
}

export function TransactionFilterBar({ value, onChange }: Props) {
  const isActive = (chip: FilterCategory) => {
    if (chip === "all") return value.filters.length === 0;
    return value.filters.includes(chip);
  };

  const toggle = (chip: FilterCategory) => {
    if (chip === "all") {
      onChange({ ...value, filters: [] });
      return;
    }
    const next = isActive(chip)
      ? value.filters.filter((f) => f !== chip)
      : [...value.filters, chip];
    onChange({ ...value, filters: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 pb-2">
      {CHIPS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => toggle(c.value)}
          className={cn(
            "rounded-full border px-3 py-1 font-medium text-xs transition-colors",
            isActive(c.value)
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          {c.label}
        </button>
      ))}
      <div className="relative ml-auto">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search hash or address"
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          className="rounded-full border border-border/60 bg-card py-1 pr-3 pl-8 text-foreground text-xs placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none"
        />
      </div>
    </div>
  );
}
