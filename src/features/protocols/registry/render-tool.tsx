"use client";

/**
 * Unified tool result renderer using card-registry.ts as the single source of truth.
 *
 * This replaces the 8 duplicate registries in use-defi-tool-renderers.tsx with a single
 * lookup against card-registry entries. Each entry already has fromMcp normalizer +
 * lazy component getter, so we just need to wire them together.
 *
 * Returns a render function compatible with tool-call-renderer.tsx's CardRendererResult type,
 * or null if the tool has no matching registry entry.
 */

import React from "react";
import type { InfoCardEntry, OperationCardEntry } from "./card-registry";
import {
  BLEND_INFO_CARDS,
  BLEND_OPERATION_CARDS,
  AQUARIUS_INFO_CARDS,
  AQUARIUS_OPERATION_CARDS,
  SOROSWAP_INFO_CARDS,
  SOROSWAP_OPERATION_CARDS,
  ALLBRIDGE_INFO_CARDS,
  ALLBRIDGE_OPERATION_CARDS,
} from "./card-registry";

// ─── Combined lookups ────────────────────────────────────────

const ALL_INFO: InfoCardEntry[] = [
  ...BLEND_INFO_CARDS,
  ...AQUARIUS_INFO_CARDS,
  ...SOROSWAP_INFO_CARDS,
  ...ALLBRIDGE_INFO_CARDS,
];

const ALL_OPERATIONS: OperationCardEntry[] = [
  ...BLEND_OPERATION_CARDS,
  ...AQUARIUS_OPERATION_CARDS,
  ...SOROSWAP_OPERATION_CARDS,
  ...ALLBRIDGE_OPERATION_CARDS,
];

// ─── Shared render props type (same as tool-call-renderer.tsx) ─

type SharedRenderProps = {
  status: "inProgress" | "executing" | "complete";
  args: Record<string, unknown>;
  result: unknown;
  toolCallId?: string;
  respond?: (result: Record<string, unknown>) => void;
};

type RegistryRenderResult =
  | { kind: "shared"; render: (props: SharedRenderProps) => React.ReactElement }
  | { kind: "shared-op"; render: (props: SharedRenderProps) => React.ReactElement }
  | null;

/**
 * Find a card renderer for the given tool name using card-registry entries.
 *
 * For `resolve_pool`, routes by `args.protocol` to the correct protocol's pools card.
 * Falls through to null if not found — caller should try legacy registries.
 */
export function findRegistryRenderer(
  toolName: string,
  args?: Record<string, unknown>,
): RegistryRenderResult {
  // ─── resolve_pool: special routing by protocol ─────────────
  if (toolName === "resolve_pool") {
    return resolvePoolRenderer(args);
  }

  // ─── Info cards ────────────────────────────────────────────
  const info = ALL_INFO.find((e) => e.toolName === toolName);
  if (info) {
    return {
      kind: "shared",
      render: (props) => {
        const data = info.fromMcp(props.result);
        if (!data) return <></>;

        const Component = info.component;
        return <Component {...{ [info.cardPropName]: data, mode: "chat" }} />;
      },
    };
  }

  // ─── Operation cards ───────────────────────────────────────
  const op = ALL_OPERATIONS.find((e) => e.toolName === toolName);
  if (op) {
    return {
      kind: "shared-op",
      render: (props) => {
        const data = op.fromMcp(props.result, props.args);
        if (!data) return <></>;

        const Component = op.component;
        return (
          <Component
            {...{ tx: data, mode: "chat" }}
            respond={props.respond}
            toolCallId={props.toolCallId}
          />
        );
      },
    };
  }

  return null;
}

// ─── resolve_pool routing ─────────────────────────────────────

function resolvePoolRenderer(args?: Record<string, unknown>): RegistryRenderResult {
  const protocol = (args?.protocol as string)?.toLowerCase();

  // Find the resolve_pool entry (in BLEND_INFO_CARDS by default)
  const blendEntry = BLEND_INFO_CARDS.find((e) => e.toolName === "resolve_pool");

  // Route by protocol
  if (protocol === "aquarius") {
    const entry = AQUARIUS_INFO_CARDS.find((e) => e.toolName === "aquarius_list_pools");
    if (entry) {
      return {
        kind: "shared",
        render: (props) => {
          const pools = entry.fromMcp(props.result);
          if (!pools || (Array.isArray(pools) && pools.length === 0)) return <></>;

          const Component = entry.component;
          return <Component pools={pools} mode="chat" />;
        },
      };
    }
  }

  if (protocol === "soroswap") {
    const entry = SOROSWAP_INFO_CARDS.find((e) => e.toolName === "swap_get_pools");
    if (entry) {
      return {
        kind: "shared",
        render: (props) => {
          const pools = entry.fromMcp(props.result);
          if (!pools || (Array.isArray(pools) && pools.length === 0)) return <></>;

          const Component = entry.component;
          return <Component pools={pools} mode="chat" />;
        },
      };
    }
  }

  // Default: Blend pools
  if (blendEntry) {
    return {
      kind: "shared",
      render: (props) => {
        const pools = blendEntry.fromMcp(props.result);
        if (!pools || (Array.isArray(pools) && pools.length === 0)) return <></>;

        const Component = blendEntry.component;
        return <Component pools={pools} mode="chat" />;
      },
    };
  }

  return null;
}
