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

test.describe("Redesign UI suite — onboarding (authed)", () => {
  test("04 — page header 'Set up your farming account' renders", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await expect(page.getByText(/Set up your farming account/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("05 — page explainer paragraph renders", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await expect(
      page.getByText(/lets the agent rebalance your funds across yield pools/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("06 — authed page-level trust chips visible", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await expect(page.getByText(/Self-custody — your keys, your funds/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("Redesign UI suite — PresetCard", () => {
  test("07 — three preset cards render: Safe, Balanced, Aggressive", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.waitForTimeout(3000);
    await expect(page.getByRole("heading", { name: /^Safe$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Balanced$/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^Aggressive$/i })).toBeVisible();
  });

  test("08 — Balanced card has 'Recommended' badge", async ({ page, context }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.waitForTimeout(3000);
    const badge = page.getByText(/^Recommended$/i).first();
    await expect(badge).toBeVisible();
  });

  test("09 — three tone pills present (Low risk / Diversified / High yield)", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.waitForTimeout(3000);
    await expect(page.getByText(/Low risk/i).first()).toBeVisible();
    await expect(page.getByText(/Diversified/i).first()).toBeVisible();
    await expect(page.getByText(/High yield/i).first()).toBeVisible();
  });

  test("10 — preset cards bottom-align (risk pill row within 4px across cards)", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.waitForTimeout(3000);

    const cards = page.locator("button").filter({
      has: page.getByRole("heading", { name: /^(Safe|Balanced|Aggressive)$/i }),
    });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const bottoms: number[] = [];
    for (let i = 0; i < 3; i++) {
      const box = await cards.nth(i).boundingBox();
      if (box) bottoms.push(box.y + box.height);
    }
    expect(bottoms.length).toBe(3);
    const maxDelta = Math.max(...bottoms) - Math.min(...bottoms);
    expect(maxDelta).toBeLessThanOrEqual(4);
  });

  test("11 — clicking a preset card switches selected state (ring class)", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/farming");
    await page.waitForTimeout(3000);

    const aggressive = page
      .locator("button")
      .filter({ has: page.getByRole("heading", { name: /^Aggressive$/i }) })
      .first();
    await aggressive.click();
    const cls = (await aggressive.getAttribute("class")) ?? "";
    expect(cls).toMatch(/ring-2|ring-primary|border-primary/);
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

  test("18 — /chat/new renders with top nav and Clock trigger present", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    await loginAsWallet(page, freshWallet());
    await page.goto("/chat/new");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.locator("svg.lucide-clock")).toHaveCount(1);
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
