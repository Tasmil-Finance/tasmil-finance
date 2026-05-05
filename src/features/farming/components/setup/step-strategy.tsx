"use client";

import { CircleButton } from "../shared/circle-button";
import type { Mode } from "../shared/mode-toggle";

interface Props {
  value: Mode;
  onChange: (next: Mode) => void;
  customComingSoon?: boolean;
}

const CAPTIONS: Record<Mode, string> = {
  AUTO: "Your agent will be motivated to secure the highest yield for your stable investments. You can always customize your options if you wish.",
  CUSTOM: "You'll pick which markets the agent uses. Your selection persists and you can change it any time.",
};

export function StepStrategy({ value, onChange, customComingSoon }: Props) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-4">
        <CircleButton
          variant={value === "AUTO" ? "radial-cyan" : "ghost"}
          size="lg"
          onClick={() => onChange("AUTO")}
          aria-pressed={value === "AUTO"}
        >
          Auto
        </CircleButton>
        <CircleButton
          variant={value === "CUSTOM" ? "radial-cyan" : "ghost"}
          size="lg"
          disabled={!!customComingSoon}
          onClick={() => !customComingSoon && onChange("CUSTOM")}
          aria-pressed={value === "CUSTOM"}
        >
          Custom
        </CircleButton>
      </div>
      <p className="max-w-[320px] text-center text-xs text-[#888] leading-relaxed">
        {CAPTIONS[value]}
      </p>
      {customComingSoon && (
        <p className="text-[10px] text-[#888]">Coming soon for Custom mode</p>
      )}
    </div>
  );
}
