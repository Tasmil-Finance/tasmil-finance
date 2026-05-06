const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const SERVICE_KEY = process.env.AI_INTERNAL_SHARED_TOKEN ?? "test-shared-token";

/**
 * Directly apply a credit delta via the backend internal API.
 * Used by credit-flow.spec.ts to simulate chat debits and task
 * bonuses without spinning up the real AI worker.
 */
export async function applyCreditDelta(args: {
  userId: string;
  reason: string;
  deltaCredits: number;
  idempotencyKey: string;
}): Promise<void> {
  const res = await fetch(`${BACKEND}/api/internal/credit/apply`, {
    method: "POST",
    headers: {
      "x-service-key": SERVICE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`credit/apply failed ${res.status}: ${await res.text()}`);
  }
}

export type SeededAccountStatus = "DEPLOYING" | "AWAITING_FUND" | "ACTIVE" | "HALTED" | "REVOKED";

export interface SeedAccountResult {
  accountId: string;
  status: SeededAccountStatus;
}

/**
 * Test-only: create or get a ManagedAccount for the given wallet so
 * the dashboard chrome at /farming and /portfolio renders (instead of
 * the deposit-asset wizard for fresh wallets). Call BEFORE goto.
 *
 * Backend endpoint is gated by E2E_TEST_LOGIN_ENABLED=true (mainnet
 * stack has this set) and InternalServiceGuard.
 */
export async function seedManagedAccount(
  walletAddress: string,
  status: SeededAccountStatus = "ACTIVE"
): Promise<SeedAccountResult> {
  const res = await fetch(`${BACKEND}/api/internal/e2e/seed/account`, {
    method: "POST",
    headers: {
      "x-service-key": SERVICE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ walletAddress, status }),
  });
  if (!res.ok) {
    throw new Error(`seed/account failed ${res.status}: ${await res.text()}`);
  }
  const body = await res.json();
  const data = body?.data ?? body;
  return { accountId: data.accountId, status: data.status };
}

export interface SeedActivityEvent {
  type:
    | "DEPLOY"
    | "FUND"
    | "DEPOSIT"
    | "WITHDRAW"
    | "REBALANCE"
    | "HARVEST"
    | "PRESET_CHANGE"
    | "HALT"
    | "RESUME"
    | "REVOKE"
    | "BACKSTOP_QUEUE"
    | "BACKSTOP_EXIT";
  amount?: number;
  token?: string;
  detail?: string;
  txHash?: string;
}

/**
 * Test-only: insert Activity rows for the wallet ManagedAccount.
 * Throws if no account exists; call seedManagedAccount first.
 */
export async function seedActivity(
  walletAddress: string,
  events: SeedActivityEvent[]
): Promise<{ count: number }> {
  const res = await fetch(`${BACKEND}/api/internal/e2e/seed/activity`, {
    method: "POST",
    headers: {
      "x-service-key": SERVICE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ walletAddress, events }),
  });
  if (!res.ok) {
    throw new Error(`seed/activity failed ${res.status}: ${await res.text()}`);
  }
  const body = await res.json();
  const data = body?.data ?? body;
  return { count: Number(data.count ?? 0) };
}
