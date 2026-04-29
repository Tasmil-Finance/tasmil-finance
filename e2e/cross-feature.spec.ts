/**
 * Cross-feature user journeys e2e
 *
 * Multi-feature flows that exercise the production data path: referral
 * landing → waitlist → JOIN credit, topup → /profile/credits balance,
 * and multi-tab balance propagation.
 *
 * Each scenario uses unique wallets so they can run in parallel without
 * stepping on each other; pre-clean is via dbCleanWallet.
 */

import { expect, test } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";
import {
  BACKEND_URL,
  dbCleanWallet,
  execPsql,
  loginAsWallet,
  seedWaitlistEntry,
} from "./_helpers/auth";

const SERVICE_KEY =
  process.env.AI_INTERNAL_SHARED_TOKEN ?? "tasmil-local-internal-token";

const REF_INVITER_WALLET = "GCROSSFEATURE1A0000000000000000000000000000000000000000";
const REF_INVITEE_WALLET = "GCROSSFEATURE1B0000000000000000000000000000000000000000";
const TOPUP_WALLET = "GCROSSFEATURE2W0000000000000000000000000000000000000000";
const MULTITAB_WALLET = "GCROSSFEATURE3W0000000000000000000000000000000000000000";

const REF_INVITER_CODE = "XF1INV";
const REF_INVITEE_CODE = "XF1IVE";

