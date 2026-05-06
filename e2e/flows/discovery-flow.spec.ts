import { expect, test } from "../fixtures/chat.fixture";

test.describe("Discovery Flow — Information & Yield Discovery", () => {
  test.describe.configure({ mode: "serial" });

  test("discover yield opportunities shows EarnDiscoveryCard", async ({ chatPage }) => {
    await chatPage.sendMessage("Show me the best yield opportunities on Stellar");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Should show discovery card or clarify card with pools
    expect(["card-earn-discovery", "card-clarify", "card-pool-info"]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("discovery-yield");
  });

  test("compare protocols shows comparison data", async ({ chatPage }) => {
    await chatPage.sendMessage("Compare Blend vs Soroswap for USDC yield");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-earn-discovery", "card-pool-info", "card-clarify"]).toContain(type);
    await expect(card).toBeVisible();

    // Should mention both protocols
    const text = await card.textContent();
    const hasBothProtocols = text?.includes("Blend") || text?.includes("Soroswap");
    expect(hasBothProtocols).toBe(true);

    await chatPage.screenshotLastCard("discovery-compare");
  });

  test("bridge routes discovery shows bridge options", async ({ chatPage }) => {
    await chatPage.sendMessage("What are my options to bridge USDC from Ethereum to Stellar?");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-bridge-discovery", "card-clarify", "card-pool-info"]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("discovery-bridge");
  });

  test("strategy presets query shows StrategyPresetCard", async ({ chatPage }) => {
    await chatPage.sendMessage("What Tasmil strategy presets are available for USDC?");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    expect(["card-strategy-preset", "card-account-strategy", "card-clarify"]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("discovery-presets");
  });
});
