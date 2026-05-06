import { expect, test } from "../fixtures/chat.fixture";

test.describe("Multi-Step Flows", () => {
  test.describe.configure({ mode: "serial" });

  test("cross-chain yield: bridge then deposit", async ({ chatPage }) => {
    await chatPage.sendMessage(
      "I have 500 USDC on Ethereum. Help me bridge it to Stellar and deposit into Blend lending"
    );
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Multi-step should trigger plan preview or clarify first
    expect([
      "card-plan-preview",
      "card-clarify",
      "card-bridge-execute",
      "card-stellar-execute",
    ]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("multistep-bridge-deposit");
  });

  test("swap then supply flow", async ({ chatPage }) => {
    await chatPage.sendMessage("Swap 100 XLM to USDC then supply it to Blend");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Should show plan preview with multiple steps or start executing step 1
    expect([
      "card-plan-preview",
      "card-swap-execute",
      "card-stellar-execute",
      "card-clarify",
    ]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("multistep-swap-supply");
  });

  test("full Tasmil onboarding: deploy -> setup -> fund", async ({ chatPage }) => {
    await chatPage.sendMessage("I want to start using Tasmil with the Balanced strategy for USDC");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Should show account setup card (step 1: deploy) or strategy card
    expect([
      "card-account-setup",
      "card-strategy-preset",
      "card-account-strategy",
      "card-clarify",
      "card-stellar-execute",
    ]).toContain(type);
    await expect(card).toBeVisible();

    await chatPage.screenshotLastCard("multistep-tasmil-onboarding");
  });
});
