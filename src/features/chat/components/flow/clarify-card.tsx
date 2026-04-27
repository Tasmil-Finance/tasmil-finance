"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClarifyQuestion } from "@/features/chat/types/flow-messages";

const TAG_STYLES: Record<string, [string, string]> = {
  recommended: ["recommended", "text-emerald-400 bg-emerald-400/10"],
  il_risk: ["IL risk", "text-amber-400 bg-amber-400/10"],
  high_tvl: ["high TVL", "text-blue-400 bg-blue-400/10"],
  bridge: ["bridge", "text-purple-400 bg-purple-400/10"],
};

interface ClarifyCardProps {
  questions: ClarifyQuestion[];
  onSubmit: (answers: Record<string, unknown>) => void;
  disabled?: boolean;
}

// ─── Option row (shared between single & multi mode) ─────────

function OptionRow({
  suggestion,
  index,
  isSelected,
  disabled,
  onClick,
}: {
  suggestion: { label: string; value: Record<string, unknown>; tags?: string[]; description?: string };
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
        "flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left transition-colors",
        isSelected ? "bg-primary/5" : "hover:bg-muted/30",
        disabled && "pointer-events-none opacity-50",
        !disabled && "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-medium",
          isSelected ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground",
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
                className={cn("rounded-md px-1.5 py-px text-[10px] font-medium", cls)}
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

// ─── Single-question mode ────────────────────────────────────

function SingleClarifyCard({
  question,
  onSubmit,
  disabled,
}: {
  question: ClarifyQuestion;
  onSubmit: (answers: Record<string, unknown>) => void;
  disabled: boolean;
}) {
  const [selected, setSelected] = useState<Record<string, unknown> | undefined>(undefined);
  const [sent, setSent] = useState(false);

  const handleSelect = (value: Record<string, unknown>) => {
    if (sent || disabled) return;
    setSelected(value);
    setSent(true);
    onSubmit({ [question.field_name]: value });
  };

  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-border bg-card">
      <div className="px-4 pt-3.5 pb-2.5">
        <p className="text-[14px] font-semibold text-foreground leading-snug">
          {question.question}
        </p>
      </div>

      {question.input_type === "select" && question.suggestions ? (
        <div className="flex flex-col">
          {question.suggestions.map((s, i) => (
            <OptionRow
              key={i}
              suggestion={s}
              index={i}
              isSelected={
                selected !== undefined &&
                JSON.stringify(s.value) === JSON.stringify(selected)
              }
              disabled={disabled || sent}
              onClick={() => handleSelect(s.value)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Multi-question stepper mode ─────────────────────────────

function MultiClarifyCardStepper({
  questions,
  onSubmit,
  disabled,
}: {
  questions: ClarifyQuestion[];
  onSubmit: (answers: Record<string, unknown>) => void;
  disabled: boolean;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
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
  }, [step]);

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

  if (!current) return null;

  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-xl border border-border bg-card">
      {/* Question */}
      <div className="px-4 pt-3.5 pb-2.5">
        <p className="text-[14px] font-semibold text-foreground leading-snug">
          {current.question}
        </p>
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
                  onClick={() => handleSelect(current.field_name, s.value)}
                />
              ))}
            </div>
          ) : current.input_type === "text" ? (
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center rounded-lg border border-border bg-background px-3 py-2">
                <input
                  type="text"
                  placeholder={current.placeholder || "Type your answer..."}
                  value={(currentAnswer as string) ?? ""}
                  onChange={(e) => setAnswer(current.field_name, e.target.value)}
                  disabled={disabled}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentAnswered) goNext();
                  }}
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground/40"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={step === 0 || disabled}
            onClick={goPrev}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              step === 0 || disabled
                ? "cursor-default opacity-30 text-muted-foreground"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer",
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
                ? "cursor-default opacity-30 text-muted-foreground"
                : "hover:bg-muted/40 text-muted-foreground hover:text-foreground cursor-pointer",
            )}
            aria-label="Next question"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLast && currentAnswered && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSubmit(answers)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              disabled
                ? "bg-muted/30 text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer",
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

export function ClarifyCard({ questions, onSubmit, disabled = false }: ClarifyCardProps) {
  if (questions.length === 1 && questions[0]) {
    return <SingleClarifyCard question={questions[0]} onSubmit={onSubmit} disabled={disabled} />;
  }
  return <MultiClarifyCardStepper questions={questions} onSubmit={onSubmit} disabled={disabled} />;
}
