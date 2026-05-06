import { expect, test } from "@playwright/test";

/**
 * Playground card UI tests — screenshot each card variant
 * at /playground/chat-cards with mock data.
 *
 * No AI backend needed — pure frontend rendering with hardcoded mock data.
 * Used to iterate on card UI/UX before running full E2E tests.
 */

const PLAYGROUND_URL = "/playground/chat-cards";

test.describe("Playground Chat Cards — Visual UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLAYGROUND_URL, { waitUntil: "networkidle" });

    // Dismiss tunnel/ngrok interstitial if present
    try {
      const btn = page.locator(
        'button:has-text("Continue"), button:has-text("Visit Site"), a:has-text("Visit Site")'
      );
      await btn.first().click({ timeout: 3_000 });
      await page.waitForLoadState("load");
    } catch {
      /* no warning */
    }

    // Wait for the page to render
    await page.waitForSelector("h1", { timeout: 10_000 });
  });

  test("Full playground page screenshot", async ({ page }) => {
    // Expand viewport to capture full page
    const height = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewportSize({ width: 1440, height: Math.min(height + 100, 8000) });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "e2e/test-results/cards/playground-full-page.png",
      fullPage: true,
    });
  });

  test("EarnDiscoveryCard — happy path (3 results)", async ({ page }) => {
    // Find the first EarnDiscoveryCard (happy path)
    const card = page.locator('[data-testid="card-earn-discovery"]').first();
    await expect(card).toBeVisible({ timeout: 5_000 });

    // Verify no NaN% in stats
    const statsText = await card.textContent();
    expect(statsText).not.toContain("NaN");

    // Verify count, APY, protocols visible
    expect(statsText).toContain("Count");
    expect(statsText).toContain("Best APY");
    expect(statsText).toContain("Protocols");

    // Verify pool items render
    expect(statsText).toContain("blend");
    expect(statsText).toContain("aquarius");

    await card.screenshot({ path: "e2e/test-results/cards/earn-discovery-happy.png" });
  });

  test("EarnDiscoveryCard — empty state", async ({ page }) => {
    // Second EarnDiscoveryCard is the empty one
    const card = page.locator('[data-testid="card-earn-discovery"]').nth(1);
    await expect(card).toBeVisible({ timeout: 5_000 });

    const text = await card.textContent();

    // Should show styled empty state, not "NaN%"
    expect(text).not.toContain("NaN");
    expect(text).toContain("No opportunities found");

    // Stats should show 0 / N/A gracefully
    expect(text).toContain("0");
    expect(text).toContain("N/A");

    await card.screenshot({ path: "e2e/test-results/cards/earn-discovery-empty.png" });
  });

  test("EarnDiscoveryCard — null APY edge case", async ({ page }) => {
    // Third EarnDiscoveryCard has null APY
    const card = page.locator('[data-testid="card-earn-discovery"]').nth(2);
    await expect(card).toBeVisible({ timeout: 5_000 });

    const text = await card.textContent();

    // Must NOT show NaN%
    expect(text).not.toContain("NaN");

    await card.screenshot({ path: "e2e/test-results/cards/earn-discovery-null-apy.png" });
  });

  test("AccountInfoCard — XLM native balance shows 'XLM' not '?'", async ({ page }) => {
    // Find balance cards — the XLM native one
    const cards = page.locator('[data-testid="card-account-info"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    // The second card should be "Token Balance" for XLM native
    const xlmCard = cards.nth(1);
    await expect(xlmCard).toBeVisible({ timeout: 5_000 });

    const text = await xlmCard.textContent();
    // Must show "XLM" not "?"
    expect(text).toContain("XLM");
    expect(text).not.toMatch(/Asset\s*\?/);
    expect(text).toContain("12.1545542");

    await xlmCard.screenshot({ path: "e2e/test-results/cards/account-balance-xlm.png" });
  });

  test("AccountInfoCard — USDC balance shows 'USDC' not '?'", async ({ page }) => {
    const cards = page.locator('[data-testid="card-account-info"]');

    // Third card should be USDC balance
    const usdcCard = cards.nth(2);
    await expect(usdcCard).toBeVisible({ timeout: 5_000 });

    const text = await usdcCard.textContent();
    expect(text).toContain("USDC");
    expect(text).not.toMatch(/Asset\s*\?/);

    await usdcCard.screenshot({ path: "e2e/test-results/cards/account-balance-usdc.png" });
  });

  test("AccountInfoCard — missing asset shows 'Unknown' not '?'", async ({ page }) => {
    const cards = page.locator('[data-testid="card-account-info"]');

    // Fourth card has missing asset name
    const unknownCard = cards.nth(3);
    await expect(unknownCard).toBeVisible({ timeout: 5_000 });

    const text = await unknownCard.textContent();
    // Should NOT show "?" — should show "Unknown" or some fallback
    expect(text).not.toMatch(/Asset\s*\?$/);

    await unknownCard.screenshot({ path: "e2e/test-results/cards/account-balance-unknown.png" });
  });

  test("BridgeDiscoveryCard — with quotes", async ({ page }) => {
    const card = page.locator('[data-testid="card-bridge-discovery"]').first();
    await expect(card).toBeVisible({ timeout: 5_000 });

    const text = await card.textContent();
    expect(text).toContain("allbridge");
    expect(text).toContain("Best");
    expect(text).toContain("ethereum");
    expect(text).toContain("stellar");

    await card.screenshot({ path: "e2e/test-results/cards/bridge-discovery-quotes.png" });
  });

  test("BridgeDiscoveryCard — empty state", async ({ page }) => {
    const card = page.locator('[data-testid="card-bridge-discovery"]').nth(1);
    await expect(card).toBeVisible({ timeout: 5_000 });

    const text = await card.textContent();
    expect(text).toContain("No direct bridge routes found");

    await card.screenshot({ path: "e2e/test-results/cards/bridge-discovery-empty.png" });
  });

  test("StrategyPresetCard — 3 presets", async ({ page }) => {
    const card = page.locator('[data-testid="card-strategy-preset"]').first();
    await expect(card).toBeVisible({ timeout: 5_000 });

    const text = await card.textContent();
    expect(text).toContain("SAFE");
    expect(text).toContain("BALANCED");
    expect(text).toContain("AGGRESSIVE");

    await card.screenshot({ path: "e2e/test-results/cards/strategy-presets.png" });
  });

  test("AccountSetupCard — deploy step", async ({ page }) => {
    const card = page.locator('[data-testid="card-account-setup"]').first();
    await expect(card).toBeVisible({ timeout: 5_000 });

    await card.screenshot({ path: "e2e/test-results/cards/account-setup-deploy.png" });
  });

  test("AccountSetupCard — active account", async ({ page }) => {
    const cards = page.locator('[data-testid="card-account-setup"]');
    const count = await cards.count();
    if (count > 1) {
      const activeCard = cards.nth(1);
      await expect(activeCard).toBeVisible({ timeout: 5_000 });
      await activeCard.screenshot({ path: "e2e/test-results/cards/account-setup-active.png" });
    }
  });
});
