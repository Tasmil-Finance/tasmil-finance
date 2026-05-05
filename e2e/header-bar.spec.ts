import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Header bar — Morpho-style strip (desktop)", () => {
  test("brand text uses shimmer animation (gradient + animate-shimmer-text)", async ({ page }) => {
    await page.goto("/farming");
    const brand = page.locator('[data-testid="top-nav-bar"]').getByText("Tasmil");
    await expect(brand).toBeVisible();
    const className = (await brand.getAttribute("class")) ?? "";
    expect(className).toMatch(/animate-shimmer-text/);
    expect(className).toMatch(/bg-clip-text/);
  });

  test("nav links are text-only — no svg icons", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    const navLinks = topNav.getByRole("link").filter({ hasText: /chat|farming|aggregator|portfolio/i });
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      await expect(link.locator("svg")).toHaveCount(0);
    }
  });

  test("active nav link has foreground color, inactive has muted", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    const farmingLink = topNav.getByRole("link", { name: /^farming$/i });
    const chatLink = topNav.getByRole("link", { name: /^chat$/i });
    await expect(farmingLink).toHaveAttribute("data-active", "true");
    await expect(chatLink).toHaveAttribute("data-active", "false");
    const farmingClass = (await farmingLink.getAttribute("class")) ?? "";
    const chatClass = (await chatLink.getAttribute("class")) ?? "";
    expect(farmingClass).toMatch(/text-foreground/);
    expect(chatClass).toMatch(/text-muted-foreground/);
  });

  test("CreditsPill is NOT rendered in the top bar", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.locator('[data-testid="credits-pill"]')).toHaveCount(0);
  });

  test("Connect Wallet button visible when disconnected", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.getByTestId("connect-wallet")).toBeVisible();
  });
});

test.describe("Header bar — Clock chat-history trigger (desktop)", () => {
  test("Clock trigger does NOT render on /portfolio", async ({ page }) => {
    await page.goto("/portfolio");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav).toBeVisible();
    await expect(topNav.locator('button:has(svg.lucide-clock)')).toHaveCount(0);
  });

  test("Clock trigger does NOT render on /farming", async ({ page }) => {
    await page.goto("/farming");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.locator('button:has(svg.lucide-clock)')).toHaveCount(0);
  });

  test("Clock trigger does NOT render on /aggregator", async ({ page }) => {
    await page.goto("/aggregator");
    const topNav = page.locator('[data-testid="top-nav-bar"]');
    await expect(topNav.locator('button:has(svg.lucide-clock)')).toHaveCount(0);
  });
});

test.describe("Header bar — connected wallet pill + dropdown", () => {
  test("connected pill shows displayAddress + opens dropdown with Credits row", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    const topNav = page.locator('[data-testid="top-nav-bar"]');
    const pill = topNav.getByTestId("wallet-connected");
    await expect(pill).toBeVisible();
    await expect(pill).toContainText(/^G/);

    await pill.click();
    const creditsRow = page.getByTestId("wallet-credits-row");
    await expect(creditsRow).toBeVisible();
    await expect(creditsRow).toContainText(/credits/i);
  });
});

test.describe("Header bar — mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile header has hamburger + brand + wallet, no page title", async ({ page }) => {
    await page.goto("/farming");
    const header = page.locator("header").first();
    await expect(header).toBeVisible();
    await expect(header.getByRole("button").first()).toBeVisible();
    await expect(header.getByText("Tasmil")).toBeVisible();
    await expect(header.locator("h1")).toHaveCount(0);
    await expect(header.getByTestId("connect-wallet")).toBeVisible();
  });

  test("mobile brand text has shimmer animation classes", async ({ page }) => {
    await page.goto("/farming");
    const brand = page.locator("header").first().getByText("Tasmil");
    const className = (await brand.getAttribute("class")) ?? "";
    expect(className).toMatch(/animate-shimmer-text/);
    expect(className).toMatch(/bg-clip-text/);
  });
});
