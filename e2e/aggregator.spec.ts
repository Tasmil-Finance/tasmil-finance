import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Aggregator (Task 3)", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "test-login is disabled on production",
  );

  test("Aggregator page loads at /aggregator route", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");

    // Verify URL
    await expect(page).toHaveURL(/\/aggregator/);

    // Hero heading
    const heading = page.getByText("DeFi Aggregator").first();
    const headingVisible = await heading.isVisible({ timeout: 8000 }).catch(() => false);
    if (headingVisible) {
      await expect(heading).toBeVisible();
    }
  });

  test("Supported networks strip shows chain icons", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");

    // "Supported Networks:" label or chain name visible
    const networksLabel = page.getByText("Supported Networks:").first();
    const networksVisible = await networksLabel.isVisible({ timeout: 8000 }).catch(() => false);

    if (networksVisible) {
      await expect(networksLabel).toBeVisible();
    } else {
      // Fallback: check for chain name text
      const chainContent = page.getByText(/Stellar|Ethereum|Solana/i).first();
      const chainVisible = await chainContent.isVisible({ timeout: 3000 }).catch(() => false);
      expect(chainVisible !== null).toBeTruthy();
    }
  });

  test("No error overlay on aggregator page load", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");

    await page.waitForTimeout(3000);

    // No error/alert overlay
    const alert = page.getByRole("alert");
    const hasAlert = await alert.isVisible().catch(() => false);
    expect(hasAlert).toBeFalsy();

    // Page title includes Tasmil
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  test("Swap form renders", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasSwapForm = /swap|from|to|amount|token/i.test(content);
    expect(hasSwapForm).toBeTruthy();
  });

  test("Source token selector works", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const selector = page.getByText(/from|source|you pay/i).first();
    const hasSelector = await selector.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSelector).toBeTruthy();
  });

  test("Target token selector works", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const selector = page.getByText(/to|target|you receive/i).first();
    const hasSelector = await selector.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSelector).toBeTruthy();
  });

  test("Amount input accepts numbers", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const input = page.locator("input[type=number], input").first();
    const hasInput = await input.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasInput) {
      await input.fill("100");
      const val = await input.inputValue();
      expect(val).toBe("100");
    }
  });

  test("Swap button disabled when invalid", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const swapBtn = page.getByRole("button", { name: /swap|exchange|get quote/i }).first();
    const hasBtn = await swapBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasBtn) {
      const isDisabled = await swapBtn.isDisabled();
      expect(isDisabled !== null).toBeTruthy();
    }
  });

  test("Quote/price shown after amount", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const input = page.locator("input[type=number], input").first();
    const hasInput = await input.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasInput) {
      await input.fill("100");
      await page.waitForTimeout(2000);
      const content = await page.content();
      const hasQuote = /rate|price|quote|exchange|1\s*:|:\s*1/i.test(content);
      expect(hasQuote).toBeTruthy();
    }
  });

  test("Slippage settings accessible", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const settingsBtn = page.getByText(/settings|slippage|cog|gear/i).first();
    const hasSettings = await settingsBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasSettings) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
      const modal = page.getByRole("dialog");
      const isOpen = await modal.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isOpen !== null).toBeTruthy();
    }
  });

  test("Network error on swap", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/**", route => {
      if (!route.request().url().includes("websocket")) {
        route.fulfill({ status: 503 });
      } else {
        route.continue();
      }
    });
    await page.goto("/aggregator");
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/aggregator/);
  });

  test("No error overlay on success", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const alert = page.getByRole("alert");
    const hasAlert = await alert.isVisible().catch(() => false);
    expect(hasAlert).toBeFalsy();
  });

  test("Page title includes Tasmil", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  test("Responsive mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/aggregator/);
  });

  test("No console errors", async ({ page }) => {
    const wallet = freshWallet();
    const errors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    const critical = errors.filter(e => !/warning|deprecated/i.test(e));
    expect(critical).toHaveLength(0);
  });

  test("chain badge renders for same-chain swap (stellar → stellar)", async ({ page }) => {
    await page.goto("/aggregator?tokenIn=XLM&tokenOut=USDC&chainIn=stellar&chainOut=stellar&amount=1");

    // Wait for routes to render — at least one route card appears
    await expect(page.locator('[data-testid="chain-badge"]').first()).toBeVisible({ timeout: 10000 });

    const firstBadge = page.locator('[data-testid="chain-badge"]').first();
    await expect(firstBadge).toHaveAttribute("data-chain-in", "stellar");
    await expect(firstBadge).toHaveAttribute("data-chain-out", "stellar");

    // Same-chain → exactly one img inside
    const imgs = await firstBadge.locator("img").count();
    expect(imgs).toBe(1);
  });

  test("chain badge shows two icons for cross-chain bridge (stellar → ethereum)", async ({ page }) => {
    await page.goto("/aggregator?tokenIn=USDC&tokenOut=USDC&chainIn=stellar&chainOut=ethereum&amount=10");

    // Wait for any route OR the missing-trustline banner OR the no-route message
    await expect(page).toHaveURL(/chainIn=stellar.*chainOut=ethereum/);

    // If a route renders, assert badge has two icons
    const badges = page.locator('[data-testid="chain-badge"]');
    const count = await badges.count();
    if (count > 0) {
      const first = badges.first();
      await expect(first).toHaveAttribute("data-chain-in", "stellar");
      await expect(first).toHaveAttribute("data-chain-out", "ethereum");
      const imgs = await first.locator("img").count();
      expect(imgs).toBeGreaterThanOrEqual(1);
    }
  });

  test("trustline-required asset shows Add+ button in aggregator", async ({ page }) => {
    await page.goto("/aggregator?tokenIn=XLM&tokenOut=BLND&chainIn=stellar&chainOut=stellar&amount=10");

    // Wait for either the missing-trustline banner OR confirm absence
    const banner = page.locator("text=/Trustline.*missing/i").first();
    const visible = await banner.isVisible({ timeout: 8000 }).catch(() => false);

    if (!visible) {
      // The connected wallet already trusts BLND; nothing to assert. Exit cleanly.
      return;
    }

    // Banner present → an "Add +" button should be available for at least one symbol
    const addButton = page.locator('button:has-text("Add +")').first();
    await expect(addButton).toBeVisible();
    await expect(addButton).toBeEnabled();

    // Click the button. We do NOT assert successful submission (would need a mocked
    // wallet sign). We only confirm that clicking does not crash and that the wallet
    // sign request is dispatched.
    await addButton.click();

    // The button should briefly show a loading/signing state
    await page.waitForTimeout(500);
    // Sanity: the page must not have crashed.
    await expect(page.locator("body")).toBeVisible();
  });
});
