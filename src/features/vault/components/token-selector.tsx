"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

import { SUPPORTED_TOKENS } from "../constants";
import type { VaultToken } from "../types";

interface TokenSelectorProps {
  value: VaultToken;
  onChange: (token: VaultToken) => void;
  className?: string;
}

export function TokenSelector({ value, onChange, className }: TokenSelectorProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {SUPPORTED_TOKENS.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => onChange(t.value)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            value === t.value
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border bg-muted/30 text-muted-foreground hover:border-muted-foreground",
          )}
        >
          <Image src={t.icon} alt={t.label} width={20} height={20} />
          {t.label}
        </button>
      ))}
    </div>
  );
}
