"use client";

import { cn } from "@/lib/utils";

export interface FilterChip<T extends string> {
  value: T;
  label: string;
}

export interface FilterChipsProps<T extends string> {
  chips: FilterChip<T>[];
  active: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function FilterChips<T extends string>({
  chips,
  active,
  onChange,
  ariaLabel,
}: FilterChipsProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-2"
    >
      {chips.map((chip) => {
        const selected = chip.value === active;
        return (
          <button
            key={chip.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(chip.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted/30"
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