test.describe("Cross-feature user journeys", () => {
  test.beforeAll(() => {
    [
      REF_INVITER_WALLET,
      REF_INVITEE_WALLET,
      TOPUP_WALLET,
      MULTITAB_WALLET,
    ].forEach(dbCleanWallet);
  });

  test("Referral landing → /r/<code> → waitlist seed → JOIN credit", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);

    // 1. Anonymous visit /r/<code> — page persists the code in localStorage
    //    and redirects to /?ref=<code>.
    await page.goto(`/r/${REF_INVITER_CODE}`);
    await page.waitForURL(/\/\?ref=/, { timeout: 15_000 });
    expect(page.url()).toContain(`ref=${REF_INVITER_CODE}`);
    const persistedCode = await page.evaluate(() =>
      window.localStorage.getItem("tasmil.referral.pendingCode"),
    );
    expect(persistedCode).toBe(REF_INVITER_CODE);

    // 2. Seed waitlist rows directly: inviter (referredById=null) and
    //    invitee (referredById=inviterEntryId). The invitee's first
    //    test-login then triggers AuthService.upsertAndIssueToken →
    //    ReferralService.creditJoinIfEligible → +20 credits.
    const inviterEntryId = seedWaitlistEntry({
      walletAddress: REF_INVITER_WALLET,
      referralCode: REF_INVITER_CODE,
      referredById: null,
    });
    seedWaitlistEntry({
      walletAddress: REF_INVITEE_WALLET,
      referralCode: REF_INVITEE_CODE,
      referredById: inviterEntryId,
    });

    // 3. Login the invitee.
    const invitee = await loginAsWallet(page, REF_INVITEE_WALLET);

    // 4. Defensive backend checks.
    const snapRes = await page.request.get(`${BACKEND_URL}/api/referral/me`, {
      headers: { Authorization: `Bearer ${invitee.jwt}` },
    });
    expect(snapRes.ok()).toBeTruthy();
    const snapBody = await snapRes.json();
    expect(snapBody.data.totalEarnedCredits).toBe(20);
    expect(snapBody.data.joinClaimedAt).not.toBeNull();
    const joinEvents = (snapBody.data.recentEvents as Array<{ kind: string }>).filter(
      (e) => e.kind === "JOIN",
    );
    expect(joinEvents).toHaveLength(1);

    // 5. Inviter's successfulReferralCount incremented to 1.
    const inviterCount = execPsql(
      `SELECT successful_referral_count FROM waitlist_entries WHERE wallet_address = '${REF_INVITER_WALLET}'`,
    );
    expect(Number.parseInt(inviterCount, 10)).toBe(1);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("Topup CRYPTO fulfilled → balance reflects in /profile/credits", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    const session = await loginAsWallet(page, TOPUP_WALLET);

    // 1. Mint a CRYPTO quote.
    const quoteRes = await page.request.post(`${BACKEND_URL}/api/topup/quote`, {
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "content-type": "application/json",
      },
      data: { packageId: "starter", rail: "CRYPTO" },
    });
    expect(quoteRes.ok(), `quote ${quoteRes.status()}`).toBeTruthy();
    const quoteBody = await quoteRes.json();
    const { topupId, memo, amount } = quoteBody.data as {
      topupId: string;
      memo: string;
      amount: string;
    };
    expect(topupId).toMatch(/^topup_/);

    // 2. Fire the test-only synthetic Horizon match.
    const matchRes = await page.request.post(
      `${BACKEND_URL}/api/internal/topup/test/match`,
      {
        headers: {
          "x-service-key": SERVICE_KEY,
          "content-type": "application/json",
        },
        data: {
          memo,
          amount,
          txHash: `e2e-cross-feature-${topupId}`,
        },
      },
    );
    expect(matchRes.ok(), `match ${matchRes.status()}: ${await matchRes.text()}`).toBeTruthy();
    const matchBody = await matchRes.json();
    // The dev backend wraps responses in `{success, data}`; the synthetic
    // matcher returns { status, topupId, ledgerId, observedAmount } inside.
    expect(matchBody.data?.status ?? matchBody.status).toBe("FULFILLED");

    // 3. The credit/me endpoint should now reflect 100 credits + 1000 points.
    const meRes = await page.request.get(`${BACKEND_URL}/api/credit/me`, {
      headers: { Authorization: `Bearer ${session.jwt}` },
    });
    const meBody = await meRes.json();
    expect(meBody.data.credits).toBe(100);
    expect(meBody.data.points).toBe(1000);

    // 4. Ledger has the TOPUP_CRYPTO row keyed `crypto:<topupId>`.
    const ledgerRes = await page.request.get(
      `${BACKEND_URL}/api/credit/me/ledger?limit=10`,
      { headers: { Authorization: `Bearer ${session.jwt}` } },
    );
    const ledgerBody = await ledgerRes.json();
    const cryptoRows = (
      ledgerBody.data.items as Array<{ idempotencyKey: string; reason: string }>
    ).filter((r) => r.idempotencyKey === `topup:${topupId}`);
    expect(cryptoRows).toHaveLength(1);
    expect(cryptoRows[0].reason).toBe("TOPUP_CRYPTO");

    // 5. Render the page and confirm the credits-page testid mounts.
    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("Multi-tab — quote in tab A, balance updates in tab B after fulfill+reload", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const tabA = await ctx.newPage();
    const tabB = await ctx.newPage();
    const { errors: errsA } = attachConsoleSpy(tabA);
    const { errors: errsB } = attachConsoleSpy(tabB);

    const session = await loginAsWallet(tabA, MULTITAB_WALLET);

    // Tab B: load /profile/credits (need same auth-storage). loginAsWallet
    // only registered the init-script for tabA, so manually seed tabB by
    // copying from tabA's localStorage after a public-route load.
    await tabA.goto("/topup");
    await tabB.goto("/topup");
    const authJson = await tabA.evaluate(() => window.localStorage.getItem("auth-storage"));
    const walletJson = await tabA.evaluate(() => window.localStorage.getItem("wallet-storage"));
    if (authJson) {
      await tabB.evaluate(
        ({ authJson, walletJson }) => {
          window.localStorage.setItem("auth-storage", authJson);
          if (walletJson) window.localStorage.setItem("wallet-storage", walletJson);
        },
        { authJson, walletJson },
      );
    }
    await tabB.goto("/profile/credits");
    await expect(tabB.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });
    await expect(tabB.getByTestId("credits-balance")).toHaveText("0", {
      timeout: 10_000,
    });

    // Tab A: mint a CRYPTO quote and fulfill it.
    const quoteRes = await tabA.request.post(`${BACKEND_URL}/api/topup/quote`, {
      headers: {
        Authorization: `Bearer ${session.jwt}`,
        "content-type": "application/json",
      },
      data: { packageId: "starter", rail: "CRYPTO" },
    });
    const quoteBody = await quoteRes.json();
    const { topupId, memo, amount } = quoteBody.data as {
      topupId: string;
      memo: string;
      amount: string;
    };
    const matchRes = await tabA.request.post(
      `${BACKEND_URL}/api/internal/topup/test/match`,
      {
        headers: {
          "x-service-key": SERVICE_KEY,
          "content-type": "application/json",
        },
        data: { memo, amount, txHash: `e2e-multitab-${topupId}` },
      },
    );
    expect(matchRes.ok()).toBeTruthy();

    // Tab B: reload to re-fetch /api/credit/me.
    await tabB.reload();
    await expect(tabB.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });
    await expect(tabB.getByTestId("credits-balance")).toHaveText("100", {
      timeout: 15_000,
    });

    expect(errsA, `Tab A errors: ${errsA.join("\n")}`).toEqual([]);
    expect(errsB, `Tab B errors: ${errsB.join("\n")}`).toEqual([]);
    await ctx.close();
  });
});
