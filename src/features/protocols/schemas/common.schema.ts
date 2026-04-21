import { z } from "zod";

// ─── Shared primitives ──────────────────────────────────────────

export const addressSchema = z.string().min(1);

export const apySchema = z.number().nullable().optional();

export const statusSchema = z.enum([
  "active",
  "setup",
  "on_ice",
  "frozen",
  "admin_frozen",
  "unknown",
]);
export type PoolStatus = z.infer<typeof statusSchema>;

export const positionTypeSchema = z.enum(["supply", "collateral", "borrow"]);
export type PositionType = z.infer<typeof positionTypeSchema>;

/** Card display mode: playground (full-width, interactive) or chat (compact, inline). */
export type CardMode = "playground" | "chat";
