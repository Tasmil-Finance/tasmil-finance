import { cn } from "@/lib/utils";

interface Props {
  current: number;
  total: number;
  className?: string;
}

export function StepDots({ current, total, className }: Props) {
  const filled = Math.min(Math.max(current, 0), total);
  return (
    <div className={cn("flex gap-1 justify-center", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: stable position-based dots
          key={i}
          data-testid="step-dot"
          className={cn(
            "h-0.5 w-4 rounded-full transition-colors",
            i < filled ? "bg-primary" : "bg-[#2a2a2a]"
          )}
        />
      ))}
    </div>
  );
}
