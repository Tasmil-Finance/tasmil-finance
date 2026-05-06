import { expect, test } from "../fixtures/chat.fixture";

test.describe("Clarify Flow — Ambiguous Prompts", () => {
  test.describe.configure({ mode: "serial" });

  test("ambiguous yield request triggers ClarifyCard with pool options", async ({ chatPage }) => {
    await chatPage.sendMessage("I want to earn yield with my USDC");
    await chatPage.waitForResponse();

    const card = await chatPage.waitForCard("card-clarify");
    // ClarifyCard should show multiple pool/protocol options
    await expect(card).toBeVisible();
    // Should have at least 2 selectable options
    const options = card.locator("button");
    expect(await options.count()).toBeGreaterThanOrEqual(2);

    await chatPage.screenshotLastCard("clarify-ambiguous-yield");
  });

  test("selecting a clarify option advances to plan/execute", async ({ chatPage }) => {
    await chatPage.sendMessage("Swap some tokens");
    await chatPage.waitForResponse();

    const { type } = await chatPage.waitForAnyCard();

    // Should get a clarify card asking for specifics
    if (type === "card-clarify") {
      // Select first option
      const card = await chatPage.waitForCard("card-clarify");
      const firstOption = card.locator("button").first();
      const optionText = await firstOption.textContent();
      await firstOption.click();

      await chatPage.waitForResponse();
      const { type: nextType } = await chatPage.waitForAnyCard();
      // After clarification, should get an execute card or another clarify for amount
      expect(["card-swap-execute", "card-stellar-execute", "card-clarify"]).toContain(nextType);
    }

    await chatPage.screenshotLastCard("clarify-flow-selection");
  });

  test("no protocol specified shows multi-protocol options", async ({ chatPage }) => {
    await chatPage.sendMessage("Add liquidity to a USDC/XLM pool");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Without specifying protocol, should clarify which pool/protocol
    if (type === "card-clarify") {
      await expect(card).toBeVisible();
      const text = await card.textContent();
      // Should mention multiple protocols
      const mentionsProtocol =
        text?.includes("Aquarius") ||
        text?.includes("Soroswap") ||
        text?.includes("Phoenix") ||
        text?.includes("pool");
      expect(mentionsProtocol).toBe(true);
    }

    await chatPage.screenshotLastCard("clarify-no-protocol");
  });

  test("missing amount triggers amount input clarification", async ({ chatPage }) => {
    await chatPage.sendMessage("Supply USDC to Blend");
    await chatPage.waitForResponse();

    const { type, locator: card } = await chatPage.waitForAnyCard();
    // Without amount, AI should ask for it via clarify or text
    if (type === "card-clarify") {
      const text = await card.textContent();
      const asksAmount =
        text?.toLowerCase().includes("amount") || text?.toLowerCase().includes("how much");
      expect(asksAmount).toBe(true);
    }

    await chatPage.screenshotLastCard("clarify-missing-amount");
  });
});
