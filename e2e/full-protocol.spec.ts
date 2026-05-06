import { expect, test } from "./fixtures/chat.fixture";
import type { ProtocolTestCase } from "./helpers/test-prompts";
import { ALL_PROTOCOL_TESTS } from "./helpers/test-prompts";

/**
 * Full Protocol Tests — all protocol actions x2 wallets.
 *
 * FUNDED wallet (GDQI7LOG...): 12.15 XLM + 3.39 BLND
 * EMPTY wallet  (GDZZI62U...): zero balance
 *
 * Total: 47 funded + 47 empty = 94 tests
 *
 * Run:
 *   npx playwright test --project=e2e-chat e2e/full-protocol.spec.ts
 *   npx playwright test --project=e2e-chat e2e/full-protocol.spec.ts -g "FUNDED: blend"
 *   npx playwright test --project=e2e-chat e2e/full-protocol.spec.ts -g "EMPTY: soroswap"
 */

// ─── Shared assertion helpers ──────────────────────────────────────────────

async function runFundedTest(
  chatPage: import("./page-objects/chat.page").ChatPage,
  testCase: ProtocolTestCase,
  label: string
) {
  await chatPage.sendMessage(testCase.prompt);
  await chatPage.waitForResponse();

  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await chatPage.screenshotFullPage(`full-funded-${slug}`);

  const cards = await chatPage.getAllCards();
  const text = await chatPage.getLastResponseText();
  expect(cards.length > 0 || text.length > 20, `No response: "${testCase.prompt}"`).toBe(true);

  // Card type check
  if (cards.length > 0) {
    const allCardTypes = cards.map((c) => c.type);
    const acceptableTypes = [testCase.expectedCard, ...(testCase.acceptableCards ?? [])];
    const hasExpectedCard = allCardTypes.some((t) => acceptableTypes.includes(t));
    expect(
      hasExpectedCard,
      `Expected [${acceptableTypes.join(", ")}] but got [${allCardTypes.join(", ")}]`
    ).toBe(true);
  }

  // Content assertions
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

  // Sign button check
  if (testCase.behavior.shouldShowSigningCard && testCase.signingCard?.hasSignButton) {
    const signButton = chatPage.page.locator('button:has-text("Sign"), button:has-text("Confirm")');
    if ((await signButton.count()) === 0) {
      console.warn(`[WARN] No Sign button: ${label}`);
    }
  }

  // AI stopped
  if (testCase.behavior.shouldStopAfterCard) {
    const thinking = chatPage.page.locator('text="Thinking..."');
    expect((await thinking.count()) > 0, `AI stuck: ${label}`).toBe(false);
  }
}

async function runEmptyTest(
  chatPageEmpty: import("./page-objects/chat.page").ChatPage,
  testCase: ProtocolTestCase,
  label: string
) {
  await chatPageEmpty.sendMessage(testCase.prompt);
  await chatPageEmpty.waitForResponse();

  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await chatPageEmpty.screenshotFullPage(`full-empty-${slug}`);

  // Must always respond
  const cards = await chatPageEmpty.getAllCards();
  const text = await chatPageEmpty.getLastResponseText();
  expect(cards.length > 0 || text.length > 20, `No response (empty): "${testCase.prompt}"`).toBe(
    true
  );

  const isExecutePrompt =
    testCase.behavior.shouldShowSigningCard || testCase.behavior.shouldCheckBalance;

  if (isExecutePrompt) {
    // For execute actions: AI should gracefully handle empty wallet
    // (mention balance, suggest funding, or show relevant info)
    const responseText = await chatPageEmpty.getLastResponseText();
    const lower = responseText.toLowerCase();
    console.log(
      `[EMPTY] ${label}: cards=${cards.length}, ` +
        `balance-mentioned=${lower.includes("balance") || lower.includes("insufficient") || lower.includes("0")}`
    );
  } else {
    // For read-only actions: should still return data
    if (testCase.assertions.textContains) {
      const responseText = await chatPageEmpty.getLastResponseText();
      for (const fragment of testCase.assertions.textContains) {
        if (!responseText.toLowerCase().includes(fragment.toLowerCase())) {
          console.warn(`[WARN] EMPTY ${label}: missing "${fragment}"`);
        }
      }
    }
  }

  // Never stuck
  const thinking = chatPageEmpty.page.locator('text="Thinking..."');
  expect((await thinking.count()) > 0, `AI stuck: EMPTY ${label}`).toBe(false);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNDED WALLET — all protocols
// ═══════════════════════════════════════════════════════════════════════════════

for (const [suiteName, suite] of Object.entries(ALL_PROTOCOL_TESTS)) {
  test.describe(`FUNDED: ${suiteName}`, () => {
    test.describe.configure({ mode: "serial" });

    for (const [actionName, testCase] of Object.entries(suite)) {
      test(`${suiteName}: ${actionName}`, async ({ chatPage }) => {
        await runFundedTest(chatPage, testCase, `${suiteName}-${actionName}`);
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMPTY WALLET — all protocols (same prompts, zero-balance wallet)
// ═══════════════════════════════════════════════════════════════════════════════

for (const [suiteName, suite] of Object.entries(ALL_PROTOCOL_TESTS)) {
  test.describe(`EMPTY: ${suiteName}`, () => {
    test.describe.configure({ mode: "serial" });

    for (const [actionName, testCase] of Object.entries(suite)) {
      test(`${suiteName}: ${actionName}`, async ({ chatPageEmpty }) => {
        await runEmptyTest(chatPageEmpty, testCase, `${suiteName}-${actionName}`);
      });
    }
  });
}
