import { z } from "zod";

// ─── Suggestion ────────────────────────────────────────────────

export const suggestionSchema = z.object({
  label: z.string().min(1),
  value: z.record(z.unknown()),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});

// ─── PlanStep ──────────────────────────────────────────────────

export const planStepSchema = z.object({
  index: z.number().int().nonnegative(),
  typed_intent: z.string().min(1),
  protocol: z.string().min(1),
  action: z.string().min(1),
  asset: z.string().min(1),
  amount: z.string().min(1),
  pool_address: z.string().min(1),
  description: z.string(),
  expected_apy_bps: z.number().int().optional(),
});

// ─── Plan ──────────────────────────────────────────────────────

export const planSchema = z.object({
  id: z.string().min(1),
  steps: z.array(planStepSchema).min(1),
  total_gas_xlm: z.number().nonnegative(),
  weighted_apy_bps: z.number().int(),
  idle_amount: z.number().nonnegative().optional(),
});

// ─── StepSimulation ────────────────────────────────────────────

export const stepSimulationSchema = z.object({
  step_index: z.number().int().nonnegative(),
  status: z.enum(["success", "fail"]),
  gas_consumed: z.number().nonnegative(),
  actual_return: z.string().optional(),
  error: z.string().optional(),
});

// ─── SimulationReport ──────────────────────────────────────────

export const simulationReportSchema = z.object({
  status: z.enum(["success", "partial_fail", "fail"]),
  steps: z.array(stepSimulationSchema),
  total_gas_xlm: z.number().nonnegative(),
  xdrs: z.array(z.string().min(1)).min(1),
  warnings: z.array(z.string()),
  simulated_at_ledger: z.number().int().positive(),
});

// ─── FlowPosition ──────────────────────────────────────────────

export const flowPositionSchema = z.object({
  deposit: z.string(),
  venue: z.string(),
  protocol: z.string(),
  apy_bps: z.number().int(),
  tx_hash: z.string(),
});

// ─── AssistantFlowMessage (discriminated union) ────────────────

const textMessageSchema = z.object({
  kind: z.literal("text"),
  text: z.string(),
});

const clarifyMessageSchema = z.object({
  kind: z.literal("clarify"),
  question: z.string().min(1),
  suggestions: z.array(suggestionSchema).optional(),
});

const planPreviewMessageSchema = z.object({
  kind: z.literal("plan_preview"),
  plan: planSchema,
  simulation_report: simulationReportSchema,
});

const executionUpdateMessageSchema = z.object({
  kind: z.literal("execution_update"),
  tx_hash: z.string().optional(),
  step: z.number().int().positive(),
  total_steps: z.number().int().positive(),
  status: z.enum(["submitting", "confirmed", "failed"]),
});

const positionUpdateMessageSchema = z.object({
  kind: z.literal("position_update"),
  positions: z.array(flowPositionSchema),
});

const errorMessageSchema = z.object({
  kind: z.literal("error"),
  code: z.string(),
  message: z.string(),
  retry_possible: z.boolean(),
});

export const assistantFlowMessageSchema = z.discriminatedUnion("kind", [
  textMessageSchema,
  clarifyMessageSchema,
  planPreviewMessageSchema,
  executionUpdateMessageSchema,
  positionUpdateMessageSchema,
  errorMessageSchema,
]);
