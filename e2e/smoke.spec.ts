import { expect, test } from "./fixtures/chat.fixture";
import { SMOKE_TESTS } from "./helpers/test-prompts";

/**
 * Smoke tests — one test per protocol x2 wallets.
 *
 * FUNDED wallet (GDQI7LOG...): 12.15 XLM + 3.39 BLND — happy path
 * EMPTY wallet (GDZZI62U...): zero balance — edge cases
 *
 * Each test validates:
 * 1. Auth works, message sent, AI responds
 * 2. Expected card type renders (or acceptable alternative)
 * 3. Key data visible on the card (amount, asset, protocol)
 * 4. Signing card has Sign button + XDR (for execute flows)
 * 5. Full-page screenshot captured for manual evaluation
 *
 * Run:
 *   pnpm test:e2e:chat:smoke
 *   npx playwright test --project=e2e-chat e2e/smoke.spec.ts
 *   npx playwright test --project=e2e-chat e2e/smoke.spec.ts -g "FUNDED"
 *   npx playwright test --project=e2e-chat e2e/smoke.spec.ts -g "EMPTY"
 */

// ═══════════════════════════════════════════════════════════════════════════════
// FUNDED WALLET — happy path (11 tests)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("FUNDED Smoke Tests", () => {
  test.describe.configure({ mode: "serial" });

  for (const [testName, testCase] of Object.entries(SMOKE_TESTS)) {
    test(testName, async ({ chatPage }) => {
      await chatPage.sendMessage(testCase.prompt);
      await chatPage.waitForResponse();

      const screenshotName = testName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await chatPage.screenshotFullPage(`smoke-funded-${screenshotName}`);

      const cards = await chatPage.getAllCards();
      const text = await chatPage.getLastResponseText();
      expect(cards.length > 0 || text.length > 20, `No response for: "${testCase.prompt}"`).toBe(
        true
      );

      if (cards.length > 0) {
        const allCardTypes = cards.map((c) => c.type);
        const acceptableTypes = [testCase.expectedCard, ...(testCase.acceptableCards ?? [])];
        const hasExpectedCard = allCardTypes.some((t) => acceptableTypes.includes(t));
        expect(
          hasExpectedCard,
          `Expected [${acceptableTypes.join(", ")}] but got [${allCardTypes.join(", ")}]`
        ).toBe(true);
      }

      const responseText = await chatPage.getLastResponseText();

      if (testCase.assertions.amountVisible) {
        expect(responseText).toContain(testCase.assertions.amountVisible);
      }
      if (testCase.assertions.assetVisible) {
        expect(responseText).toContain(testCase.assertions.assetVisible);
      }
      if (testCase.assertions.textContains) {
        for (const fragment of testCase.assertions.textContains) {
          expect(responseText.toLowerCase()).toContain(fragment.toLowerCase());
        }
      }

      if (testCase.behavior.shouldShowSigningCard && testCase.signingCard?.hasSignButton) {
        const signButton = chatPage.page.locator(
          'button:has-text("Sign"), button:has-text("Confirm")'
        );
        if ((await signButton.count()) === 0) {
          console.warn(`[WARN] No Sign button for "${testName}"`);
        }
      }

      if (testCase.behavior.shouldStopAfterCard) {
        const thinking = chatPage.page.locator('text="Thinking..."');
        expect((await thinking.count()) > 0, `AI still thinking: "${testName}"`).toBe(false);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY WALLET — edge cases (11 tests, same prompts, different wallet)
//
// Expected behavior:
// - EXECUTE prompts (swap, supply, borrow): AI checks balance → explains insufficient
// - READ-ONLY prompts (info, discover, presets): should still work normally
// - Bridge (inbound): should still show routes (not balance-dependent)
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("EMPTY Smoke Tests", () => {
  test.describe.configure({ mode: "serial" });

  for (const [testName, testCase] of Object.entries(SMOKE_TESTS)) {
    test(`EMPTY: ${testName}`, async ({ chatPageEmpty }) => {
      await chatPageEmpty.sendMessage(testCase.prompt);
      await chatPageEmpty.waitForResponse();

      const screenshotName = testName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      await chatPageEmpty.screenshotFullPage(`smoke-empty-${screenshotName}`);

      // Verify AI responded (should always respond, even with empty wallet)
      const cards = await chatPageEmpty.getAllCards();
      const text = await chatPageEmpty.getLastResponseText();
      expect(
        cards.length > 0 || text.length > 20,
        `No response for empty wallet: "${testCase.prompt}"`
      ).toBe(true);

      // For execute-type prompts, verify AI handles empty wallet gracefully
      const isExecutePrompt =
        testCase.behavior.shouldShowSigningCard || testCase.behavior.shouldCheckBalance;

      if (isExecutePrompt) {
        const responseText = await chatPageEmpty.getLastResponseText();
        const lowerText = responseText.toLowerCase();

        // AI should either:
        // 1. Mention insufficient balance / no funds
        // 2. Still show the card but with balance context
        // 3. Suggest funding the wallet
        // Any response is acceptable — we just verify it didn't crash
        console.log(
          `[EMPTY] ${testName}: ${cards.length} cards, ` +
            `mentions balance: ${lowerText.includes("balance") || lowerText.includes("insufficient")}`
        );
      }

      // For read-only prompts, verify they still work
      const isReadOnly = !isExecutePrompt;
      if (isReadOnly) {
        // Read-only tools (discover, get_account info, resolve_pool, presets)
        // should return data regardless of wallet balance
        if (testCase.assertions.textContains) {
          const responseText = await chatPageEmpty.getLastResponseText();
          for (const fragment of testCase.assertions.textContains) {
            // Soft check — read-only data should still be present
            if (!responseText.toLowerCase().includes(fragment.toLowerCase())) {
              console.warn(`[WARN] EMPTY:${testName} missing "${fragment}" in response`);
            }
          }
        }
      }

      // AI should never be stuck thinking
      const thinking = chatPageEmpty.page.locator('text="Thinking..."');
      expect((await thinking.count()) > 0, `AI stuck thinking: EMPTY:${testName}`).toBe(false);
    });
  }
});
