"use client";

import { ArrowLeftRight, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AgentHistoryEvent {
  id: string;
  title: string;
  detail: string;
  occurredAt: string;
}

interface Props {
  events: AgentHistoryEvent[];
  pageSize?: number;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return { date, time };
};

export function AgentHistoryCard({ events, pageSize = 6 }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const slice = events.slice(start, start + pageSize);
  const isFirst = safePage === 0;
  const isLast = safePage >= totalPages - 1;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">Agent Execution History</h3>
        {events.length > pageSize && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {safePage + 1} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="First page"
              disabled={isFirst}
              onClick={() => setPage(0)}
              className="rounded p-1 transition-colors disabled:opacity-40 enabled:hover:bg-accent enabled:hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <ChevronLeft className="-ml-2.5 h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Previous page"
              disabled={isFirst}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded p-1 transition-colors disabled:opacity-40 enabled:hover:bg-accent enabled:hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next page"
              disabled={isLast}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded p-1 transition-colors disabled:opacity-40 enabled:hover:bg-accent enabled:hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Last page"
              disabled={isLast}
              onClick={() => setPage(totalPages - 1)}
              className="rounded p-1 transition-colors disabled:opacity-40 enabled:hover:bg-accent enabled:hover:text-foreground"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className={cn("mt-4 flex flex-col divide-y divide-border")}>
        {events.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">No agent activity yet.</p>
        ) : (
          slice.map((e) => {
            const { date, time } = fmtDate(e.occurredAt);
            return (
              <div key={e.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{e.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.detail}</p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  <p className="text-foreground">{date}</p>
                  <p className="text-muted-foreground">Executed at {time}h</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
