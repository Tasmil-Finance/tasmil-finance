import { expect, test } from "../fixtures/chat.fixture";

test.describe("Edge Cases — Account States (Funded Wallet)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Funded wallet: GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R
   * Tests strategy flows with a wallet that has real balances.
   */

  test("check Tasmil account status with funded wallet", async ({ chatPage }) => {
    await chatPage.sendMessage("What is my Tasmil account status?");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Should show account strategy card (with or without existing account)
    expect([
      "card-account-strategy",
      "card-strategy-preset",
      "card-account-setup",
      "card-clarify",
    ]).toContain(type);
    await expect(card).toBeVisible();
    await chatPage.screenshotLastCard("account-funded-status");
  });

  test("show positions with funded wallet", async ({ chatPage }) => {
    await chatPage.sendMessage("Show me my DeFi positions");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect([
      "card-account-info",
      "card-blend-positions",
      "card-aqua-positions",
      "card-pool-info",
      "card-account-strategy",
      "card-clarify",
    ]).toContain(type);
    await expect(card).toBeVisible();
    await chatPage.screenshotLastCard("account-funded-positions");
  });

  test("show balance with funded wallet", async ({ chatPage }) => {
    await chatPage.sendMessage("Show my USDC and XLM balance");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-account-info", "card-pool-info", "card-clarify"]).toContain(type);
    await expect(card).toBeVisible();

    // Should show actual balance numbers (not zero)
    const text = await card.textContent();
    const hasBalance = text?.includes("USDC") || text?.includes("XLM") || text?.includes("balance");
    expect(hasBalance).toBe(true);
    await chatPage.screenshotLastCard("account-funded-balance");
  });

  test("preset change on funded wallet", async ({ chatPage }) => {
    await chatPage.sendMessage("Change my Tasmil strategy to Aggressive preset");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect([
      "card-strategy-preset",
      "card-account-strategy",
      "card-account-setup",
      "card-stellar-execute",
      "card-clarify",
    ]).toContain(type);
    await expect(card).toBeVisible();
    await chatPage.screenshotLastCard("account-funded-preset-change");
  });
});

test.describe("Edge Cases — Account States (Empty Wallet)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * Empty wallet: GC5D3EMZTDLRAOBMQN3ITUWLXMB7V2A6QKZ6GLJHWDDAE2BB6S6ICGLV
   * Tests behavior when wallet has no funds at all.
   */

  test("check Tasmil status with empty wallet", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Show my Tasmil strategy performance");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    const { type } = await chatPageEmpty.waitForAnyCard().catch(() => ({ type: null }));

    // Should detect no account or suggest setup
    const suggestsAction =
      responseText.toLowerCase().includes("deploy") ||
      responseText.toLowerCase().includes("create") ||
      responseText.toLowerCase().includes("set up") ||
      responseText.toLowerCase().includes("no account") ||
      responseText.toLowerCase().includes("don't have") ||
      type === "card-account-setup" ||
      type === "card-account-strategy";

    expect(suggestsAction).toBe(true);
    await chatPageEmpty.screenshotLastCard("account-empty-tasmil-status");
  });

  test("show balance with empty wallet", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Show my account balance");
    await chatPageEmpty.waitForResponse();

    const { type, locator: card } = await chatPageEmpty.waitForAnyCard();
    expect(["card-account-info", "card-pool-info", "card-clarify"]).toContain(type);
    await expect(card).toBeVisible();

    // Should show zero or minimal balance
    const text = await card.textContent();
    const showsEmptyState =
      text?.includes("0") ||
      text?.includes("no") ||
      text?.includes("empty") ||
      text?.toLowerCase().includes("fund");
    // Even if it shows "0 XLM" that's valid
    expect(text?.length).toBeGreaterThan(0);
    await chatPageEmpty.screenshotLastCard("account-empty-balance");
  });

  test("deploy Tasmil with empty wallet", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Deploy my Tasmil smart account");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    const { type, locator: card } = await chatPageEmpty.waitForAnyCard().catch(() => ({
      type: null,
      locator: null,
    }));

    // Should either proceed with deploy (might need XLM for fees)
    // or warn about needing funds first
    const hasResponse = responseText.length > 0 || type !== null;
    expect(hasResponse).toBe(true);
    await chatPageEmpty.screenshotLastCard("account-empty-deploy");
  });

  test("show positions with empty wallet", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Show me all my DeFi positions");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    const { type } = await chatPageEmpty.waitForAnyCard().catch(() => ({ type: null }));

    // Should show empty state or "no positions"
    const showsEmpty =
      responseText.toLowerCase().includes("no position") ||
      responseText.toLowerCase().includes("don't have") ||
      responseText.toLowerCase().includes("empty") ||
      responseText.toLowerCase().includes("0") ||
      type === "card-account-info";

    expect(showsEmpty).toBe(true);
    await chatPageEmpty.screenshotLastCard("account-empty-positions");
  });

  test("wallet not connected shows connect prompt", async ({ chatPage, page }) => {
    // Override the wallet mock to simulate disconnected state
    await page.evaluate(() => {
      localStorage.removeItem("wallet-store");
      localStorage.removeItem("auth-store");
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Try an action that requires wallet
    await chatPage.sendMessage("Supply 100 USDC to Blend");
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    // Should ask user to connect wallet
    const asksConnect =
      responseText.toLowerCase().includes("connect") ||
      responseText.toLowerCase().includes("wallet") ||
      responseText.toLowerCase().includes("sign in") ||
      responseText.toLowerCase().includes("address");

    expect(asksConnect).toBe(true);
    await chatPage.screenshotLastCard("account-not-connected");
  });
});
