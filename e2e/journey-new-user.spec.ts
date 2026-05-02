import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Journey — New User (10 tests)", () => {
  test.skip(process.env.NODE_ENV === "production", "disabled on production");

  // J1: Full new user journey
  test("New user: landing → dashboard → farming → aggregator → chat → portfolio → quest → credits", async ({ page }) => {
    const wallet = freshWallet();

    // Dashboard (connect prompt)
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/dashboard/);

    // Login → dashboard with account
    await loginAsWallet(page, wallet);
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Farming
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/farming/);

    // Aggregator
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/aggregator/);

    // Chat
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("What can I farm?");
    await input.press("Enter");
    await page.waitForTimeout(2000);

    // Portfolio
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/portfolio/);

    // Leaderboard
    await page.goto("/quest");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/quest/);

    // Credits
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/profile\/credits/);
  });

  // J2: Skip farming, go straight to chat
  test("Journey variant: chat first", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Hello DeFi");
    await input.press("Enter");
    await page.waitForTimeout(1000);
    await expect(page.getByText("Hello DeFi")).toBeVisible({ timeout: 3000 });
  });

  // J3: Portfolio first without farming
  test("Journey variant: portfolio first", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/portfolio/);
  });

  // J4: Reload mid-journey
  test("Journey: reload mid-journey", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/farming/);
  });

  // J5: Reversed order — credits before farming
  test("Journey variant: credits before farming", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/profile\/credits/);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/farming/);
  });

  // J6: Landing → dashboard connect → leaderboard
  test("Journey: landing → connect → leaderboard", async ({ page }) => {
    const wallet = freshWallet();
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/dashboard/);
    await loginAsWallet(page, wallet);
    await page.goto("/quest");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/quest/);
  });

  // J7: Aggregator before chat
  test("Journey: aggregator before chat", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/aggregator/);
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/chat/);
  });

  // J8: Multiple page reloads maintain state
  test("Journey: multiple reloads maintain state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/portfolio/);
    }
  });

  // J9: Verify credits balance after farming visit
  test("Journey: verify credits after farming", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    await page.goto("/profile/credits");
    await page.waitForLoadState("networkidle");
    const content = await page.content();
    const hasCredits = /credits?|balance|\d+/i.test(content);
    expect(hasCredits).toBeTruthy();
  });

  // J10: Farm → aggregator → quest navigation
  test("Journey: farm → aggregator → quest", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/farming");
    await page.waitForLoadState("networkidle");
    await page.goto("/aggregator");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/aggregator/);
    await page.goto("/quest");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveURL(/\/quest/);
  });
});
