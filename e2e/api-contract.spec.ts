/**
 * API contract regression e2e
 *
 * Pure HTTP regression on the dev backend at PLAYWRIGHT_BACKEND_URL — drives
 * each endpoint via page.request and asserts:
 *   - HTTP status (200 / 401 / 403 / 404 etc.)
 *   - The standard `{ success: true, data: ... }` envelope where applicable.
 *   - Key fields in the data shape so a downstream rename surfaces here as
 *     a failure rather than crashing a UI elsewhere.
 *
 * Each test that needs an authed JWT or admin JWT uses unique wallet/email
 * inputs so cross-test collisions are impossible. The DB cleanup is run in
 * beforeAll. New scenarios should follow the same wallet-naming pattern.
 */

import { expect, test } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";
import {
  BACKEND_URL,
  dbCleanWallet,
  loginAsWallet,
  provisionAdmin,
} from "./_helpers/auth";

const S1_WALLET = "GAPICONTRACT01WALLET000000000000000000000000000000000000";
const S2_WALLET = "GAPICONTRACT02WALLET000000000000000000000000000000000000";
const S3_WALLET = "GAPICONTRACT03WALLET000000000000000000000000000000000000";
const S4_WALLET = "GAPICONTRACT04WALLET000000000000000000000000000000000000";
const S5_WALLET = "GAPICONTRACT05WALLET000000000000000000000000000000000000";
const S6_WALLET = "GAPICONTRACT06WALLET000000000000000000000000000000000000";
const S7_WALLET = "GAPICONTRACT07WALLET000000000000000000000000000000000000";
const S8_WALLET = "GAPICONTRACT08WALLET000000000000000000000000000000000000";
const S9_WALLET = "GAPICONTRACT09WALLET000000000000000000000000000000000000";

const ADMIN_EMAIL = `api-contract-admin-${Date.now()}@e2e.test`;
const ADMIN_PASSWORD = "ApiContractE2E!Pw123";
const CAMP_EMAIL = `api-contract-camp-${Date.now()}@e2e.test`;
const CAMP_PASSWORD = "ApiContractE2E!Pw123";

