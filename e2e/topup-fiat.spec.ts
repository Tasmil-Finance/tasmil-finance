/**
 * Phase 2 — Topup Fiat Rail e2e
 *
 * Drives the full fiat-rail flow against the live backend:
 *   1. Login as wallet user via /api/auth/wallet/test-login
 *   2. Click Plus buy-fiat CTA → wait page renders bank info + reference
 *   3. Provision a SUPER_ADMIN account via /api/admin-auth/create
 *      and log in via /api/admin-auth/login
 *   4. Open /admin/topups, fulfill the user's pending topup
 *   5. User wait-page polling redirects to /profile/credits?fulfilled=<id>
 *   6. Verify ledger has exactly 1 row keyed `fiat:<topupId>`
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

const USER_WALLET = "GTOPUPFIATUSER1000000000000000000000000000000000000000";
const ADMIN_EMAIL = `topup-fiat-admin-${Date.now()}@test.local`;
const ADMIN_PASSWORD = "TopupFiat!Test123";

interface UserSession {
  jwt: string;
  walletAddress: string;
}

interface AdminSession {
  jwt: string;
  email: string;
}

interface LedgerRow {
  id: string;
  reason: string;
  deltaCredits: number;
  deltaPoints: number;
  idempotencyKey: string;
}

async function loginAsWallet(page: Page, walletAddress: string): Promise<UserSession> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok(), `wallet test-login HTTP ${response.status()}`).toBeTruthy();
  const body = await response.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

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

  return { jwt, walletAddress };
}

async function provisionAndLoginAdmin(page: Page): Promise<AdminSession> {
  // Create the admin (idempotent-ish: if it already exists, login still works).
  const createRes = await page.request.post(`${BACKEND}/api/admin-auth/create`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: "SUPER_ADMIN" },
  });
  // 201 = created; 400 = already exists (run was retried). Either is fine —
  // the login below proves the credentials work.
  expect(createRes.status() === 201 || createRes.status() === 400).toBeTruthy();

  const loginRes = await page.request.post(`${BACKEND}/api/admin-auth/login`, {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  expect(loginRes.ok(), `admin login HTTP ${loginRes.status()}`).toBeTruthy();
  const body = await loginRes.json();
  const jwt: string = body?.data?.accessToken ?? body?.accessToken;
  expect(jwt).toBeTruthy();

  await page.addInitScript(
    ({ jwt, email }) => {
      localStorage.setItem(
        "admin-auth-storage",
        JSON.stringify({
          state: {
            token: jwt,
            admin: { id: "test", email, role: "SUPER_ADMIN" },
            isAuthenticated: true,
            hasHydrated: true,
          },
          version: 0,
        }),
      );
    },
    { jwt, email: ADMIN_EMAIL },
  );

  return { jwt, email: ADMIN_EMAIL };
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

test.describe("Phase 2 — Topup Fiat Rail (admin reconcile)", () => {
  test("user creates fiat quote → admin fulfils → balance updates → 1 ledger row", async ({
    browser,
  }) => {
    // ── User context ──
    const userCtx = await browser.newContext();
    const userPage = await userCtx.newPage();
    const { errors: userErrors } = attachConsoleSpy(userPage);
    const userSession = await loginAsWallet(userPage, USER_WALLET);

    await userPage.goto("/topup");
    await userPage.getByTestId("package-card-plus-buy-fiat").click();
    await userPage.waitForURL(/\/topup\/topup_[^/]+\/wait/, { timeout: 30_000 });

    const url = userPage.url();
    const match = url.match(/\/topup\/(topup_[^/?#]+)\/wait/);
    if (!match) throw new Error(`Unexpected URL after CTA: ${url}`);
    const topupId = match[1];

    await expect(userPage.getByTestId("fiat-pending-card")).toBeVisible();
    const reference = await userPage.getByTestId("fiat-reference").innerText();
    expect(reference).toMatch(/^TASMIL-[A-Z0-9]+$/);
    await expect(userPage.getByTestId("fiat-amount-usd")).toHaveText("$20");

    // ── Admin context ──
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const { errors: adminErrors } = attachConsoleSpy(adminPage);
    await provisionAndLoginAdmin(adminPage);

    await adminPage.goto("/admin/topups");
    await expect(adminPage.getByTestId(`admin-topup-row-${topupId}`)).toBeVisible({
      timeout: 10_000,
    });
    await adminPage
      .getByTestId(`admin-topup-banktxref-${topupId}`)
      .fill("BNK-PLAYWRIGHT-1");
    await adminPage.getByTestId(`admin-topup-fulfill-${topupId}`).click();
    await expect(adminPage.getByTestId(`admin-topup-row-${topupId}`)).toHaveCount(0, {
      timeout: 10_000,
    });

    // ── User polling redirect ──
    await userPage.waitForURL(new RegExp(`/profile/credits\\?fulfilled=${topupId}`), {
      timeout: 30_000,
    });

    // ── Ledger assertion ──
    const ledger = await getLedger(userSession.jwt);
    const fiatRows = ledger.filter((row) => row.idempotencyKey === `fiat:${topupId}`);
    expect(fiatRows).toHaveLength(1);
    expect(fiatRows[0].reason).toBe("TOPUP_FIAT");
    expect(fiatRows[0].deltaCredits).toBe(440);
    expect(fiatRows[0].deltaPoints).toBe(4000);

    expect(userErrors).toEqual([]);
    expect(adminErrors).toEqual([]);
  });
});
