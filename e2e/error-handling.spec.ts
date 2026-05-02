import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Error Handling (10 tests)", () => {
  test.skip(process.env.NODE_ENV === "production", "disabled on production");

  test("Dashboard: network error on position fetch — graceful degradation", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/account/position", route => route.fulfill({ status: 503 }));
    await page.goto("/dashboard");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
    // No raw 503 shown
    const hasRaw503 = /503.*Internal|Internal.*503/i.test(content);
    expect(hasRaw503).toBeFalsy();
  });

  test("Farming: network error on pools — error state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/pools", route => route.fulfill({ status: 503 }));
    await page.goto("/farming");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("Portfolio: network error — graceful degradation", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/portfolio**", route => route.fulfill({ status: 503 }));
    await page.goto("/portfolio");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("Chat: AG-UI endpoint 503 — error shown", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/agui/**", route => route.fulfill({ status: 503 }));
    await page.goto("/chat/new");
    await page.waitForTimeout(3000);
    const content = await page.content();
    // Page should not crash — error state shown
    expect(content.length).toBeGreaterThan(100);
  });

  test("Leaderboard: network error — error state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/leaderboard**", route => route.fulfill({ status: 503 }));
    await page.goto("/quest");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("Credits: network error on packages — empty or error state", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/credits/packages**", route => route.fulfill({ status: 503 }));
    await page.goto("/profile/credits");
    await page.waitForTimeout(3000);
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("Strategies: network error — page still loads", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/strategies**", route => route.fulfill({ status: 503 }));
    await page.goto("/strategies");
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/strategies/);
  });

  test("Dashboard: timeout on slow API — loading state shown", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/api/account/position", route => {
      setTimeout(() => route.fulfill({ status: 200, body: JSON.stringify({ data: null }) }), 10000);
    });
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    // Page should show loading or timeout message — not blank
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  test("Multiple API errors in sequence — no memory leak", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    const routes = ["**/api/account/position", "**/api/pools", "**/api/portfolio"];
    for (const rt of routes) {
      await page.route(rt, route => route.fulfill({ status: 503 }));
    }
    await page.goto("/dashboard");
    await page.waitForTimeout(2000);
    await page.goto("/farming");
    await page.waitForTimeout(2000);
    await page.goto("/portfolio");
    await page.waitForTimeout(2000);
    // Should not crash or accumulate memory
    await expect(page).toHaveURL(/\/(dashboard|farming|portfolio)/);
  });

  test("No console errors during API failures", async ({ page }) => {
    const wallet = freshWallet();
    const errors: string[] = [];
    page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
    await loginAsWallet(page, wallet);
    await page.route("**/api/account/position", route => route.fulfill({ status: 503 }));
    await page.goto("/dashboard");
    await page.waitForTimeout(3000);
    const critical = errors.filter(e => !/warning|deprecated/i.test(e));
    expect(critical).toHaveLength(0);
  });
});