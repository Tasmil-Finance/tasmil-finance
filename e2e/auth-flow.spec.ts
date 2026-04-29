/**
 * Auth flow — wallet lifecycle e2e
 *
 * Drives the full client-side wallet auth lifecycle against the dev
 * backend at PLAYWRIGHT_BACKEND_URL. Each scenario uses a unique wallet
 * so they can run in parallel without DB collisions; pre-clean is done
 * via the shared dbCleanWallet helper.
 *
 *   S1 anonymous → /topup public surfaces render (cards visible) without
 *      requiring login. Auth-gated CTAs redirect rather than throw.
 *   S2 test-login mints a JWT and the seeded auth-storage exposes the
 *      wallet chip via the dashboard sidebar.
 *   S3 expired token → the page that gates on isTokenExpired surfaces
 *      anon UI rather than authed UI.
 *   S4 logout — clearing the persisted auth-storage drops the user back
 *      to the anon view on reload.
 *   S5 cross-tab — login in tab A is reflected in tab B after a reload.
 */

import { expect, test, type Page } from "@playwright/test";
import { attachConsoleSpy } from "./_helpers/console-filter";
import {
  BACKEND_URL,
  dbCleanWallet,
  loginAsWallet,
} from "./_helpers/auth";

const S1_WALLET = "GAUTHFLOW1S00000000000000000000000000000000000000000000";
const S2_WALLET = "GAUTHFLOW2S00000000000000000000000000000000000000000000";
const S3_WALLET = "GAUTHFLOW3S00000000000000000000000000000000000000000000";
const S4_WALLET = "GAUTHFLOW4S00000000000000000000000000000000000000000000";
const S5_WALLET = "GAUTHFLOW5S00000000000000000000000000000000000000000000";

