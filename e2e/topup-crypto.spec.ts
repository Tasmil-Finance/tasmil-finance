/**
 * Phase 2 — Topup Crypto Rail (mocked, per delta D3)
 *
 * NO real mainnet payment is signed. The cron poller's per-record match logic
 * is exposed as a feature-flagged endpoint
 *   POST /api/internal/topup/test/match
 * gated by:
 *   - TOPUP_TEST_MATCH_ENABLED=true (set in apps/backend/.env for local dev)
 *   - X-Service-Key header == AI_INTERNAL_SHARED_TOKEN
 *
 * Each scenario:
 *   1. logs in via /api/auth/wallet/test-login
 *   2. injects zustand auth-storage via addInitScript
 *   3. clicks the Starter buy-crypto CTA -> quote loader -> wait page
 *   4. reads the on-screen amount + memo
 *   5. POSTs the test/match endpoint with a synthetic payment
 *   6. asserts the wait-page polling either redirects (FULFILLED) or stays (PENDING)
 *   7. verifies the credit ledger has exactly 1 row keyed by `topup:<id>`
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";
const SERVICE_KEY = process.env.AI_INTERNAL_SHARED_TOKEN ?? "tasmil-local-internal-token";

const SCENARIO_1_WALLET = "GTOPUPCRYPTO1000000000000000000000000000000000000000000";
const SCENARIO_2_WALLET = "GTOPUPCRYPTO2000000000000000000000000000000000000000000";
const SCENARIO_3_WALLET = "GTOPUPCRYPTO3000000000000000000000000000000000000000000";

interface Session {
  walletAddress: string;
  jwt: string;
  userId: string;
}

interface LedgerRow {
  id: string;
  reason: string;
  deltaCredits: number;
  deltaPoints: number;
  idempotencyKey: string;
}

interface TestMatchResult {
  status: "FULFILLED" | "NO_MATCH" | "OUT_OF_TOLERANCE" | "ALREADY_FULFILLED" | "INVALID_MEMO";
  topupId?: string;
  ledgerId?: string;
  observedAmount?: string;
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<Session> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

  const meRes = await fetch(`${BACKEND}/api/user/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!meRes.ok) throw new Error(`/api/user/me ${meRes.status}`);
  const meBody = (await meRes.json()) as { data?: { id: string }; id?: string };
  const userId = meBody.data?.id ?? meBody.id ?? "";
  expect(userId).toBeTruthy();

  await page.addInitScript(
    ({ walletAddress, jwt }) => {
      (window as Window & { __WALLET_MOCK__?: unknown }).__WALLET_MOCK__ = {
        isConnected: true,
        address: walletAddress,
        displayAddress: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
        isAuthenticating: false,
      };
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: jwt,
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() + 60 * 60 * 1000,
          },
          version: 0,
        }),
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 }),
      );
    },
    { walletAddress, jwt },
  );

  return { walletAddress, jwt, userId };
}

async function postTestMatch(
  page: Page,
  body: { memo: string; amount: string; txHash: string },
): Promise<TestMatchResult> {
  const res = await page.request.post(`${BACKEND}/api/internal/topup/test/match`, {
    headers: { "x-service-key": SERVICE_KEY, "content-type": "application/json" },
    data: body,
  });
  expect(res.ok(), `test/match HTTP ${res.status()}: ${await res.text()}`).toBeTruthy();
  const json = (await res.json()) as { data?: TestMatchResult } | TestMatchResult;
  return ("data" in json && json.data ? json.data : json) as TestMatchResult;
}

async function getLedger(jwt: string): Promise<LedgerRow[]> {
  const res = await fetch(`${BACKEND}/api/credit/me/ledger?limit=50`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`/api/credit/me/ledger ${res.status}`);
  const body = (await res.json()) as {
    data?: { items: LedgerRow[] };
    items?: LedgerRow[];
  };
  return body.data?.items ?? body.items ?? [];
}

async function getTopupSnapshot(
  jwt: string,
  topupId: string,
): Promise<{ status: string; expectedAmount?: string }> {
  const res = await fetch(`${BACKEND}/api/topup/${topupId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error(`/api/topup/${topupId} ${res.status}`);
  const body = (await res.json()) as {
    data?: { status: string; amount?: string };
    status?: string;
  };
  const data = body.data ?? body;
  return {
    status: (data as { status: string }).status,
    expectedAmount: (data as { amount?: string }).amount,
  };
}

/**
 * Drive the catalog → loader → wait flow up to and including the moment the
 * crypto-amount/memo are visible. Returns the topupId + amount + memo so the
 * caller can post a synthetic match.
 */
