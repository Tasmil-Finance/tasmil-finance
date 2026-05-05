"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mode } from "../shared/mode-toggle";

interface Props {
  mode: Mode;
  onSelect: (mode: Mode) => void;
  onBack?: () => void;
}

export function StepStrategy({ mode, onSelect, onBack }: Props) {
  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] w-full flex-col items-center bg-background px-6 pt-6">
      {onBack && (
        <button
          type="button"
          aria-label="Back"
          onClick={onBack}
          className="absolute top-4 left-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-16 md:gap-24">
        <h1 className="text-center font-bold text-5xl text-foreground tracking-tight md:text-7xl">
          Agent Strategy
        </h1>

        <div className="flex items-center -space-x-12 md:-space-x-16">
          <ModeCircle
            label="Auto"
            selected={mode === "AUTO"}
            onClick={() => onSelect("AUTO")}
          />
          <ModeCircle
            label="Custom"
            selected={mode === "CUSTOM"}
            onClick={() => onSelect("CUSTOM")}
          />
        </div>
      </div>
    </div>
  );
}

interface ModeCircleProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function ModeCircle({ label, selected, onClick }: ModeCircleProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex h-[280px] w-[280px] items-center justify-center rounded-full font-medium text-2xl text-foreground transition-all duration-200 md:h-[400px] md:w-[400px] md:text-3xl",
        selected
          ? "bg-zinc-700/90 ring-2 ring-white/20"
          : "bg-zinc-800/70 hover:bg-zinc-700/80"
      )}
    >
      {label}
    </button>
  );
}
