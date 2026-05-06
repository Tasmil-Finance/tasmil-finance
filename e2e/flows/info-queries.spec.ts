import { expect, test } from "../fixtures/chat.fixture";

test.describe("Info Queries — Non-execution Requests", () => {
  test.describe.configure({ mode: "serial" });

  test("account balance query shows AccountInfoCard", async ({ chatPage }) => {
    await chatPage.sendMessage("Show me my account balance");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-account-info", "card-pool-info", "card-clarify"]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("info-balance");
  });

  test("pool info query shows pool details", async ({ chatPage }) => {
    await chatPage.sendMessage("What is the current APY for Blend USDC lending?");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect([
      "card-pool-info",
      "card-blend-pool-detail",
      "card-earn-discovery",
      "card-clarify",
    ]).toContain(type);
    await expect(card).toBeVisible();

    // Should contain APY data
    const text = await card.textContent();
    const hasApy = text?.includes("APY") || text?.includes("apy") || text?.includes("%");
    expect(hasApy).toBe(true);

    await chatPage.screenshotLastCard("info-pool-apy");
  });

  test("swap quote shows SwapQuoteCard", async ({ chatPage }) => {
    await chatPage.sendMessage("What's the exchange rate for XLM to USDC?");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-swap-quote", "card-pool-info", "card-account-info", "card-clarify"]).toContain(
      type
    );
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("info-swap-quote");
  });

  test("positions query shows user positions", async ({ chatPage }) => {
    await chatPage.sendMessage("Show me my DeFi positions across all protocols");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect([
      "card-account-info",
      "card-blend-positions",
      "card-aqua-positions",
      "card-pool-info",
      "card-clarify",
    ]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("info-positions");
  });

  test("Tasmil account strategy shows status", async ({ chatPage }) => {
    await chatPage.sendMessage("What is my Tasmil account status?");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-account-strategy", "card-strategy-preset", "card-clarify"]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("info-tasmil-status");
  });
});
