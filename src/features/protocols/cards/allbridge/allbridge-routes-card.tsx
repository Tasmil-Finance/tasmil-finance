"use client";

import { ArrowRight, Route } from "lucide-react";
import type { AllbridgeRoute } from "../../schemas/allbridge.schema";
import type { CardMode } from "../../schemas/common.schema";
import { ProtocolCard } from "../base/protocol-card";

interface Props {
  routes: AllbridgeRoute[];
  mode?: CardMode;
}

export function AllbridgeRoutesCard({ routes, mode = "playground" }: Props) {
  const isChat = mode === "chat";

  if (!routes.length) {
    return (
      <ProtocolCard
        mode={mode}
        title="Bridge Routes"
        icon={Route}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
      >
        <p className="text-muted-foreground text-xs">No bridge routes found.</p>
      </ProtocolCard>
    );
  }

  if (isChat) {
    return (
      <ProtocolCard
        mode="chat"
        title="Bridge Routes"
        icon={Route}
        iconColor="text-blue-500"
        iconBg="bg-blue-500/10"
        subtitle={`${routes.length} routes`}
      >
        <div className="max-h-[300px] space-y-2 overflow-auto">
          {routes.map((r, i) => (
            <div key={i} className="space-y-0.5 rounded-lg border border-border/50 p-2">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="font-medium capitalize">{r.fromChain}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                <span className="font-medium capitalize">{r.toChain}</span>
                <span className="ml-auto text-muted-foreground text-xs">{r.asset}</span>
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Fee: {r.estimatedFee ?? "~0.3%"}</span>
                <span>Time: {r.estimatedTime ?? "3-5 min"}</span>
              </div>
            </div>
          ))}
        </div>
      </ProtocolCard>
    );
  }

  return (
    <ProtocolCard mode="playground">
      <div className="flex items-center justify-between border-border border-b px-4 py-3">
        <p className="font-medium text-foreground text-sm">Bridge Routes</p>
        <span className="text-[10px] text-muted-foreground">{routes.length} routes</span>
      </div>
      <div className="max-h-[400px] space-y-2 overflow-auto p-4">
        {routes.map((r, i) => (
          <div key={i} className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-foreground text-sm capitalize">
                {r.fromChain}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium text-foreground text-sm capitalize">
                {r.toChain}
              </span>
              <span className="ml-auto font-semibold text-foreground text-xs">{r.asset}</span>
            </div>
            <div className="flex gap-4 text-[11px] text-muted-foreground">
              <span>
                Provider: <span className="text-foreground capitalize">{r.provider}</span>
              </span>
              <span>
                Fee: <span className="text-foreground">{r.estimatedFee ?? "~0.3%"}</span>
              </span>
              <span>
                Time: <span className="text-foreground">{r.estimatedTime ?? "3-5 min"}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </ProtocolCard>
  );
}