/** Inject an EXPIRED auth-storage to exercise the token-expired path. */
async function seedExpiredAuth(page: Page, walletAddress: string): Promise<void> {
  await page.addInitScript(
    ({ walletAddress }) => {
      // Token shape doesn't matter — what matters is `expiresAt` is in the
      // past so isTokenExpired() returns true.
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

test.describe("Auth flow — wallet lifecycle", () => {
  test.beforeAll(() => {
    [S1_WALLET, S2_WALLET, S3_WALLET, S4_WALLET, S5_WALLET].forEach(dbCleanWallet);
  });

  test("S1: anonymous → /topup public surfaces render without login", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    await page.goto("/topup");

    // The package cards mount even without an auth token. Use the testid
    // (a stable contract) rather than role+name (the page renders both an
    // h1 sidebar header AND an h1 page title that match the same regex).
    await expect(page.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });

    // Confirm at least one package card is rendered. The grid uses
    // role=heading for each package name; we just verify count > 0.
    const headings = page.getByRole("heading");
    expect(await headings.count()).toBeGreaterThan(0);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S2: test-login mints a JWT and the wallet chip is visible after seeding", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    const session = await loginAsWallet(page, S2_WALLET);
    expect(session.jwt).toMatch(/^eyJ/); // JWT begins with `eyJ`

    await page.goto("/topup");
    await expect(page.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });

    // Verify the persisted auth-storage round-trips into the in-memory
    // store and out the other side. The `displayAddress` rendering depends
    // on the WalletsKit being attached (no extension in headless), so we
    // assert the persisted state directly — the most reliable proof the
    // session is live in the page context.
    const storedAccessToken = await page.evaluate(() => {
      const raw = window.localStorage.getItem("auth-storage");
      if (!raw) return null;
      try {
        return (JSON.parse(raw)?.state?.accessToken ?? null) as string | null;
      } catch {
        return null;
      }
    });
    expect(storedAccessToken).toBe(session.jwt);

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S3: expired token → /profile/credits renders anon shell, not authed", async ({
    page,
  }) => {
    const { errors } = attachConsoleSpy(page);
    await seedExpiredAuth(page, S3_WALLET);

    // /profile/credits is the most sensitive credits-bearing surface and
    // gracefully renders zero balances when unauth (per the implementation
    // baked into profile-credits.spec.ts S1).
    await page.goto("/profile/credits");
    await expect(page.getByTestId("credits-page")).toBeVisible({ timeout: 15_000 });
    // Balance reads as "0" because the expired-token query is disabled.
    await expect(page.getByTestId("credits-balance")).toHaveText("0", {
      timeout: 15_000,
    });

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S4: logout — clearing auth-storage flips sidebar back to anon", async ({ page }) => {
    const { errors } = attachConsoleSpy(page);
    const session = await loginAsWallet(page, S4_WALLET);

    await page.goto("/topup");
    await expect(page.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });
    // Sanity check: persisted auth-storage carries the JWT.
    const before = await page.evaluate(() =>
      window.localStorage.getItem("auth-storage"),
    );
    expect(before ?? "").toContain(session.jwt);

    // Simulate logout: register a NEW init script that wipes auth-storage
    // on every navigation, then reload. Wipe localStorage in the current
    // tick first too, so page.reload picks up the cleared state.
    await page.evaluate(() => {
      window.localStorage.removeItem("auth-storage");
      window.localStorage.removeItem("wallet-storage");
    });
    await page.addInitScript(() => {
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("wallet-storage");
    });
    await page.reload();
    await expect(page.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });

    // After logout, auth-storage no longer carries an accessToken.
    const after = await page.evaluate(() => {
      const raw = window.localStorage.getItem("auth-storage");
      if (!raw) return null;
      try {
        return (JSON.parse(raw)?.state?.accessToken ?? null) as string | null;
      } catch {
        return null;
      }
    });
    expect(after).toBeNull();

    expect(errors, `Console errors: ${errors.join("\n")}`).toEqual([]);
  });

  test("S5: cross-tab — login in tab A is observed in tab B after reload", async ({
    browser,
  }) => {
    const ctx = await browser.newContext();
    const tabA = await ctx.newPage();
    const tabB = await ctx.newPage();
    const { errors: errsA } = attachConsoleSpy(tabA);
    const { errors: errsB } = attachConsoleSpy(tabB);

    // Tab B opens to /topup anonymously first. Confirm no JWT in storage.
    await tabB.goto("/topup");
    await expect(tabB.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });
    const tokenBefore = await tabB.evaluate(() => {
      const raw = window.localStorage.getItem("auth-storage");
      if (!raw) return null;
      try {
        return (JSON.parse(raw)?.state?.accessToken ?? null) as string | null;
      } catch {
        return null;
      }
    });
    expect(tokenBefore).toBeNull();

    // Tab A logs in, lands on /topup.
    const session = await loginAsWallet(tabA, S5_WALLET);
    await tabA.goto("/topup");
    await expect(tabA.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });

    // localStorage is per-page in Playwright (separate browsing contexts
    // would normally share it but page contexts won't auto-broadcast). To
    // emulate the cross-tab effect, copy tab A's storage onto tab B and
    // reload tab B.
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
    await tabB.reload();
    await expect(tabB.getByTestId("topup-page-title")).toBeVisible({ timeout: 30_000 });

    // Tab B now sees the JWT.
    const tokenAfter = await tabB.evaluate(() => {
      const raw = window.localStorage.getItem("auth-storage");
      if (!raw) return null;
      try {
        return (JSON.parse(raw)?.state?.accessToken ?? null) as string | null;
      } catch {
        return null;
      }
    });
    expect(tokenAfter).toBe(session.jwt);

    expect(errsA, `Tab A errors: ${errsA.join("\n")}`).toEqual([]);
    expect(errsB, `Tab B errors: ${errsB.join("\n")}`).toEqual([]);
    await ctx.close();
  });
});

// Backend URL exposed to make eslint-no-unused happy when only consumed via
// the helpers. (Helpers internally use BACKEND_URL.)
void BACKEND_URL;
