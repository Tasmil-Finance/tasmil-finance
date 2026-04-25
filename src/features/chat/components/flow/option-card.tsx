"use client";

import type { Suggestion } from "@/features/chat/types/flow-messages";

const TAG_STYLES: Record<string, string> = {
  recommended: "bg-[#00C278]/12 text-[#00C278]",
  il_risk: "bg-amber-500/12 text-amber-400",
  high_tvl: "bg-blue-500/12 text-blue-400",
  bridge: "bg-purple-500/12 text-purple-400",
};

const DEFAULT_TAG_STYLE = "bg-white/8 text-[#9aada4]";

interface OptionCardProps {
  question: string;
  suggestions: Suggestion[];
  onSelect: (value: Record<string, unknown>) => void;
  disabled?: boolean;
  selectedValue?: Record<string, unknown>;
}

function isSelected(
  suggestionValue: Record<string, unknown>,
  selectedValue: Record<string, unknown> | undefined
): boolean {
  if (!selectedValue) return false;
  return JSON.stringify(suggestionValue) === JSON.stringify(selectedValue);
}

export function OptionCard({
  question,
  suggestions,
  onSelect,
  disabled = false,
  selectedValue,
}: OptionCardProps) {
  return (
    <div className="max-w-[360px] rounded-xl border border-white/[0.07] bg-[#131715] p-3">
      <p className="mb-2 text-sm text-[#9aada4]">{question}</p>

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {suggestions.map((suggestion, index) => {
            const selected = isSelected(suggestion.value, selectedValue);
            const dimmed = disabled && !selected && selectedValue !== undefined;

            return (
              <button
                key={index}
                type="button"
                aria-label={`Select ${suggestion.label}`}
                disabled={disabled}
                onClick={() => onSelect(suggestion.value)}
                className={[
                  "flex w-full items-start gap-2.5 rounded-lg border bg-[#181c1a] px-3 py-2.5 text-left transition-colors",
                  selected
                    ? "border-[#00C278]"
                    : "border-white/[0.07] hover:border-[#00C278]/35",
                  dimmed ? "opacity-50" : "",
                  disabled ? "pointer-events-none" : "cursor-pointer",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="mt-0.5 shrink-0 font-mono text-xs text-[#5e736a]">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm text-[#f0f2f1]">
                      {suggestion.label}
                    </span>

                    {suggestion.tags?.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded-full px-2 py-0.5 text-[10px] ${TAG_STYLES[tag] ?? DEFAULT_TAG_STYLE}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {suggestion.description && (
                    <p className="mt-0.5 text-xs text-[#5e736a]">
                      {suggestion.description}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
