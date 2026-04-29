/**
 * X-share verify — frontend dialog → backend HTTP contract.
 *
 * Drives the `<VerifyShareDialog />` component through the actual DOM:
 *   1. Mock `/api/referral/me` so the page loads with `xLinked: true`,
 *      which renders the "Verify your tweet (+30)" button.
 *   2. Mock `/api/referral/verify-share` to return the scenario-specific
 *      response (success / X_NOT_LINKED / TWEET_NOT_ELIGIBLE / ALREADY_REDEEMED).
 *   3. Click the CTA, fill the tweet URL input, click verify, assert the
 *      visible state (success / error / already-redeemed) inside the dialog.
 *
 * Why mock the BACKEND endpoint (not the AI sidecar):
 *   The backend → AI HTTP call fires server-side and never reaches the
 *   browser, so `page.route('**\/internal/x/get-tweet')` cannot see it.
 *   Coverage of that upstream chain lives in:
 *     - 9 backend XApiClient unit tests (XV5)
 *     - 9 verifyShare service unit tests (XV8)
 *     - AI sidecar live smoke (XV4)
 *     - Mainnet endpoint smoke (recovery)
 *
 * Skip behaviour:
 *   `test-login` is gated on `NODE_ENV !== 'production'` in the backend
 *   (auth.controller.ts:57). The mainnet docker stack runs production so
 *   the spec auto-skips there. Locally on dev (NODE_ENV=development,
 *   port 6756) it runs and asserts the four scenarios.
 */

import { expect, type Page, test } from "@playwright/test";

const BACKEND = process.env.PLAYWRIGHT_BACKEND_URL ?? "http://localhost:6756";

const S1_WALLET = "GREFXSHARE10000000000000000000000000000000000000000000";
const S2_WALLET = "GREFXSHARE20000000000000000000000000000000000000000000";
const S3_WALLET = "GREFXSHARE30000000000000000000000000000000000000000000";
const S4_WALLET = "GREFXSHARE40000000000000000000000000000000000000000000";

interface Session {
  jwt: string;
  walletAddress: string;
}

async function detectProductionBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND}/api/auth/wallet/test-login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        walletAddress: "GAA77777777777777777777777777777777777777777777777777BKW",
      }),
    });
    if (res.status === 403) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return /production/i.test(body.message ?? "");
    }
    return false;
  } catch {
    return false;
  }
}

let backendIsProduction = false;
test.beforeAll(async () => {
  backendIsProduction = await detectProductionBackend();
});

test.beforeEach(async () => {
  test.skip(
    backendIsProduction || process.env.NODE_ENV === "production",
    "verify-share spec needs test-login (dev backend); skipped on production stack"
  );
});

async function loginAsWallet(page: Page, walletAddress: string): Promise<Session> {
  const response = await page.request.post(`${BACKEND}/api/auth/wallet/test-login`, {
    data: { walletAddress },
  });
  expect(response.ok(), `test-login HTTP ${response.status()}`).toBeTruthy();
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
        })
      );
      localStorage.setItem(
        "wallet-storage",
        JSON.stringify({ state: { account: walletAddress }, version: 0 })
      );
    },
    { walletAddress, jwt }
  );

  return { jwt, walletAddress };
}

interface SnapshotConfig {
  referralCode: string;
  totalEarnedCredits: number;
  joinClaimedAt: string | null;
  xLinked: boolean;
  recentEvents: Array<{ kind: string; creditsAwarded: number; occurredAt: string }>;
}

function buildSnapshotPayload(cfg: SnapshotConfig) {
  return {
    success: true,
    data: cfg,
  };
}

async function mockMe(page: Page, getCfg: () => SnapshotConfig) {
  await page.route("**/api/referral/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(buildSnapshotPayload(getCfg())),
    });
  });
}

async function openVerifyShareDialogAndSubmit(page: Page, tweetUrl: string) {
  await page.getByTestId("referrals-verify-share").click();
  await expect(page.getByTestId("verify-share-dialog-root")).toBeVisible();
  await page.getByTestId("verify-share-dialog-tweet-url").fill(tweetUrl);
  await page.getByTestId("verify-share-dialog-verify").click();
}

