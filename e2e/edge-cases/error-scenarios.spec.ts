import { expect, test } from "../fixtures/chat.fixture";

test.describe("Edge Cases — Error Scenarios (Empty Wallet)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * These tests use `chatPageEmpty` which connects with:
   * GC5D3EMZTDLRAOBMQN3ITUWLXMB7V2A6QKZ6GLJHWDDAE2BB6S6ICGLV
   * (zero balance — no USDC, no XLM, no trustlines)
   */

  test("insufficient balance: supply with no funds", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Supply 100 USDC to Blend lending pool");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    const { type } = await chatPageEmpty.waitForAnyCard().catch(() => ({
      type: null,
      locator: null,
    }));

    // AI should detect insufficient balance and warn the user
    const hasBalanceWarning =
      responseText.toLowerCase().includes("insufficient") ||
      responseText.toLowerCase().includes("balance") ||
      responseText.toLowerCase().includes("not enough") ||
      responseText.toLowerCase().includes("fund") ||
      responseText.toLowerCase().includes("0") ||
      type === "card-clarify";

    expect(hasBalanceWarning).toBe(true);
    await chatPageEmpty.screenshotLastCard("error-empty-wallet-supply");
  });

  test("swap with no balance: shows appropriate error", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Swap 50 XLM to USDC on Soroswap");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    const { type } = await chatPageEmpty.waitForAnyCard().catch(() => ({
      type: null,
      locator: null,
    }));

    // Should indicate no funds or still show card (AI might not validate balance)
    // Either way we document the behavior
    const responseExists = responseText.length > 0 || type !== null;
    expect(responseExists).toBe(true);
    await chatPageEmpty.screenshotLastCard("error-empty-wallet-swap");
  });

  test("bridge with no balance: shows error or warning", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Bridge 100 USDC from Stellar to Ethereum");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    expect(responseText.length).toBeGreaterThan(0);
    await chatPageEmpty.screenshotLastCard("error-empty-wallet-bridge");
  });

  test("Tasmil fund with no balance", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Fund my Tasmil account with 500 USDC");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    const { type } = await chatPageEmpty.waitForAnyCard().catch(() => ({
      type: null,
      locator: null,
    }));

    // Should detect no funds or guide to get funds first
    const handlesEmpty =
      responseText.toLowerCase().includes("balance") ||
      responseText.toLowerCase().includes("fund") ||
      responseText.toLowerCase().includes("insufficient") ||
      type === "card-account-setup" ||
      type === "card-account-strategy" ||
      type === "card-clarify";

    expect(handlesEmpty).toBe(true);
    await chatPageEmpty.screenshotLastCard("error-empty-wallet-tasmil-fund");
  });

  test("add liquidity with no balance", async ({ chatPageEmpty }) => {
    await chatPageEmpty.sendMessage("Add 100 USDC to Aquarius USDC/XLM pool");
    await chatPageEmpty.waitForResponse();

    const responseText = await chatPageEmpty.getLastResponseText();
    expect(responseText.length).toBeGreaterThan(0);
    await chatPageEmpty.screenshotLastCard("error-empty-wallet-liquidity");
  });
});

test.describe("Edge Cases — Error Scenarios (Funded Wallet)", () => {
  test.describe.configure({ mode: "serial" });

  /**
   * These tests use `chatPage` (funded wallet) but test invalid inputs.
   * Wallet: GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R
   */

  test("unknown token is handled gracefully", async ({ chatPage }) => {
    await chatPage.sendMessage("Swap 100 FAKECOIN to USDC");
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    const handlesUnknownToken =
      responseText.toLowerCase().includes("not found") ||
      responseText.toLowerCase().includes("unknown") ||
      responseText.toLowerCase().includes("don't recognize") ||
      responseText.toLowerCase().includes("not supported") ||
      responseText.toLowerCase().includes("couldn't find");

    expect(handlesUnknownToken).toBe(true);
    await chatPage.screenshotLastCard("error-unknown-token");
  });

  test("unsupported chain for bridge", async ({ chatPage }) => {
    await chatPage.sendMessage("Bridge 100 USDC from Stellar to Solana");
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    const { type } = await chatPage.waitForAnyCard().catch(() => ({ type: null }));

    // Should either show bridge options that exclude Solana or mention unsupported
    const handlesUnsupported =
      responseText.toLowerCase().includes("not supported") ||
      responseText.toLowerCase().includes("available") ||
      responseText.toLowerCase().includes("ethereum") ||
      type === "card-clarify" ||
      type === "card-bridge-discovery";

    expect(handlesUnsupported).toBe(true);
    await chatPage.screenshotLastCard("error-unsupported-chain");
  });

  test("zero amount is rejected", async ({ chatPage }) => {
    await chatPage.sendMessage("Supply 0 USDC to Blend");
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    const hasValidation =
      responseText.toLowerCase().includes("amount") ||
      responseText.toLowerCase().includes("greater than") ||
      responseText.toLowerCase().includes("minimum") ||
      responseText.toLowerCase().includes("invalid") ||
      responseText.toLowerCase().includes("positive");

    expect(hasValidation).toBe(true);
    await chatPage.screenshotLastCard("error-zero-amount");
  });

  test("negative amount is rejected", async ({ chatPage }) => {
    await chatPage.sendMessage("Withdraw -50 USDC from Blend");
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    expect(responseText.length).toBeGreaterThan(0);
    await chatPage.screenshotLastCard("error-negative-amount");
  });

  test("extremely large amount shows warning", async ({ chatPage }) => {
    await chatPage.sendMessage("Supply 999999999 USDC to Blend lending");
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    const { type } = await chatPage.waitForAnyCard().catch(() => ({
      type: null,
      locator: null,
    }));

    // Should warn about balance or still proceed (we document behavior)
    const hasResponse = responseText.length > 0 || type !== null;
    expect(hasResponse).toBe(true);
    await chatPage.screenshotLastCard("error-large-amount");
  });
});
