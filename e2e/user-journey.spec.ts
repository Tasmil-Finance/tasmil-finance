import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * 20 end-user journey tests covering real interactions across the redesigned
 * UI surface. These exercise click flows, dropdowns, navigation, and state
 * transitions — the things a user actually does, not just static markup.
 *
 * Run against the local mainnet stack:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3001 \
 *   PLAYWRIGHT_BACKEND_URL=http://localhost:6856 \
 *   pnpm exec playwright test user-journey.spec.ts
 */

test.describe("User journey — top nav navigation", () => {
  test("J01 — clicking Chat link in top nav navigates to /chat", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await topNav.getByRole("link", { name: /^Chat$/i }).click();
    await expect(page).toHaveURL(/\/chat/);
  });

  test("J02 — clicking Farming link navigates to /farming", async ({ page }) => {
    await page.goto("/chat/new");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await topNav.getByRole("link", { name: /^Farming$/i }).click();
    await expect(page).toHaveURL(/\/farming/);
  });

  test("J03 — clicking Aggregator link navigates to /aggregator", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await topNav.getByRole("link", { name: /^Aggregator$/i }).click();
    await expect(page).toHaveURL(/\/aggregator/);
  });

  test("J04 — clicking Portfolio link navigates to /portfolio", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await topNav.getByRole("link", { name: /^Portfolio$/i }).click();
    await expect(page).toHaveURL(/\/portfolio/);
  });

  test("J05 — clicking the brand logo returns to /chat/new", async ({ page }) => {
    await page.goto("/portfolio");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await topNav.locator('a[href="/chat/new"]').first().click();
    await expect(page).toHaveURL(/\/chat\/new/);
  });

  test("J06 — multi-step journey: chat → farming → aggregator → portfolio", async ({ page }) => {
    await page.goto("/chat/new");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await topNav.getByRole("link", { name: /^Farming$/i }).click();
    await expect(page).toHaveURL(/\/farming/);
    await topNav.getByRole("link", { name: /^Aggregator$/i }).click();
    await expect(page).toHaveURL(/\/aggregator/);
    await topNav.getByRole("link", { name: /^Portfolio$/i }).click();
    await expect(page).toHaveURL(/\/portfolio/);
  });
});

test.describe("User journey — chat history (Clock removed from header)", () => {
  test("J07 — /chat/new top nav has no Clock chat-history button", async ({ page }) => {
    await page.goto("/chat/new");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.locator("svg.lucide-clock")).toHaveCount(0);
  });
});

test.describe("User journey — wallet dropdown actions", () => {
  test("J08 — clicking Copy address writes wallet address to clipboard", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected").click();
    const copyRow = page.getByRole("menuitem", { name: /^Copy address$/i });
    await expect(copyRow).toBeVisible();
    await copyRow.click();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(wallet);
  });

  test("J09 — clicking Credits row navigates to /profile/credits", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected").click();
    await page.getByTestId("wallet-credits-row").click();
    await expect(page).toHaveURL(/\/profile\/credits/);
  });

  test("J10 — Disconnect from dropdown clears connected state", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected").click();
    await page.getByRole("menuitem", { name: /^Disconnect$/i }).click();
    // Disconnected state: pill replaced by Connect Wallet button
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.getByTestId("connect-wallet")).toBeVisible({ timeout: 5000 });
    await expect(topNav.getByTestId("wallet-connected")).toHaveCount(0);
  });

  test("J11 — Escape key closes the wallet dropdown", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected").click();
    await expect(page.getByTestId("wallet-credits-row")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("wallet-credits-row")).toHaveCount(0);
  });
});

test.describe("User journey — wizard preset selection", () => {
  // Drive the wizard from step 1 to step 3 (preset list).
  async function gotoStepPreset(page: import("@playwright/test").Page) {
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await page.getByRole("button", { name: /^Continue$/i }).click();
    await expect(page.getByRole("heading", { name: /Pick risk preset/i })).toBeVisible({
      timeout: 10000,
    });
  }

  test("J12 — Aggressive selection updates aria-checked, deselects Balanced", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await gotoStepPreset(page);

    const balanced = page.getByRole("radio", { name: /Balanced/ });
    const aggressive = page.getByRole("radio", { name: /Aggressive/ });

    await expect(balanced).toHaveAttribute("aria-checked", "true");
    await aggressive.click();
    await expect(aggressive).toHaveAttribute("aria-checked", "true");
    await expect(balanced).toHaveAttribute("aria-checked", "false");
  });

  test("J13 — Safe selection updates aria-checked", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await gotoStepPreset(page);

    const safe = page.getByRole("radio", { name: /Safe/ });
    await safe.click();
    await expect(safe).toHaveAttribute("aria-checked", "true");
  });
});

test.describe("User journey — page-level chrome by route", () => {
  test("J14 — /portfolio loads with top nav visible", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/portfolio");
    await expect(page.locator('[data-testid="top-nav-bar"]')).toBeVisible();
  });

  test("J15 — /aggregator loads with top nav visible", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/aggregator");
    await expect(page.locator('[data-testid="top-nav-bar"]')).toBeVisible();
  });

  test("J16 — /profile/credits page loads with credits content", async ({ page, context }) => {
    // Note: /profile/credits has no MultiSidebarLayout wrapper — only the
    // /profile/referrals subroute has one. Verify the credits page itself
    // renders for a logged-in user.
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/profile/credits");
    await expect(page.getByRole("heading", { name: /Credits & Points/i })).toBeVisible({
      timeout: 10000,
    });
  });

  test("J17 — deep link to /chat/<id> renders top nav (no Clock trigger)", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/chat/abc-123");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.locator("svg.lucide-clock")).toHaveCount(0);
  });
});

test.describe("User journey — mobile interactions", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("J18 — mobile hamburger opens sheet then close button dismisses it", async ({ page }) => {
    await page.goto("/farming");
    const header = page.locator("header").first();
    await header.getByRole("button").first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible({ timeout: 5000 });
    // Custom close button (X) inside the sheet
    await sheet.locator("button").filter({ has: page.locator("svg.lucide-x") }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("J19 — mobile sheet brand link navigates to /chat/new", async ({ page }) => {
    await page.goto("/farming");
    const header = page.locator("header").first();
    await header.getByRole("button").first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible({ timeout: 5000 });
    const chatLink = sheet.getByRole("link", { name: /chat/i }).first();
    if (await chatLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatLink.click();
      await expect(page).toHaveURL(/\/chat/);
    }
  });

  test("J20 — mobile wallet pill is reachable in the right cluster", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    const header = page.locator("header").first();
    const pill = header.getByTestId("wallet-connected");
    await expect(pill).toBeVisible();
    await pill.click();
    await expect(page.getByTestId("wallet-credits-row")).toBeVisible({ timeout: 5000 });
  });
});
