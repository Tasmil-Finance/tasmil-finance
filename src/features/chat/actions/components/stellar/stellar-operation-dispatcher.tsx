"use client";

import type { ComponentType } from "react";
import { BlendExecuteCard } from "./blend-execute-card";
import { StellarExecuteCard } from "./execute-card";
import { TxSubmitCard } from "./tx-submit-card";

/**
 * Maps the `operation` prop (from backend config.yaml operation_tools) to the correct component.
 */
const OperationComponentMap: Record<string, ComponentType<any>> = {
  swap_execute: StellarExecuteCard,
  bridge_execute: StellarExecuteCard,
  vault_execute: StellarExecuteCard,
  staking_execute: StellarExecuteCard,
  // Blend operations - use BlendExecuteCard (no HITL, direct stream submission)
  blend_supply: BlendExecuteCard,
  blend_borrow: BlendExecuteCard,
  blend_repay: BlendExecuteCard,
  blend_withdraw: BlendExecuteCard,
  blend_toggle_collateral: BlendExecuteCard,
  blend_claim: BlendExecuteCard,
  backstop_deposit: BlendExecuteCard,
  backstop_queue: BlendExecuteCard,
  backstop_dequeue: BlendExecuteCard,
  backstop_withdraw: BlendExecuteCard,
  tx_submit: TxSubmitCard,
};

interface StellarOperationDispatcherProps {
  operation?: string;
  args?: Record<string, any>;
  result?: unknown;
  toolCallId?: string;
  status?: "pending" | "executing" | "complete" | "error" | "inProgress";
  respond?: (result: Record<string, unknown>) => void;
}

/**
 * Dispatcher component for all `{ui_prefix}-operation` UI messages.
 * Routes to the correct Stellar operation card based on `operation` prop.
 */
export function StellarOperationDispatcher({
  operation,
  ...props
}: StellarOperationDispatcherProps) {
  const Component = OperationComponentMap[operation ?? ""] ?? StellarExecuteCard;
  return <Component operation={operation} {...props} />;
}
