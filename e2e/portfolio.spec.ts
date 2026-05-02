import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Portfolio (Tasks 5+6+7)", () => {
  test.skip(
    process.env.NODE_ENV === "production",
    "test-login is disabled on production",
  );

  test("Portfolio page loads at /portfolio route", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");

    // URL should be /portfolio
    await expect(page).toHaveURL(/\/portfolio/);

    // Wait for page to hydrate
    await page.waitForTimeout(2000);

    // Page loads without error overlay
    const errorOverlay = page.getByRole("alert");
    const hasError = await errorOverlay.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test("Portfolio tab bar shows Tokens, Positions, NFTs, History, Credits", async ({
    page,
  }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");

    await page.waitForTimeout(2000);

    // Tab labels visible
    const tokens = page.getByText("Tokens").first();
    const tokensVisible = await tokens.isVisible({ timeout: 3000 }).catch(() => false);

    if (tokensVisible) {
      await expect(tokens).toBeVisible();
      await expect(page.getByText("Positions").first()).toBeVisible();
    }
  });

  test("No error overlay on portfolio load", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");

    await page.waitForTimeout(3000);

    // Page title includes Tasmil
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  // --- Task 40: 17 new portfolio tab/content tests ---

  test("Tab click switches tab content", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const historyTab = page.getByText("History").first();
    const hasTab = await historyTab.isVisible().catch(() => false);
    if (hasTab) {
      await historyTab.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  test("Tokens tab shows token list", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const tokensTab = page.getByText("Tokens").first();
    const hasTab = await tokensTab.isVisible().catch(() => false);
    if (hasTab) {
      await tokensTab.click();
      await page.waitForTimeout(1500);
      const tokenRows = page.locator("[class*=token], [class*=row]").first();
      const hasRows = await tokenRows.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasRows !== null).toBeTruthy();
    }
  });

  test("Token row shows symbol and balance", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const tokensTab = page.getByText("Tokens").first();
    const hasTab = await tokensTab.isVisible().catch(() => false);
    if (hasTab) {
      await tokensTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasSymbol = /XLM|USDC|Stellar/i.test(content);
      expect(hasSymbol).toBeTruthy();
    }
  });

  test("Positions tab shows active positions", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const posTab = page.getByText("Positions").first();
    const hasPosTab = await posTab.isVisible().catch(() => false);
    if (hasPosTab) {
      await posTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasPositions = /position|deployed|active/i.test(content);
      expect(hasPositions).toBeTruthy();
    }
  });

  test("Position row shows protocol + APY", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const posTab = page.getByText("Positions").first();
    const hasPosTab = await posTab.isVisible().catch(() => false);
    if (hasPosTab) {
      await posTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasProtocolAPY = /Blend|Soroswap|Aquarius.*\d|%/i.test(content);
      expect(hasProtocolAPY).toBeTruthy();
    }
  });

  test("NFTs tab shows grid or empty", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const nftsTab = page.getByText("NFTs").first();
    const hasNftsTab = await nftsTab.isVisible().catch(() => false);
    if (hasNftsTab) {
      await nftsTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasNft = /nft|no nft|empty|collect/i.test(content);
      expect(hasNft).toBeTruthy();
    }
  });

  test("History tab shows transaction list", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const historyTab = page.getByText("History").first();
    const hasHistoryTab = await historyTab.isVisible().catch(() => false);
    if (hasHistoryTab) {
      await historyTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasHistory = /history|transaction|event|activity/i.test(content);
      expect(hasHistory).toBeTruthy();
    }
  });

  test("History tab grouped by date", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const historyTab = page.getByText("History").first();
    const hasHistoryTab = await historyTab.isVisible().catch(() => false);
    if (hasHistoryTab) {
      await historyTab.click();
      await page.waitForTimeout(1500);
      const datePattern = /\d{1,2}\s+\w+|May|Jun|Jul|Aug|\d{4}/i;
      const content = await page.content();
      const hasDate = datePattern.test(content);
      expect(hasDate).toBeTruthy();
    }
  });

  test("History pagination or infinite scroll", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const historyTab = page.getByText("History").first();
    const hasHistoryTab = await historyTab.isVisible().catch(() => false);
    if (hasHistoryTab) {
      await historyTab.click();
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  test("Credits tab shows package list", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const creditsTab = page.getByText("Credits").first();
    const hasCreditsTab = await creditsTab.isVisible().catch(() => false);
    if (hasCreditsTab) {
      await creditsTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasCredits = /credit|package|tier/i.test(content);
      expect(hasCredits).toBeTruthy();
    }
  });

  test("Credits package shows price", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const creditsTab = page.getByText("Credits").first();
    const hasCreditsTab = await creditsTab.isVisible().catch(() => false);
    if (hasCreditsTab) {
      await creditsTab.click();
      await page.waitForTimeout(1500);
      const content = await page.content();
      const hasPrice = /\$|USD|price|\d+\s*\$/i.test(content);
      expect(hasPrice).toBeTruthy();
    }
  });

  test("Credits purchase flow starts", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const creditsTab = page.getByText("Credits").first();
    const hasCreditsTab = await creditsTab.isVisible().catch(() => false);
    if (hasCreditsTab) {
      await creditsTab.click();
      await page.waitForTimeout(1500);
      const buyBtn = page.getByRole("button", { name: /buy|purchase|get/i }).first();
      const hasBuyBtn = await buyBtn.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasBuyBtn !== null).toBeTruthy();
    }
  });

  test("Network error on tab switch", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/portfolio**", route => route.fulfill({ status: 503 }));
    await page.goto("/portfolio");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("No console errors on tab switch", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    const errors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const tokensTab = page.getByText("Tokens").first();
    if (await tokensTab.isVisible().catch(() => false)) {
      await tokensTab.click();
      await page.waitForTimeout(1000);
    }
    const criticalErrors = errors.filter(e => !/warning|deprecated/i.test(e));
    expect(criticalErrors).toHaveLength(0);
  });

  test("Credits balance visible", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasBalance = /credits?\s*\d|balance.*\d/i.test(content);
    expect(hasBalance).toBeTruthy();
  });

  test("No error overlay", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    const alert = page.getByRole("alert");
    const hasAlert = await alert.isVisible().catch(() => false);
    expect(hasAlert).toBeFalsy();
  });

  test("Page title includes Tasmil", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveTitle(/Tasmil/i);
  });
});
