import { cn } from "@/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

export interface KpiCell {
  label: string;
  value: string | undefined;
  sub: string | undefined;
  loading?: boolean;
}

export interface KpiGridProps {
  cells: KpiCell[];
  className?: string;
}

export function KpiGrid({ cells, className }: KpiGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4",
        className,
      )}
    >
      {cells.map((cell, i) => (
        <div key={i} className="flex flex-col gap-1.5 bg-card p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {cell.label}
          </span>
          {cell.loading ? (
            <>
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-20" />
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {cell.value ?? "—"}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {cell.sub ?? "—"}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
