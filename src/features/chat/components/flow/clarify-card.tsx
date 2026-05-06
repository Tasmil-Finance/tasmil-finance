"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ClarifyQuestion } from "@/features/chat/types/flow-messages";
import { cn } from "@/lib/utils";

const TAG_STYLES: Record<string, [string, string]> = {
  recommended: ["recommended", "text-emerald-400 bg-emerald-400/10"],
  il_risk: ["IL risk", "text-amber-400 bg-amber-400/10"],
  high_tvl: ["high TVL", "text-blue-400 bg-blue-400/10"],
  bridge: ["bridge", "text-purple-400 bg-purple-400/10"],
  managed: ["managed", "text-violet-400 bg-violet-400/10"],
  tasmil: ["Tasmil", "text-violet-400 bg-violet-400/10"],
};

interface ClarifyCardProps {
  questions: ClarifyQuestion[];
  onSubmit: (answers: Record<string, unknown>) => void;
  disabled?: boolean;
  initialAnswers?: Record<string, unknown>;
}

// ─── Option row (shared between single & multi mode) ─────────

function OptionRow({
  suggestion,
  index,
  isSelected,
  disabled,
  onClick,
}: {
  suggestion: {
    label: string;
    value: Record<string, unknown>;
    tags?: string[];
    description?: string;
  };
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Select ${suggestion.label}`}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-border border-t px-4 py-2.5 text-left transition-colors",
        isSelected ? "bg-primary/5" : "hover:bg-muted/30",
        disabled && "pointer-events-none opacity-50",
        !disabled && "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-medium font-mono text-[11px]",
          isSelected ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"
        )}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] text-foreground">{suggestion.label}</span>
          {suggestion.tags?.map((tag) => {
            const [label, cls] = TAG_STYLES[tag] ?? [tag, "text-muted-foreground bg-muted"];
            return (
              <span
                key={tag}
                className={cn("rounded-md px-1.5 py-px font-medium text-[10px]", cls)}
              >
                {label}
              </span>
            );
          })}
        </div>
        {suggestion.description && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{suggestion.description}</p>
        )}
      </div>

      {isSelected && <ChevronRight className="h-4 w-4 shrink-0 text-primary" />}
    </button>
  );
}

// ─── Multi-question stepper mode ─────────────────────────────

function MultiClarifyCardStepper({
  questions,
  onSubmit,
  disabled,
  initialAnswers,
}: {
  questions: ClarifyQuestion[];
  onSubmit: (answers: Record<string, unknown>) => void;
  disabled: boolean;
  initialAnswers?: Record<string, unknown>;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers ?? {});
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  const total = questions.length;
  const current = questions[step] as ClarifyQuestion | undefined;
  const currentAnswer = current ? answers[current.field_name] : undefined;

  const hasAnswer = (fieldName: string) => {
    const val = answers[fieldName];
    if (val === undefined || val === null) return false;
    if (typeof val === "string" && val.trim() === "") return false;
    return true;
  };

  const currentAnswered = current ? hasAnswer(current.field_name) : false;
  const isLast = step === total - 1;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  const setAnswer = useCallback((fieldName: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const goNext = () => {
    if (isLast && currentAnswered && !disabled) {
      onSubmit(answers);
    } else if (currentAnswered && step < total - 1) {
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSelect = (fieldName: string, value: Record<string, unknown>) => {
    setAnswer(fieldName, value);
    if (!isLast) {
      setTimeout(() => setStep((s) => Math.min(s + 1, total - 1)), 200);
    }
  };

  const isSingle = total === 1;

  if (!current) return null;

  return (
    <div
      data-testid="card-clarify"
      className="w-full max-w-[460px] overflow-hidden rounded-xl border border-border bg-card"
    >
      {/* Question */}
      <div className="px-4 pt-3.5 pb-2.5">
        <p className="font-semibold text-[14px] text-foreground leading-snug">{current.question}</p>
      </div>

      {/* Animated content area */}
      <div
        style={{ height: contentHeight !== undefined ? contentHeight : "auto" }}
        className="overflow-hidden transition-[height] duration-250 ease-in-out"
      >
        <div ref={contentRef}>
          {current.input_type === "select" && current.suggestions ? (
            <div className="flex flex-col">
              {current.suggestions.map((s, i) => (
                <OptionRow
                  key={i}
                  suggestion={s}
                  index={i}
                  isSelected={
                    currentAnswer !== undefined &&
                    JSON.stringify(s.value) === JSON.stringify(currentAnswer)
                  }
                  disabled={disabled}
                  onClick={() =>
                    isSingle
                      ? setAnswer(current.field_name, s.value)
                      : handleSelect(current.field_name, s.value)
                  }
                />
              ))}
            </div>
          ) : current.input_type === "text" ? (
            <div className="border-border border-t px-4 py-3">
              <div className="flex items-center rounded-lg border border-border bg-background px-3 py-2">
                <input
                  type="text"
                  placeholder={current.placeholder || "Type your answer..."}
                  value={(currentAnswer as string) ?? ""}
                  onChange={(e) => setAnswer(current.field_name, e.target.value)}
                  disabled={disabled}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentAnswered) {
                      if (isSingle) {
                        onSubmit(answers);
                      } else {
                        goNext();
                      }
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-border border-t px-4 py-2.5">
        {isSingle ? (
          <div />
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={step === 0 || disabled}
              onClick={goPrev}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                step === 0 || disabled
                  ? "cursor-default text-muted-foreground opacity-30"
                  : "cursor-pointer text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              aria-label="Previous question"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-[12px] text-muted-foreground/60 tabular-nums">
              {step + 1} / {total}
            </span>
            <button
              type="button"
              disabled={!currentAnswered || isLast || disabled}
              onClick={goNext}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
                !currentAnswered || isLast || disabled
                  ? "cursor-default text-muted-foreground opacity-30"
                  : "cursor-pointer text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              )}
              aria-label="Next question"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {isLast && currentAnswered && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit(answers)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-[12px] transition-colors",
              disabled
                ? "cursor-not-allowed bg-muted/30 text-muted-foreground"
                : "cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Unified ClarifyCard ─────────────────────────────────────

export function ClarifyCard({
  questions,
  onSubmit,
  disabled = false,
  initialAnswers,
}: ClarifyCardProps) {
  return (
    <MultiClarifyCardStepper
      questions={questions}
      onSubmit={onSubmit}
      disabled={disabled}
      initialAnswers={initialAnswers}
    />
  );
}
