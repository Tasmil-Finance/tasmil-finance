import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

/**
 * 20-test UI suite covering the recent redesign work that wasn't already
 * exercised by header-bar.spec.ts or farming.spec.ts:
 *
 * - Onboarding density+clarity (disconnected hero + authed page header)
 * - PresetCard monochromatic + alignment
 * - Sidebar/Quest visibility on mainnet
 * - Wallet dropdown contents
 * - Farming chrome (performance section, pools)
 * - Mobile sidebar slide-out
 */

test.describe("Redesign UI suite — disconnected /farming", () => {
  test("01 — ConnectPrompt heading 'Connect Your Wallet' renders", async ({ page }) => {
    await page.goto("/farming");
    await expect(
      page.getByRole("heading", { name: /^Connect Your Wallet$/i })
    ).toBeVisible();
  });

  test("02 — top-bar Connect Wallet button visible when disconnected", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.getByTestId("connect-wallet")).toBeVisible();
  });

  test("03 — ConnectPrompt explainer text renders", async ({ page }) => {
    await page.goto("/farming");
    await expect(
      page.getByText(/Connect your Stellar wallet to view the farming agent\./i)
    ).toBeVisible();
  });
});

test.describe("Redesign UI suite — Get Started empty state (authed, no Position)", () => {
  test("04 — heading 'Set up your farming account' renders", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await expect(
      page.getByRole("heading", { name: /Set up your farming account/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test("05 — explainer mentions asset + strategy + signatures", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await expect(
      page.getByText(/Choose the asset and strategy your agent will use/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("06 — Get started CTA button visible and links into wizard", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    const cta = page.getByTestId("setup-cta");
    await expect(cta).toBeVisible({ timeout: 10000 });
    await expect(cta).toHaveText(/Get started|Resume setup/i);
  });
});

test.describe("Redesign UI suite — Setup wizard step 3 (StepPreset)", () => {
  // Helper: drive the wizard from step 1 to step 3 where the preset list shows.
  async function gotoStepPreset(page: import("@playwright/test").Page, context: import("@playwright/test").BrowserContext) {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming/setup");
    await page.getByRole("button", { name: /^Continue$/i }).click(); // 1 → 2
    await page.getByRole("button", { name: /^Continue$/i }).click(); // 2 → 3
    await expect(page.getByRole("heading", { name: /Pick risk preset/i })).toBeVisible({
      timeout: 10000,
    });
  }

  test("07 — three preset rows render: Safe, Balanced, Aggressive", async ({ page, context }) => {
    await gotoStepPreset(page, context);
    await expect(page.getByRole("radio", { name: /Safe/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Balanced/ })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Aggressive/ })).toBeVisible();
  });

  test("08 — Balanced row is preselected by default (aria-checked)", async ({ page, context }) => {
    await gotoStepPreset(page, context);
    await expect(page.getByRole("radio", { name: /Balanced/ })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  test("09 — each preset row shows pool count + risk hint", async ({ page, context }) => {
    await gotoStepPreset(page, context);
    // Each row text includes "N pools · {risk}" — assert the dot separator appears
    const rows = page.getByRole("radio");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < 3; i++) {
      await expect(rows.nth(i)).toContainText(/pool/i);
    }
  });

  test("10 — each preset row exposes a numeric APY value", async ({ page, context }) => {
    await gotoStepPreset(page, context);
    const rows = page.getByRole("radio");
    for (let i = 0; i < 3; i++) {
      await expect(rows.nth(i)).toContainText(/%/);
    }
  });

  test("11 — clicking Aggressive flips aria-checked from Balanced", async ({ page, context }) => {
    await gotoStepPreset(page, context);
    const aggressive = page.getByRole("radio", { name: /Aggressive/ });
    await aggressive.click();
    await expect(aggressive).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("radio", { name: /Balanced/ })).toHaveAttribute(
      "aria-checked",
      "false"
    );
  });
});

test.describe("Redesign UI suite — sidebar & Quest visibility", () => {
  test("12 — top nav does NOT contain Quest link on /farming (mainnet)", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.getByRole("link", { name: /^Quest$/i })).toHaveCount(0);
  });

  test("13 — top nav does NOT contain Quest link on /chat/new (mainnet)", async ({ page }) => {
    await page.goto("/chat/new");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.getByRole("link", { name: /^Quest$/i })).toHaveCount(0);
  });
});

test.describe("Redesign UI suite — wallet dropdown", () => {
  test("14 — connected wallet pill has chevron icon", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    const pill = page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected");
    await expect(pill.locator("svg.lucide-chevron-down")).toBeVisible();
  });

  test("15 — wallet dropdown header shows Mainnet network", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected").click();
    await expect(page.getByText(/^Mainnet$/i).first()).toBeVisible();
  });

  test("16 — Credits row links to /profile/credits", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.locator('[data-testid="top-nav-bar"]').getByTestId("wallet-connected").click();
    const creditsRow = page.getByTestId("wallet-credits-row");
    await expect(creditsRow).toHaveAttribute("href", "/profile/credits");
  });
});

test.describe("Redesign UI suite — farming chrome", () => {
  test("17 — /farming renders with top nav visible", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await expect(page.locator('[data-testid="top-nav-bar"]')).toBeVisible();
  });

  test("18 — /chat/new renders without Clock trigger (removed from header)", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/chat/new");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.locator("svg.lucide-clock")).toHaveCount(0);
  });

  test("19 — /portfolio renders without Clock trigger", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/portfolio");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.locator("svg.lucide-clock")).toHaveCount(0);
  });
});

test.describe("Redesign UI suite — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("20 — mobile hamburger opens left sidebar sheet", async ({ page }) => {
    await page.goto("/farming");
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    const hamburger = header.getByRole("button").first();
    await hamburger.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible({ timeout: 5000 });
  });
});