test.describe("Referral X-share verify (FE dialog → BE HTTP contract)", () => {
  test("S1: backend rejects with X_NOT_LINKED → dialog shows 'Link your X account first'", async ({
    page,
  }) => {
    await loginAsWallet(page, S1_WALLET);
    await mockMe(page, () => ({
      referralCode: "XSHARES1",
      totalEarnedCredits: 0,
      joinClaimedAt: null,
      xLinked: true, // CTA must be visible to drive the verify call from the UI
      recentEvents: [],
    }));
    await page.route("**/api/referral/verify-share", async (route) => {
      expect(route.request().method()).toBe("POST");
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          statusCode: 403,
          message: "X_NOT_LINKED",
          path: "/api/referral/verify-share",
        }),
      });
    });

    await page.goto("/profile/referrals");
    await openVerifyShareDialogAndSubmit(page, "https://x.com/me/status/4001");

    const error = page.getByTestId("verify-share-dialog-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/link your x account/i);
  });

  test("S2: happy path — dialog shows '+30 credits earned' and snapshot reflects new event", async ({
    page,
  }) => {
    await loginAsWallet(page, S2_WALLET);

    let verifyDidSucceed = false;
    const baseEvent = {
      kind: "X_SHARE",
      creditsAwarded: 30,
      occurredAt: new Date().toISOString(),
    };
    await mockMe(page, () => ({
      referralCode: "XSHARES2",
      totalEarnedCredits: verifyDidSucceed ? 30 : 0,
      joinClaimedAt: new Date().toISOString(),
      xLinked: true,
      recentEvents: verifyDidSucceed ? [baseEvent] : [],
    }));
    await page.route("**/api/referral/verify-share", async (route) => {
      const post = route.request();
      expect(post.method()).toBe("POST");
      const json = JSON.parse(post.postData() ?? "{}");
      expect(json.tweetUrl).toBe("https://x.com/tester/status/5000");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: { credited: true } }),
      });
      verifyDidSucceed = true;
    });

    await page.goto("/profile/referrals");
    await openVerifyShareDialogAndSubmit(page, "https://x.com/tester/status/5000");

    const success = page.getByTestId("verify-share-dialog-success");
    await expect(success).toBeVisible();
    await expect(success).toContainText(/\+30 credits/i);

    // After the dialog invalidates the snapshot query, the page should render
    // the new total + an X_SHARE row in the events table.
    await expect(page.getByTestId("referrals-total-credits")).toContainText(/30/);
    await expect(page.getByTestId("referrals-events-row-X_SHARE")).toBeVisible();
  });

  test("S3: reply rejection — dialog shows 'replies not allowed' message", async ({ page }) => {
    await loginAsWallet(page, S3_WALLET);
    await mockMe(page, () => ({
      referralCode: "XSHARES3",
      totalEarnedCredits: 0,
      joinClaimedAt: null,
      xLinked: true,
      recentEvents: [],
    }));
    await page.route("**/api/referral/verify-share", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          statusCode: 403,
          message: "TWEET_NOT_ELIGIBLE: replies not allowed",
          path: "/api/referral/verify-share",
        }),
      });
    });

    await page.goto("/profile/referrals");
    await openVerifyShareDialogAndSubmit(page, "https://x.com/tester/status/6000");

    const error = page.getByTestId("verify-share-dialog-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/replies are not allowed/i);
  });

  test("S4: idempotent replay — second submit shows 'already used' message", async ({ page }) => {
    /**
     * Backend semantics (referral.service.ts:185-198): on unique-constraint
     * violation against `ReferralEvent (userId, sourceId)`, the service
     * RETURNS `{ credited: false, reason: 'ALREADY_REDEEMED' }` with HTTP 200
     * (not 409).
     */
    await loginAsWallet(page, S4_WALLET);
    await mockMe(page, () => ({
      referralCode: "XSHARES4",
      totalEarnedCredits: 0,
      joinClaimedAt: null,
      xLinked: true,
      recentEvents: [],
    }));

    let verifyCallCount = 0;
    await page.route("**/api/referral/verify-share", async (route) => {
      verifyCallCount += 1;
      const payload =
        verifyCallCount === 1
          ? { success: true, data: { credited: true } }
          : { success: true, data: { credited: false, reason: "ALREADY_REDEEMED" } };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.goto("/profile/referrals");

    // First submit → success
    await openVerifyShareDialogAndSubmit(page, "https://x.com/tester/status/7000");
    await expect(page.getByTestId("verify-share-dialog-success")).toBeVisible();

    // Close, reopen, submit same URL → already-redeemed
    await page.getByTestId("verify-share-dialog-close").click();
    await openVerifyShareDialogAndSubmit(page, "https://x.com/tester/status/7000");
    const alreadyRedeemed = page.getByTestId("verify-share-dialog-already-redeemed");
    await expect(alreadyRedeemed).toBeVisible();
    await expect(alreadyRedeemed).toContainText(/already used/i);
    expect(verifyCallCount).toBe(2);
  });
});
