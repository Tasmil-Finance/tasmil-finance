// ─── Flow Message Types ────────────────────────────────────────
// PRD §5.2: Typed server→client messages for the option-select flow.
// The agent generates these dynamically based on missing fields.

// ─── Suggestion (agent-generated tappable option) ──────────────

export interface Suggestion {
  /** Human-readable text shown on the button */
  label: string;
  /** Structured data sent back to the agent when tapped */
  value: Record<string, unknown>;
  /** Visual tags: "recommended", "il_risk", "high_tvl", "bridge" */
  tags?: string[];
  /** Optional sub-text below label */
  description?: string;
}

// ─── Plan + Steps ──────────────────────────────────────────────

export interface PlanStep {
  index: number;
  /** TypedIntent name: "BlendDeposit", "SdexSwap", etc. */
  typed_intent: string;
  protocol: string;
  action: string;
  asset: string;
  /** Amount in smallest units (stroops) */
  amount: string;
  pool_address: string;
  /** Human-readable description */
  description: string;
  /** Expected APY in basis points */
  expected_apy_bps?: number;
}

export interface Plan {
  id: string;
  steps: PlanStep[];
  total_gas_xlm: number;
  /** Weighted APY across all allocations in basis points */
  weighted_apy_bps: number;
  /** Amount not allocated (idle) in display units */
  idle_amount?: number;
}

// ─── Simulation Report ─────────────────────────────────────────

export type SimulationStatus = "success" | "partial_fail" | "fail";

export interface StepSimulation {
  step_index: number;
  status: "success" | "fail";
  gas_consumed: number;
  /** Shares received, output amount, etc. */
  actual_return?: string;
  error?: string;
}

export interface SimulationReport {
  status: SimulationStatus;
  steps: StepSimulation[];
  total_gas_xlm: number;
  /** Unsigned XDRs for each step, ready for signing */
  xdrs: string[];
  warnings: string[];
  simulated_at_ledger: number;
}

// ─── Position ──────────────────────────────────────────────────

export interface FlowPosition {
  deposit: string;
  venue: string;
  protocol: string;
  apy_bps: number;
  tx_hash: string;
}

// ─── AssistantMessage (discriminated union by kind) ─────────────

export type TxStatus = "submitting" | "confirmed" | "failed";

export type AssistantFlowMessage =
  | { kind: "text"; text: string }
  | { kind: "clarify"; question: string; suggestions?: Suggestion[] }
  | {
      kind: "plan_preview";
      plan: Plan;
      simulation_report: SimulationReport;
    }
  | {
      kind: "execution_update";
      tx_hash?: string;
      step: number;
      total_steps: number;
      status: TxStatus;
    }
  | { kind: "position_update"; positions: FlowPosition[] }
  | {
      kind: "error";
      code: string;
      message: string;
      retry_possible: boolean;
    };
