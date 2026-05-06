import { expect, test } from "../fixtures/chat.fixture";
import { assertToolCalled, getLatestTrace } from "../helpers/langsmith";
import { SDEX_TESTS } from "../helpers/test-prompts";

test.describe("SDEX (Stellar Classic DEX)", () => {
  test.describe.configure({ mode: "serial" });

  for (const [action, config] of Object.entries(SDEX_TESTS)) {
    test(`sdex.${action}: ${config.prompt}`, async ({ chatPage }) => {
      await chatPage.sendMessage(config.prompt);
      await chatPage.waitForResponse();

      const allAcceptable = [config.expectedCard, ...(config.acceptableCards ?? [])];
      const { type, locator: card } = await chatPage.waitForAnyCard();

      expect(allAcceptable).toContain(type);

      if (type === "card-clarify") {
        const firstOption = card.locator("button").first();
        await firstOption.click();
        await chatPage.waitForResponse();
        const { locator: nextCard } = await chatPage.waitForAnyCard();
        if (config.assertions.amountVisible) {
          await expect(nextCard).toContainText(config.assertions.amountVisible);
        }
      } else {
        if (config.assertions.amountVisible) {
          await expect(card).toContainText(config.assertions.amountVisible);
        }
        if (config.assertions.assetVisible) {
          await expect(card).toContainText(config.assertions.assetVisible);
        }
      }

      if (process.env.LANGSMITH_API_KEY) {
        const trace = await getLatestTrace(chatPage.threadId);
        if (trace && config.expectedTool) {
          expect(assertToolCalled(trace, config.expectedTool)).toBe(true);
        }
      }

      await chatPage.screenshotLastCard(`sdex-${action}`);
    });
  }
});
