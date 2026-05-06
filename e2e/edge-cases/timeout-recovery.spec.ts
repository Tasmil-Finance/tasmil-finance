import { expect, test } from "../fixtures/chat.fixture";

test.describe("Edge Cases — Timeout & Recovery", () => {
  test.describe.configure({ mode: "serial" });

  test("long-running query still returns response within timeout", async ({ chatPage }) => {
    // Complex query that might take longer to process
    await chatPage.sendMessage(
      "Compare all available yield pools across Blend, Soroswap, Aquarius, and Phoenix for USDC, sorted by risk-adjusted APY"
    );

    // Wait up to 90s for response
    await chatPage.waitForResponse(90_000);

    const responseText = await chatPage.getLastResponseText();
    expect(responseText.length).toBeGreaterThan(0);

    await chatPage.screenshotLastCard("timeout-complex-query");
  });

  test("rapid sequential messages don't break the UI", async ({ chatPage, page }) => {
    // Send multiple messages quickly
    await chatPage.sendMessage("What is USDC?");
    // Don't wait for response, send another
    await page.waitForTimeout(1000);
    await chatPage.sendMessage("What is XLM?");

    // Wait for the last response
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    // Should have responded to at least one message
    expect(responseText.length).toBeGreaterThan(0);

    await chatPage.screenshotLastCard("timeout-rapid-messages");
  });

  test("empty message doesn't crash", async ({ chatPage, page }) => {
    // Try to send empty (should be prevented by UI)
    await chatPage.messageInput.fill("");
    await chatPage.messageInput.press("Enter");

    // Page should still be functional
    await page.waitForTimeout(2000);
    const isStillResponsive = await chatPage.messageInput.isVisible();
    expect(isStillResponsive).toBe(true);
  });

  test("very long message is handled gracefully", async ({ chatPage }) => {
    const longMessage = "Swap USDC to XLM ".repeat(100);
    await chatPage.sendMessage(longMessage);
    await chatPage.waitForResponse();

    const responseText = await chatPage.getLastResponseText();
    // Should either respond normally or indicate message is too long
    expect(responseText.length).toBeGreaterThan(0);

    await chatPage.screenshotLastCard("timeout-long-message");
  });
});
