import { expect, test } from "../fixtures/chat.fixture";
import { assertToolCalled, getLatestTrace } from "../helpers/langsmith";
import { BLEND_TESTS } from "../helpers/test-prompts";

test.describe("Blend Lending Protocol", () => {
  test.describe.configure({ mode: "serial" });

  for (const [action, config] of Object.entries(BLEND_TESTS)) {
    test(`blend.${action}: ${config.prompt}`, async ({ chatPage }) => {
      await chatPage.sendMessage(config.prompt);
      await chatPage.waitForResponse();

      // Wait for the expected card OR an acceptable intermediate card
      const allAcceptable = [config.expectedCard, ...(config.acceptableCards ?? [])];
      const { type, locator: card } = await chatPage.waitForAnyCard();

      // Assert we got one of the acceptable card types
      expect(allAcceptable).toContain(type);

      // If we got a ClarifyCard, select the first option and wait for next card
      if (type === "card-clarify") {
        // Select the first suggestion (usually the top pool)
        const firstOption = card.locator("button").first();
        await firstOption.click();
        await chatPage.waitForResponse();
        const { type: nextType, locator: nextCard } = await chatPage.waitForAnyCard();
        expect(nextType).toBe(config.expectedCard);

        // Assert on final card
        if (config.assertions.amountVisible) {
          await expect(nextCard).toContainText(config.assertions.amountVisible);
        }
      } else {
        // Assert directly on the card
        if (config.assertions.amountVisible) {
          await expect(card).toContainText(config.assertions.amountVisible);
        }
        if (config.assertions.assetVisible) {
          await expect(card).toContainText(config.assertions.assetVisible);
        }
      }

      // LangSmith verification (optional, non-blocking)
      if (process.env.LANGSMITH_API_KEY) {
        const trace = await getLatestTrace(chatPage.threadId);
        if (trace && config.expectedTool) {
          expect(assertToolCalled(trace, config.expectedTool)).toBe(true);
        }
      }

      // Screenshot for visual review
      await chatPage.screenshotLastCard(`blend-${action}`);
    });
  }
});
