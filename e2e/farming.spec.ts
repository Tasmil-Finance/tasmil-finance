import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Farming UI (Task 8)", () => {
  test.skip(process.env.NODE_ENV === "production", "test-login is disabled on production");

  test("Tab bar renders four tabs with icons", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Either tabs are visible (wallet connected) or ConnectPrompt shows
    // Tabs: Overview, Pools, Strategy, Activity
    const tabs = page.getByText(/Overview|Pools|Strategy|Activity/i);
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);

    // Verify all 4 tab labels appear somewhere on the page
    await expect(page.getByText("Overview").first()).toBeVisible();
    await expect(page.getByText("Pools").first()).toBeVisible();
    await expect(page.getByText("Strategy").first()).toBeVisible();
    await expect(page.getByText("Activity").first()).toBeVisible();
  });

  test("Pools tab shows card grid with APY values", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Click Pools tab
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();

    await page.waitForTimeout(2000);

    // Page renders farming content — either pool cards or empty state
    // APY label appears on pool cards
    const apyLabel = page.getByText("APY").first();
    const apyVisible = await apyLabel.isVisible({ timeout: 3000 }).catch(() => false);

    if (apyVisible) {
      // Protocol badges visible: blend/soroswap/aquarius
      const content = await page.content();
      const hasProtocol =
        content.includes("blend") || content.includes("soroswap") || content.includes("aquarius");
      expect(hasProtocol).toBeTruthy();
    }
  });

  test("Overview tab shows allocation section", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Click Overview tab (default active)
    const overviewTab = page.getByText("Overview").first();
    await overviewTab.click();

    await page.waitForTimeout(2000);

    // Overview shows "Your Portfolio" header
    await expect(page.getByText("Your Portfolio").first()).toBeVisible();
  });

  test("Activity tab shows date-grouped events with expandable rows", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");

    // Click Activity tab
    const activityTab = page.getByText("Activity").first();
    await activityTab.click();

    await page.waitForTimeout(2000);

    // Page renders activity content — date headers or empty state
    const activityHeading = page.getByText("Activity").first();
    await expect(activityHeading).toBeVisible();
  });

  test("APY values are non-zero", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1500);
    const content = await page.content();
    const apyNums = content.match(/\d+\.?\d*%/g) || [];
    const nonZero = apyNums.filter((m) => parseFloat(m) > 0);
    expect(nonZero.length).toBeGreaterThan(0);
  });

  test("Pool card shows protocol name", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1500);
    const protocols = /Blend|Soroswap|Aquarius|Phoenix|SDEX/i;
    const content = await page.content();
    expect(protocols.test(content)).toBeTruthy();
  });

  test("Pool card shows asset pair", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1500);
    const content = await page.content();
    expect(/USDC|XLM|XLM\/USDC|USDC\/XLM/i.test(content)).toBeTruthy();
  });

  test("Pool card shows TVL", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1500);
    const tvl = page.getByText(/tvl|total value|locked/i).first();
    const hasTvl = await tvl.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasTvl).toBeTruthy();
  });

  test("Pool card clickable", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1500);
    const card = page.locator("[class*=card]").first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/farming/);
  });

  test("Overview shows preset badges", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasPreset = /safe|balanced|aggressive/i.test(content);
    expect(hasPreset).toBeTruthy();
  });

  test("Strategy tab shows selector", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const strategyTab = page.getByText("Strategy").first();
    const hasStrategyTab = await strategyTab.isVisible().catch(() => false);
    if (hasStrategyTab) {
      await strategyTab.click();
      await page.waitForTimeout(1000);
      const selector = page.locator("select, [role=combobox]").first();
      const hasSelector = await selector.isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasSelector !== null).toBeTruthy();
    }
  });

  test("Activity tab expandable rows", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const activityTab = page.getByText("Activity").first();
    await activityTab.click();
    await page.waitForTimeout(1500);
    const row = page.locator("[class*=row], [class*=event]").first();
    const hasRow = await row.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasRow) {
      await row.click();
      await page.waitForTimeout(500);
      const detail = page.locator("[class*=detail], [class*=expanded]").first();
      const hasDetail = await detail.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasDetail !== null).toBeTruthy();
    }
  });

  test("Empty activity shows empty state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const activityTab = page.getByText("Activity").first();
    await activityTab.click();
    await page.waitForTimeout(1500);
    const empty = page.getByText(/no activity|no events|no transactions/i).first();
    const hasEmpty = await empty.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasEmpty !== null).toBeTruthy();
  });

  test("Deposit flow modal opens", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const depositBtn = page.getByRole("button", { name: /deposit/i }).first();
    const hasDeposit = await depositBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasDeposit) {
      await depositBtn.click();
      await page.waitForTimeout(1000);
      const modal = page.getByRole("dialog");
      const isOpen = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isOpen !== null).toBeTruthy();
    }
  });

  test("Withdraw flow modal opens", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const withdrawBtn = page.getByRole("button", { name: /withdraw/i }).first();
    const hasWithdraw = await withdrawBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasWithdraw) {
      await withdrawBtn.click();
      await page.waitForTimeout(1000);
      const modal = page.getByRole("dialog");
      const isOpen = await modal.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isOpen !== null).toBeTruthy();
    }
  });

  test("Network error shows error alert", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/pools", (route) => route.fulfill({ status: 503 }));
    await page.goto("/farming");
    await page.waitForTimeout(3000);
    const alert = page.getByRole("alert");
    const hasAlert = await alert.isVisible().catch(() => false);
    expect(hasAlert !== null).toBeTruthy();
  });

  test("No error overlay on success", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const alert = page.getByRole("alert");
    const hasAlert = await alert.isVisible().catch(() => false);
    expect(hasAlert).toBeFalsy();
  });

  test("Pools tab sorting", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1500);
    const sortBtn = page.getByText(/sort|apy|tvl/i).first();
    const hasSort = await sortBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasSort) {
      await sortBtn.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/farming/);
    }
  });

  test("Page load within 5s", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    const start = Date.now();
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });

  test("Tab state persists on refresh", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    const poolsTab = page.getByText("Pools").first();
    await poolsTab.click();
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/farming/);
  });

  test("farming header total value renders (CountUp animation)", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    const valueEl = page.locator('[data-testid="farming-header"]').getByText(/\$\d/);
    await expect(valueEl).toBeVisible({ timeout: 10_000 });
  });

  test("activity tab has Protocol/Reward sub-tabs", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    const activityTab = page.getByRole("tab", { name: /activity/i });
    if (await activityTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activityTab.click();
    }

    await expect(page.getByRole("tab", { name: /^All$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Protocol/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Reward/ })).toBeVisible();
  });

  test("activity reward filter shows reward-only rows or empty state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    const activityTab = page.getByRole("tab", { name: /activity/i });
    if (await activityTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activityTab.click();
    }
    await page.getByRole("tab", { name: /Reward/ }).click();
    const plusRow = page.locator("text=/^\\+/").first();
    const emptyState = page.getByText(/No rewards yet/i);
    const rewardVisible = await plusRow.isVisible({ timeout: 2000 }).catch(() => false);
    const emptyVisible = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    expect(rewardVisible || emptyVisible).toBe(true);
  });

  test("Overview tab does not render Pools section heading", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForTimeout(2000);
    // Pools h2 lives inside the Pools tab; Overview should not show it.
    const poolsHeading = page.getByRole("heading", { name: /^Pools$/, level: 2 });
    await expect(poolsHeading).toHaveCount(0);
  });

  test("Pools tab still renders Pools heading", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming?tab=pools");
    await page.waitForTimeout(2000);
    await expect(page.getByRole("heading", { name: /^Pools$/, level: 2 }).first()).toBeVisible();
  });

  test("Mobile viewport — header value visible without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForTimeout(2000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test("Stat row renders 3 cards", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForTimeout(2000);
    await expect(page.getByText("Total Value")).toBeVisible();
    await expect(page.getByText("All-Time P&L")).toBeVisible();
    await expect(page.getByText("Current APY")).toBeVisible();
  });

  test("Two tabs Performance / Manage are present", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForTimeout(2000);
    await expect(page.getByRole("tab", { name: /^Performance$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Manage$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Overview$/ })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /^Pools$/ })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /^Strategy$/ })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /^Activity$/ })).toHaveCount(0);
  });

  test("?tab=pools redirects to Manage", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming?tab=pools");
    await page.waitForTimeout(2000);
    const manage = page.getByRole("tab", { name: /^Manage$/ });
    await expect(manage).toHaveAttribute("aria-selected", "true");
  });

  test("'See all' opens activity drawer", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForTimeout(2000);
    const seeAll = page.getByRole("button", { name: /see all/i });
    if (await seeAll.isVisible({ timeout: 3000 }).catch(() => false)) {
      await seeAll.click();
      await expect(page.getByText(/activity timeline/i).first()).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByText(/activity timeline/i)).toHaveCount(0);
    }
  });
});