async function navigateToWaitPage(page: Page): Promise<{ topupId: string; memo: string; amount: string }> {
  await page.goto("/topup");
  await page.getByTestId("package-card-starter-buy-crypto").click();

  await page.waitForURL(/\/topup\/topup_[^/]+\/wait/, { timeout: 30_000 });
  const url = page.url();
  const match = url.match(/\/topup\/(topup_[^/?#]+)\/wait/);
  if (!match) throw new Error(`Unexpected URL after CTA: ${url}`);
  const topupId = match[1];

  await expect(page.getByTestId("crypto-pending-card")).toBeVisible();
  const amountText = (await page.getByTestId("crypto-amount").textContent()) ?? "";
  const amount = amountText.trim().split(/\s+/)[0]; // "40.0000000 XLM" → "40.0000000"
  expect(amount).toMatch(/^\d+\.\d{7}$/);

  const memoText = (await page.getByTestId("crypto-memo").textContent()) ?? "";
  const memo = memoText.trim();
  expect(memo).toMatch(/^topup:topup_[A-Za-z0-9_-]+$/);
  expect(memo.length).toBeLessThanOrEqual(28);

  return { topupId, memo, amount };
}

test.describe("Phase 2 — Topup Crypto Rail (D3 mocked)", () => {
  test("Scenario 1: in-tolerance match → FULFILLED, redirected to /profile/credits, exactly 1 ledger row", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, SCENARIO_1_WALLET);
    const { errors } = attachConsoleSpy(page);

    const { topupId, memo, amount } = await navigateToWaitPage(page);

    const result = await postTestMatch(page, {
      memo,
      amount,
      txHash: "tx_test_match_scenario_1",
    });
    expect(result.status).toBe("FULFILLED");
    expect(result.topupId).toBe(topupId);
    expect(result.ledgerId).toBeTruthy();

    // The wait page polls /api/topup/<id> every 5s; it flips to FULFILLED →
    // redirects to /profile/credits?fulfilled=<id>.
    await page.waitForURL(new RegExp(`/profile/credits\\?fulfilled=${topupId}`), {
      timeout: 30_000,
    });

    const ledger = await getLedger(session.jwt);
    const matches = ledger.filter((row) => row.idempotencyKey === `topup:${topupId}`);
    expect(matches).toHaveLength(1);
    expect(matches[0].reason).toBe("TOPUP_CRYPTO");
    expect(matches[0].deltaCredits).toBeGreaterThan(0);

    expect(errors).toEqual([]);
  });

  test("Scenario 2: out-of-tolerance (2.5% short) → still PENDING, no fulfill, no ledger row", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, SCENARIO_2_WALLET);
    const { errors } = attachConsoleSpy(page);

    const { topupId, memo, amount } = await navigateToWaitPage(page);

    // 2.5% short of the locked amount — outside the ±0.5% (50 bps) tolerance.
    const expectedNum = Number.parseFloat(amount);
    const shortAmount = (expectedNum * 0.975).toFixed(7);

    const result = await postTestMatch(page, {
      memo,
      amount: shortAmount,
      txHash: "tx_test_underpay_scenario_2",
    });
    expect(result.status).toBe("OUT_OF_TOLERANCE");
    expect(result.topupId).toBe(topupId);
    expect(result.observedAmount).toBe(shortAmount);

    // Wait one polling cycle + buffer; expect the URL to remain on the wait
    // page since the topup is still PENDING.
    await page.waitForTimeout(6_000);
    expect(page.url()).toContain(`/topup/${topupId}/wait`);

    const snap = await getTopupSnapshot(session.jwt, topupId);
    expect(snap.status).toBe("PENDING");

    const ledger = await getLedger(session.jwt);
    const matches = ledger.filter((row) => row.idempotencyKey === `topup:${topupId}`);
    expect(matches).toHaveLength(0);

    expect(errors).toEqual([]);
  });

  test("Scenario 3: double-call same memo → second is ALREADY_FULFILLED, exactly 1 ledger row", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, SCENARIO_3_WALLET);
    const { errors } = attachConsoleSpy(page);

    const { topupId, memo, amount } = await navigateToWaitPage(page);

    // First call: should fulfill.
    const first = await postTestMatch(page, {
      memo,
      amount,
      txHash: "tx_test_idempotent_scenario_3_call_1",
    });
    expect(first.status).toBe("FULFILLED");
    expect(first.topupId).toBe(topupId);

    // Second call (same memo, same amount, different txHash) should be a
    // no-op since the topup row is already FULFILLED.
    const second = await postTestMatch(page, {
      memo,
      amount,
      txHash: "tx_test_idempotent_scenario_3_call_2",
    });
    expect(second.status).toBe("ALREADY_FULFILLED");
    expect(second.topupId).toBe(topupId);

    await page.waitForURL(new RegExp(`/profile/credits\\?fulfilled=${topupId}`), {
      timeout: 30_000,
    });

    const ledger = await getLedger(session.jwt);
    const matches = ledger.filter((row) => row.idempotencyKey === `topup:${topupId}`);
    expect(matches).toHaveLength(1);

    expect(errors).toEqual([]);
  });
});
