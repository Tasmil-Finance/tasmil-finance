"use client";

import { Bot, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CATEGORY_LABELS,
  PROTOCOL_CONFIGS,
} from "@/features/dev-playground/config/protocol-configs";
import { cn } from "@/lib/utils";
import { TokenImage } from "@/shared/components/token-image";

// ─── Sidebar ───────────────────────────────────────────────────

function PlaygroundSidebar({ currentPath }: { currentPath: string }) {
  const grouped = new Map<string, typeof PROTOCOL_CONFIGS>();
  for (const p of PROTOCOL_CONFIGS) {
    const existing = grouped.get(p.category);
    if (existing) existing.push(p);
    else grouped.set(p.category, [p]);
  }

  const demoAiActive = currentPath === "/playground/demo-ai";
  const chatCardsActive = currentPath === "/playground/chat-cards";

  return (
    <aside className="w-52 shrink-0 space-y-5 py-6 pl-6">
      {/* Tools */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-2">
          Tools
        </p>
        <div className="space-y-0.5">
          <Link
            href="/playground/demo-ai"
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              demoAiActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <Bot className="h-4 w-4" />
            <span className="truncate">Demo AI</span>
          </Link>
          <Link
            href="/playground/chat-cards"
            className={cn(
              "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              chatCardsActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="truncate">Chat Cards</span>
          </Link>
        </div>
      </div>

      {/* Protocols */}
      {Array.from(grouped.entries()).map(([category, protocols]) => (
        <div key={category}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-2">
            {CATEGORY_LABELS[category] ?? category}
          </p>
          <div className="space-y-0.5">
            {protocols.map((p) => {
              const href = `/playground/${p.id === "blend" ? "blend-v2" : p.id}`;
              const isActive = currentPath === href;

              return (
                <Link
                  key={p.id}
                  href={href}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <TokenImage src={p.icon} alt={p.name} className="h-5 w-5 rounded-sm" />
                  <span className="truncate">{p.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

// ─── Layout ────────────────────────────────────────────────────

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <PlaygroundSidebar currentPath={pathname} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
