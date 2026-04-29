/**
 * Error / network failure UX e2e
 *
 * Confirms the FE handles common backend failure modes without crashing:
 *   S1 Anonymous /profile/credits — page renders empty state, no JS errors,
 *      no console crash. (Production behaviour: graceful zero balances.)
 *   S2 Stale (expired) auth token → /profile/credits still mounts, just
 *      with zero balances. No useEffect-driven blow-up.
 *   S3 Backend 500 mocked via page.route → page surfaces an error fallback
 *      OR keeps the empty state alive; either way, no JS crash.
 *   S4 Missing waitlist row (no seed) → /profile/referrals shows the
 *      empty-state CTA, no crash.
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";
import { dbCleanWallet, gotoAuthed, loginAsWallet } from "./_helpers/auth";

const S1_WALLET = "GERRORSTATE01000000000000000000000000000000000000000000";
const S2_WALLET = "GERRORSTATE02000000000000000000000000000000000000000000";
const S3_WALLET = "GERRORSTATE03000000000000000000000000000000000000000000";
const S4_WALLET = "GERRORSTATE04000000000000000000000000000000000000000000";

async function seedExpiredAuth(page: Page, walletAddress: string): Promise<void> {
  await page.addInitScript(
    ({ walletAddress }) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            accessToken: "fake.jwt.expired",
            user: {
              id: walletAddress,
              walletAddress,
              type: "regular",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            isLoading: false,
            expiresAt: Date.now() - 60 * 60 * 1000, // -1h
          },
          version: 0,
        }),
      );
    },
    { walletAddress },
  );
}

test.describe("Error states", () => {
  test.beforeAll(() => {
    [S1_WALLET, S2_WALLET, S3_WALLET, S4_WALLET].forEach(dbCleanWallet);
  });

  test("S1: anonymous /profile/credits → renders empty, no crash", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);

    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("credits-balance")).toHaveText("0");
    await expect(page.getByTestId("points-balance")).toHaveText("0");
    // Empty placeholder visible because the user is unauth → query disabled.
    await expect(page.getByTestId("ledger-empty")).toBeVisible({ timeout: 10_000 });

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S2: stale/expired token on /profile/credits → graceful render", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    await seedExpiredAuth(page, S2_WALLET);

    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });
    // Hook reads `isTokenExpired` and disables the query → balance stays 0.
    await expect(page.getByTestId("credits-balance")).toHaveText("0", {
      timeout: 15_000,
    });

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S3: backend 500 on /api/credit/me → page renders zeros, no crash", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);

    // Fail every credit/me call from the page context.
    await page.route("**/api/credit/me", (route) => {
      void route.fulfill({
        status: 500,
        body: JSON.stringify({ message: "synthetic 500", error: "Internal" }),
        headers: { "content-type": "application/json" },
      });
    });

    // Login + go to credits.
    await loginAsWallet(page, S3_WALLET);
    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });

    // Even with the 500, the page still mounts. Balance falls back to 0.
    await expect(page.getByTestId("credits-balance")).toHaveText("0", {
      timeout: 15_000,
    });

    // Filter the synthetic 500 we deliberately injected — it's expected.
    const realErrors = errors.filter((e) => !/500.*\/api\/credit\/me/.test(e));
    expect(realErrors, `Real console errors: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("S4: /profile/referrals with no waitlist row → empty CTA, no crash", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    // No seed — fresh wallet has no waitlist row, so backend returns
    // referralCode=null and the page shows the empty-state CTA.
    await loginAsWallet(page, S4_WALLET);

    await gotoAuthed(page, "/profile/referrals");
    await expect(page.getByTestId("referrals-root")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("referrals-empty")).toBeVisible();
    // Stats still mount with zeros.
    await expect(page.getByTestId("referrals-total-credits")).toContainText("0");

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });
});
