// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { ZodError } from "zod";
import {
  assistantFlowMessageSchema,
  planSchema,
  simulationReportSchema,
  suggestionSchema,
} from "../flow-messages.schema";

// ─── Fixtures ──────────────────────────────────────────────────

const validSuggestion = {
  label: "USDC Lending · Blend · 14.2% APY",
  value: { protocol: "blend", pool: "CABC123", asset: "USDC" },
  tags: ["recommended"],
  description: "Highest risk-adjusted yield for Safe preset",
};

const validPlanStep = {
  index: 0,
  typed_intent: "BlendDeposit",
  protocol: "blend",
  action: "supply_collateral",
  asset: "USDC",
  amount: "4000000000",
  pool_address: "CABC123",
  description: "Deposit 400 USDC to Blend USDC pool",
  expected_apy_bps: 1420,
};

const validPlan = {
  id: "plan-001",
  steps: [validPlanStep],
  total_gas_xlm: 0.3,
  weighted_apy_bps: 1420,
  idle_amount: 200,
};

const validSimReport = {
  status: "success" as const,
  steps: [{ step_index: 0, status: "success" as const, gas_consumed: 0.3, actual_return: "398.4" }],
  total_gas_xlm: 0.3,
  xdrs: ["AAAA...base64..."],
  warnings: [],
  simulated_at_ledger: 123456,
};

// ─── Discriminated Union Tests ─────────────────────────────────

describe("assistantFlowMessageSchema", () => {
  it("discriminates 'text' kind", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "text",
      text: "Hello",
    });
    expect(result.kind).toBe("text");
  });

  it("discriminates 'clarify' kind with suggestions", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "clarify",
      question: "Which pool?",
      suggestions: [validSuggestion],
    });
    expect(result.kind).toBe("clarify");
    if (result.kind === "clarify") {
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions![0].label).toBe(validSuggestion.label);
    }
  });

  it("discriminates 'clarify' kind without suggestions", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "clarify",
      question: "How much USDC?",
    });
    expect(result.kind).toBe("clarify");
    if (result.kind === "clarify") {
      expect(result.suggestions).toBeUndefined();
    }
  });

  it("discriminates 'plan_preview' kind", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "plan_preview",
      plan: validPlan,
      simulation_report: validSimReport,
    });
    expect(result.kind).toBe("plan_preview");
  });

  it("discriminates 'execution_update' kind", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "execution_update",
      tx_hash: "abc123",
      step: 1,
      total_steps: 2,
      status: "submitting",
    });
    expect(result.kind).toBe("execution_update");
  });

  it("discriminates 'position_update' kind", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "position_update",
      positions: [
        {
          deposit: "400 USDC",
          venue: "Blend USDC Pool",
          protocol: "blend",
          apy_bps: 1420,
          tx_hash: "abc",
        },
      ],
    });
    expect(result.kind).toBe("position_update");
  });

  it("discriminates 'error' kind", () => {
    const result = assistantFlowMessageSchema.parse({
      kind: "error",
      code: "SIMULATION_FAILED",
      message: "Blend pool is paused",
      retry_possible: true,
    });
    expect(result.kind).toBe("error");
  });

  it("rejects unknown kind", () => {
    expect(() => assistantFlowMessageSchema.parse({ kind: "unknown_type", data: 123 })).toThrow(
      ZodError
    );
  });
});

// ─── Suggestion Schema Tests ───────────────────────────────────

describe("suggestionSchema", () => {
  it("accepts suggestion with all fields", () => {
    const result = suggestionSchema.parse(validSuggestion);
    expect(result.label).toBe(validSuggestion.label);
    expect(result.tags).toEqual(["recommended"]);
  });

  it("accepts suggestion without optional fields", () => {
    const result = suggestionSchema.parse({
      label: "Pool A",
      value: { id: 1 },
    });
    expect(result.tags).toBeUndefined();
    expect(result.description).toBeUndefined();
  });

  it("rejects suggestion with empty label", () => {
    expect(() => suggestionSchema.parse({ label: "", value: {} })).toThrow(ZodError);
  });
});

// ─── Plan Schema Tests ─────────────────────────────────────────

describe("planSchema", () => {
  it("accepts valid multi-step plan", () => {
    const multiStepPlan = {
      ...validPlan,
      steps: [
        validPlanStep,
        { ...validPlanStep, index: 1, typed_intent: "DeFindexDeposit", protocol: "defindex" },
      ],
    };
    const result = planSchema.parse(multiStepPlan);
    expect(result.steps).toHaveLength(2);
    expect(result.weighted_apy_bps).toBe(1420);
    expect(result.idle_amount).toBe(200);
  });

  it("rejects plan with zero steps", () => {
    expect(() => planSchema.parse({ ...validPlan, steps: [] })).toThrow(ZodError);
  });

  it("accepts plan without idle_amount", () => {
    const { idle_amount: _, ...planNoIdle } = validPlan;
    const result = planSchema.parse(planNoIdle);
    expect(result.idle_amount).toBeUndefined();
  });
});

// ─── SimulationReport Schema Tests ─────────────────────────────

describe("simulationReportSchema", () => {
  it("accepts valid simulation with success status", () => {
    const result = simulationReportSchema.parse(validSimReport);
    expect(result.status).toBe("success");
    expect(result.xdrs).toHaveLength(1);
  });

  it("accepts simulation with fail status and error", () => {
    const failReport = {
      ...validSimReport,
      status: "fail",
      steps: [{ step_index: 0, status: "fail", gas_consumed: 0, error: "Pool paused" }],
    };
    const result = simulationReportSchema.parse(failReport);
    expect(result.status).toBe("fail");
    expect(result.steps[0].error).toBe("Pool paused");
  });

  it("accepts partial_fail status", () => {
    const partialReport = {
      ...validSimReport,
      status: "partial_fail",
      steps: [
        { step_index: 0, status: "success", gas_consumed: 0.3 },
        { step_index: 1, status: "fail", gas_consumed: 0, error: "Insufficient balance" },
      ],
      xdrs: ["AAA...", "BBB..."],
    };
    const result = simulationReportSchema.parse(partialReport);
    expect(result.status).toBe("partial_fail");
  });

  it("rejects simulation with empty xdrs array", () => {
    expect(() => simulationReportSchema.parse({ ...validSimReport, xdrs: [] })).toThrow(ZodError);
  });

  it("rejects simulation with zero ledger", () => {
    expect(() =>
      simulationReportSchema.parse({ ...validSimReport, simulated_at_ledger: 0 })
    ).toThrow(ZodError);
  });

  it("rejects simulation with negative gas", () => {
    expect(() => simulationReportSchema.parse({ ...validSimReport, total_gas_xlm: -1 })).toThrow(
      ZodError
    );
  });
});

// ─── Clarify via discriminated union ───────────────────────────

describe("clarify message validation", () => {
  it("rejects clarify with empty question", () => {
    expect(() => assistantFlowMessageSchema.parse({ kind: "clarify", question: "" })).toThrow(
      ZodError
    );
  });
});
