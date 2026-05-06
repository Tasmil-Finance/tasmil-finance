import { expect, test } from "../fixtures/chat.fixture";
import { assertToolCalled, getLatestTrace } from "../helpers/langsmith";
import { BLEND_BACKSTOP_TESTS } from "../helpers/test-prompts";

test.describe("Blend Backstop Protocol", () => {
  test.describe.configure({ mode: "serial" });

  for (const [action, config] of Object.entries(BLEND_BACKSTOP_TESTS)) {
    test(`blend-backstop.${action}: ${config.prompt}`, async ({ chatPage }) => {
      await chatPage.sendMessage(config.prompt);
      await chatPage.waitForResponse();

      const allAcceptable = [config.expectedCard, ...(config.acceptableCards ?? [])];
      const { type, locator: card } = await chatPage.waitForAnyCard();

      expect(allAcceptable).toContain(type);

      if (type === "card-clarify") {
        const firstOption = card.locator("button").first();
        await firstOption.click();
        await chatPage.waitForResponse();
        const { type: nextType, locator: nextCard } = await chatPage.waitForAnyCard();
        expect(nextType).toBe(config.expectedCard);

        if (config.assertions.textContains) {
          for (const text of config.assertions.textContains) {
            await expect(nextCard).toContainText(text, { ignoreCase: true });
          }
        }
      } else {
        if (config.assertions.textContains) {
          for (const text of config.assertions.textContains) {
            await expect(card).toContainText(text, { ignoreCase: true });
          }
        }
      }

      if (process.env.LANGSMITH_API_KEY) {
        const trace = await getLatestTrace(chatPage.threadId);
        if (trace && config.expectedTool) {
          expect(assertToolCalled(trace, config.expectedTool)).toBe(true);
        }
      }

      await chatPage.screenshotLastCard(`blend-backstop-${action}`);
    });
  }
});
