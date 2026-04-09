"use client";

import { Search } from "lucide-react";
import { memo } from "react";
import { BaseInfoCard } from "../base/info-card";
import { useResultData } from "../../hooks/use-result-data";
import { ScrollableList, ProtocolBadge } from "../base/indicators";

interface ActionInfo {
  id: string;
  tool: string;
  description: string;
  params: string[];
  protocols?: string[];
}

interface ActionSearchData {
  actions: ActionInfo[];
  count: number;
  hint?: string;
}

interface ActionSearchCardProps {
  type?: string;
  toolName?: string;
  args?: Record<string, any>;
  result: any;
  toolCallId?: string;
  status?: string;
}

function ActionSearchCardComponent({ args, result, toolCallId, status }: ActionSearchCardProps) {
  const { data, isLoading, hasError, errorMessage } = useResultData<ActionSearchData>(
    result,
    status
  );

  return (
    <BaseInfoCard
      title="Available Actions"
      subtitle={args?.["intent"] ? `"${args["intent"]}"` : `${data?.count ?? 0} actions found`}
      icon={Search}
      iconColor="text-amber-500"
      iconBg="bg-amber-500/10"
      isLoading={isLoading}
      error={hasError ? errorMessage : null}
    >
      {data?.hint && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mb-2">
          {data.hint}
        </div>
      )}

      {data?.actions && data.actions.length > 0 ? (
        <ScrollableList id={`actions-${toolCallId}`} maxHeight={300}>
          {data.actions.map((action, idx) => (
            <div key={action.id ?? idx} className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{action.id}</span>
                <span className="text-xs bg-muted/50 rounded-full px-1.5 py-0.5 text-muted-foreground">
                  {action.tool}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
              {action.params.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {action.params.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] bg-muted/40 rounded px-1.5 py-0.5 font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              {action.protocols && action.protocols.length > 0 && (
                <div className="flex gap-1">
                  {action.protocols.map((p) => (
                    <ProtocolBadge key={p} name={p} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </ScrollableList>
      ) : (
        <div className="text-sm text-muted-foreground">No matching actions found.</div>
      )}
    </BaseInfoCard>
  );
}

export const ActionSearchCard = memo(ActionSearchCardComponent);
