"use client";

import { cn } from "@/lib/utils";

export type Mode = "AUTO" | "CUSTOM";

interface Props {
  value: Mode;
  onChange: (next: Mode) => void;
  /** Suffix appended to "Auto" pill (e.g. "Balanced") when AUTO is active. */
  autoLabelSuffix?: string;
  disabled?: boolean;
}

export function ModeToggle({ value, onChange, autoLabelSuffix, disabled }: Props) {
  const Pill = ({ mode, label }: { mode: Mode; label: string }) => {
    const active = value === mode;
    return (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={active}
        onClick={() => !disabled && onChange(mode)}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs transition-all",
          "disabled:cursor-not-allowed disabled:opacity-50",
          active
            ? "bg-primary/15 border-primary text-primary"
            : "bg-[#0e0e0e] border-[#2a2a2a] text-[#888] hover:border-[#444]"
        )}
      >
        {label}
      </button>
    );
  };
  const autoLabel = value === "AUTO" && autoLabelSuffix ? `Auto · ${autoLabelSuffix}` : "Auto";
  return (
    <div className="flex gap-2">
      <Pill mode="AUTO" label={autoLabel} />
      <Pill mode="CUSTOM" label="Custom" />
    </div>
  );
}
