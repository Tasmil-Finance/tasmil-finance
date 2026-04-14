"use client";

import { useLangGraphInterrupt } from "@copilotkit/react-core";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import { GenericInterruptView } from "@/features/chat/components/messages/generic-interrupt";

/**
 * Handles Human-in-the-Loop (HITL) interrupts from LangGraph agents via CopilotKit.
 *
 * When an agent calls a HITL-enabled tool (e.g., swap_build_transaction),
 * LangGraph interrupts execution. The interrupt propagates through AG-UI
 * as an OnInterrupt event. This hook renders the appropriate approval UI
 * and sends the user's decision back to resume the graph.
 *
 * Must be rendered inside a <CopilotKit> provider.
 */
export function HitlHandler() {
  useLangGraphInterrupt({
    render: ({ event, resolve }) => {
      const interruptValue = event?.value ?? event;

      // Extract tool info from interrupt
      const toolName =
        (interruptValue as Record<string, unknown>)?.tool_name ??
        (interruptValue as Record<string, unknown>)?.toolName ??
        "";
      const args = (interruptValue as Record<string, unknown>)?.args ?? {};
      const result = interruptValue;
      const operation =
        (interruptValue as Record<string, unknown>)?.operation ?? toolName;

      // For recognized operation tools, show StellarExecuteCard with resolve
      if (toolName) {
        return (
          <StellarExecuteCard
            operation={operation as string}
            args={args as Record<string, unknown>}
            result={result}
            status="executing"
            respond={(decision: Record<string, unknown>) => {
              resolve(JSON.stringify(decision));
            }}
          />
        );
      }

      // Fallback for unrecognized interrupts
      const fallbackValue = Array.isArray(interruptValue)
        ? interruptValue
        : [interruptValue];
      return <GenericInterruptView interrupt={fallbackValue} />;
    },
  });

  return null;
}
