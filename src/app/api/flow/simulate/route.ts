import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEnv } from "@/lib/env";

const MCP_URL = requireEnv("NEXT_PUBLIC_MCP_STELLAR_URL", "http://localhost:3009");

// ─── Request schema ──────────────────────────────────────────────

const StepSchema = z.object({
  typed_intent: z.string().min(1, "typed_intent is required"),
  protocol: z.string().min(1, "protocol is required"),
  action: z.string().min(1, "action is required"),
  asset: z.string().min(1, "asset is required"),
  amount: z.string().min(1, "amount is required"),
  pool_address: z.string().min(1, "pool_address is required"),
  from: z.string().min(1, "from is required"),
});

const RequestSchema = z.object({
  steps: z.array(StepSchema).min(1, "At least one step is required"),
});

type Step = z.infer<typeof StepSchema>;

// ─── MCP execute response type ───────────────────────────────────

interface McpExecuteResponse {
  success: boolean;
  xdr?: string;
  estimatedFee?: string;
  context?: Record<string, unknown>;
  error?: string;
}

// ─── Step simulation result ──────────────────────────────────────

interface StepResult {
  step_index: number;
  status: "success" | "fail";
  gas_consumed: number;
  actual_return?: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────

async function simulateStep(
  step: Step,
  index: number
): Promise<{ result: StepResult; xdr?: string; feeXlm: number; ledger: number }> {
  const res = await fetch(`${MCP_URL}/api/aggregator/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      protocol: step.protocol,
      action: step.action,
      params: {
        pool: step.pool_address,
        asset: step.asset,
        amount: step.amount,
        from: step.from,
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    const errorMsg = errBody.error ?? `MCP returned ${res.status}`;
    return {
      result: { step_index: index, status: "fail", gas_consumed: 0, error: errorMsg },
      feeXlm: 0,
      ledger: 0,
    };
  }

  const data: McpExecuteResponse = await res.json();

  if (!data.success || !data.xdr) {
    const errorMsg = data.error ?? "No XDR returned from simulation";
    return {
      result: { step_index: index, status: "fail", gas_consumed: 0, error: errorMsg },
      feeXlm: 0,
      ledger: 0,
    };
  }

  const feeStroops = Number(data.estimatedFee ?? "0");
  const ledger = data.context?.ledger ? Number(data.context.ledger) : 0;

  return {
    result: {
      step_index: index,
      status: "success",
      gas_consumed: feeStroops,
      actual_return: data.context?.returnValue as string | undefined,
    },
    xdr: data.xdr,
    feeXlm: feeStroops / 1e7,
    ledger,
  };
}

function deriveOverallStatus(
  failCount: number,
  totalCount: number
): "success" | "partial_fail" | "fail" {
  if (failCount === 0) return "success";
  if (failCount === totalCount) return "fail";
  return "partial_fail";
}

/**
 * POST /api/flow/simulate
 *
 * Simulates a multi-step plan by calling the MCP Stellar aggregator execute
 * endpoint for each step. Steps are executed sequentially so that each
 * simulation reflects the state after previous steps.
 *
 * Returns an aggregated simulation report with unsigned XDRs for signing.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return NextResponse.json(
      { success: false, error: `Validation failed: ${messages.join("; ")}` },
      { status: 400 }
    );
  }

  const { steps } = parsed.data;
  const stepResults: StepResult[] = [];
  const xdrs: string[] = [];
  const warnings: string[] = [];
  let totalGasXlm = 0;
  let latestLedger = 0;

  for (let i = 0; i < steps.length; i++) {
    try {
      const { result, xdr, feeXlm, ledger } = await simulateStep(steps[i]!, i);

      stepResults.push(result);
      totalGasXlm += feeXlm;
      latestLedger = Math.max(latestLedger, ledger);

      if (result.status === "success" && xdr) {
        xdrs.push(xdr);
      }
      if (result.status === "fail" && result.error) {
        warnings.push(`Step ${i} (${steps[i]?.typed_intent}): ${result.error}`);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Network error calling MCP";
      stepResults.push({ step_index: i, status: "fail", gas_consumed: 0, error: errorMsg });
      warnings.push(`Step ${i} (${steps[i]?.typed_intent}): ${errorMsg}`);
    }
  }

  const failCount = stepResults.filter((s) => s.status === "fail").length;

  return NextResponse.json({
    success: true,
    simulation: {
      status: deriveOverallStatus(failCount, steps.length),
      steps: stepResults,
      total_gas_xlm: Math.round(totalGasXlm * 1e7) / 1e7,
      xdrs,
      warnings,
      simulated_at_ledger: latestLedger,
    },
  });
}