test.describe("API contract regression", () => {
  test.beforeAll(() => {
    [
      S1_WALLET,
      S2_WALLET,
      S3_WALLET,
      S4_WALLET,
      S5_WALLET,
      S6_WALLET,
      S7_WALLET,
      S8_WALLET,
      S9_WALLET,
    ].forEach(dbCleanWallet);
  });

  test("GET /api/health → 200 + {status:'ok',timestamp}", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: "ok",
          timestamp: expect.any(String),
        }),
      }),
    );
  });

  test("POST /api/auth/wallet/test-login → 201 + accessToken", async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/auth/wallet/test-login`, {
      data: { walletAddress: S1_WALLET },
    });
    // NestJS @Post returns 201 by default for newly-minted resources.
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toMatch(/^eyJ/);
    expect(body.data.user.publicKey).toBe(S1_WALLET);
  });

  test("GET /api/user/me → 200 with auth, 401 without", async ({ page }) => {
    const session = await loginAsWallet(page, S2_WALLET);

    const ok = await page.request.get(`${BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    expect(ok.status()).toBe(200);
    const okBody = await ok.json();
    expect(okBody.success).toBe(true);
    expect(okBody.data.id).toBeTruthy();
    // Different surfaces use different property names — accept any of them.
    const wallet =
      okBody.data.publicKey ??
      okBody.data.walletAddress ??
      okBody.data.stellarPubkey ??
      "";
    expect(wallet).toBe(S2_WALLET);

    const unauth = await page.request.get(`${BACKEND_URL}/api/user/me`);
    expect(unauth.status()).toBe(401);
  });

  test("GET /api/credit/me → 200 + {credits,points,recent[]}", async ({ page }) => {
    const session = await loginAsWallet(page, S3_WALLET);
    const res = await page.request.get(`${BACKEND_URL}/api/credit/me`, {
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        credits: expect.any(Number),
        points: expect.any(Number),
        recent: expect.any(Array),
      }),
    );
  });

  test("GET /api/credit/me/ledger?limit=5 → 200 + items[] + nextCursor", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, S4_WALLET);
    const res = await page.request.get(
      `${BACKEND_URL}/api/credit/me/ledger?limit=5`,
      { headers: { Authorization: `Bearer ${session.jwt}` } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        items: expect.any(Array),
        nextCursor: null,
      }),
    );
  });

  test("GET /api/credit/packages → 200 + 4 public packages", async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/credit/packages`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBe(4);
    const ids = (body.data as Array<{ id: string }>).map((p) => p.id).sort();
    expect(ids).toEqual(["plus", "pro", "starter", "whale"]);
  });

  test("POST /api/topup/quote {CRYPTO} → 200 + {topupId,memo,amount}", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, S5_WALLET);
    const res = await page.request.post(`${BACKEND_URL}/api/topup/quote`, {
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "content-type": "application/json",
      },
      data: { packageId: "starter", rail: "CRYPTO" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        topupId: expect.stringMatching(/^topup_/),
        rail: "CRYPTO",
        memo: expect.stringMatching(/^topup:topup_/),
        amount: expect.stringMatching(/^\d+\.\d{1,7}$/),
        destination: expect.any(String),
      }),
    );
  });

  test("POST /api/topup/quote {FIAT} → 200 + {reference,bankAccount}", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, S6_WALLET);
    const res = await page.request.post(`${BACKEND_URL}/api/topup/quote`, {
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "content-type": "application/json",
      },
      data: { packageId: "plus", rail: "FIAT" },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        topupId: expect.stringMatching(/^topup_/),
        rail: "FIAT",
        reference: expect.stringMatching(/^TASMIL-/),
        bankAccount: expect.objectContaining({
          name: expect.any(String),
          bank: expect.any(String),
          iban: expect.any(String),
        }),
      }),
    );
  });

  test("GET /api/topup/:id → 200 + snapshot shape", async ({ page }) => {
    const session = await loginAsWallet(page, S7_WALLET);
    // Mint a fiat quote first to get a known topupId.
    const quote = await page.request.post(`${BACKEND_URL}/api/topup/quote`, {
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "content-type": "application/json",
      },
      data: { packageId: "starter", rail: "FIAT" },
    });
    const quoteBody = await quote.json();
    const topupId = quoteBody.data.topupId;

    const res = await page.request.get(`${BACKEND_URL}/api/topup/${topupId}`, {
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        topupId,
        rail: "FIAT",
        status: expect.stringMatching(/PENDING|FULFILLED|CANCELLED/),
        pricing: expect.objectContaining({
          usd: expect.any(Number),
          credits: expect.any(Number),
          points: expect.any(Number),
        }),
      }),
    );
  });

  test("GET /api/referral/me → 200 + empty snapshot for fresh wallet", async ({
    page,
  }) => {
    const session = await loginAsWallet(page, S8_WALLET);
    const res = await page.request.get(`${BACKEND_URL}/api/referral/me`, {
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        referralCode: null,
        totalEarnedCredits: 0,
        joinClaimedAt: null,
        xLinked: false,
        recentEvents: [],
      }),
    );
  });

  test("POST /api/admin-auth/login → 200 + admin JWT", async ({ request }) => {
    const session = await provisionAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    });
    expect(session.jwt).toMatch(/^eyJ/);

    // Wrong password → 401.
    const bad = await request.post(`${BACKEND_URL}/api/admin-auth/login`, {
      data: { email: ADMIN_EMAIL, password: "WrongPasswordZ!" },
    });
    expect(bad.status()).toBe(401);
  });

  test("GET /api/admin/topups?rail=FIAT&status=PENDING → 200 + array", async ({
    page,
  }) => {
    const admin = await provisionAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    });

    // Seed a pending topup for S9_WALLET so the queue has at least 1 row.
    const userSession = await loginAsWallet(page, S9_WALLET);
    await page.request.post(`${BACKEND_URL}/api/topup/quote`, {
      headers: {
        Authorization: `Bearer ${userSession.jwt}`,
        "content-type": "application/json",
      },
      data: { packageId: "starter", rail: "FIAT" },
    });

    const res = await page.request.get(
      `${BACKEND_URL}/api/admin/topups?rail=FIAT&status=PENDING`,
      { headers: { Authorization: `Bearer ${admin.jwt}` } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^topup_/),
        rail: "FIAT",
        status: "PENDING",
      }),
    );
  });

  test("GET /api/admin/codes → 200 + paginated codes", async ({ request }) => {
    const admin = await provisionAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    });
    const res = await request.get(`${BACKEND_URL}/api/admin/codes`, {
      headers: { Authorization: `Bearer ${admin.jwt}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(
      expect.objectContaining({
        codes: expect.any(Array),
        total: expect.any(Number),
      }),
    );
  });

  test("GET /api/admin/stats/registrations?days=7 → 200 + 7-day series", async ({
    request,
  }) => {
    const admin = await provisionAdmin({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    });
    const res = await request.get(
      `${BACKEND_URL}/api/admin/stats/registrations?days=7`,
      { headers: { Authorization: `Bearer ${admin.jwt}` } },
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data).toHaveLength(7);
    expect(body.data[0]).toEqual(
      expect.objectContaining({
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        count: expect.any(Number),
      }),
    );
  });

  test("POST /api/admin/topup/:id/fulfill as CAMPAIGN_ADMIN → 403", async ({
    request,
  }) => {
    const camp = await provisionAdmin({
      email: CAMP_EMAIL,
      password: CAMP_PASSWORD,
      role: "CAMPAIGN_ADMIN",
    });
    const res = await request.post(
      `${BACKEND_URL}/api/admin/topup/topup_doesnotexist/fulfill`,
      {
        headers: {
          Authorization: `Bearer ${camp.jwt}`,
          "content-type": "application/json",
        },
        data: { bankTxRef: "BNK-API-CTRCT-403" },
      },
    );
    // Phase A enforced @Roles → CAMPAIGN_ADMIN sees 403, not 200/404.
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/insufficient|forbid/i);
  });

  test("POST /api/internal/topup/test/match w/o X-Service-Key → 403", async ({
    request,
  }) => {
    const res = await request.post(
      `${BACKEND_URL}/api/internal/topup/test/match`,
      {
        headers: { "content-type": "application/json" },
        data: {
          memo: "topup:topup_no_key_test",
          amount: "10.0000000",
          txHash: "test-hash-no-key",
        },
      },
    );
    expect(res.status()).toBe(403);
  });

  test("anonymous /api/credit/packages does NOT trigger console errors", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/topup");
    // The card grid renders; no auth-flow noise in console.
    await expect(page.getByTestId("topup-page-title")).toBeVisible({
      timeout: 30_000,
    });
    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });
});
