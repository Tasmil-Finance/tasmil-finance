import { expect, test } from "./fixtures/defi-fixtures";

test.describe("Blend Agent - Basic Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/agents");
    await page.waitForLoadState("networkidle");
  });

  test("should display Blend agent card", async ({ page }) => {
    const blendCard = page.locator('[data-testid="agent-card-blend_agent"]');
    await expect(blendCard).toBeVisible();
    await expect(blendCard).toContainText("Blend");
  });

  test("should open Blend agent chat", async ({ page, mockWallet }) => {
    await mockWallet.connect();
    
    await page.click('[data-testid="agent-card-blend_agent"]');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-header"]')).toContainText("Blend");
  });

  test("should show available pools", async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.click('[data-testid="agent-card-blend_agent"]');
    
    await page.fill('[data-testid="chat-input"]', "Show me available Blend pools");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="pool-list"]')).toBeVisible();
  });

  test("should display pool APY information", async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.click('[data-testid="agent-card-blend_agent"]');
    
    await page.fill('[data-testid="chat-input"]', "What's the APY for USDC pool?");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/APY|apy|%/);
  });

  test("should show user positions", async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.click('[data-testid="agent-card-blend_agent"]');
    
    await page.fill('[data-testid="chat-input"]', "Show my Blend positions");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Blend Agent - Complex Cases", () => {
  test.beforeEach(async ({ page, mockWallet }) => {
    await page.goto("/agents");
    await mockWallet.connect();
    await page.click('[data-testid="agent-card-blend_agent"]');
    await page.waitForLoadState("networkidle");
  });

  test("should execute supply transaction", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Supply 100 USDC to Blend");
    await page.click('[data-testid="send-message"]');
    
    // Wait for agent to process
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 15000 });
    
    // Should show transaction confirmation
    await expect(page.locator('[data-testid="transaction-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="supply-amount"]')).toContainText("100");
    await expect(page.locator('[data-testid="supply-asset"]')).toContainText("USDC");
    
    // Confirm transaction
    await page.click('[data-testid="confirm-transaction"]');
    await expect(page.locator('[data-testid="transaction-success"]')).toBeVisible({ timeout: 20000 });
  });

  test("should execute borrow transaction", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Borrow 50 USDC from Blend");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 15000 });
    
    // Should show borrow preview with health factor
    await expect(page.locator('[data-testid="transaction-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="borrow-amount"]')).toContainText("50");
    await expect(page.locator('[data-testid="health-factor"]')).toBeVisible();
    
    await page.click('[data-testid="confirm-transaction"]');
    await expect(page.locator('[data-testid="transaction-success"]')).toBeVisible({ timeout: 20000 });
  });

  test("should compare multiple pools", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Compare USDC and XLM pools on Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 15000 });
    
    // Should show comparison table
    await expect(page.locator('[data-testid="pool-comparison"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-usdc"]')).toBeVisible();
    await expect(page.locator('[data-testid="pool-xlm"]')).toBeVisible();
  });

  test("should calculate optimal strategy", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "What's the best strategy for 1000 USDC on Blend?");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 15000 });
    
    // Should provide strategy recommendation
    await expect(response).toContainText(/strategy|recommend|suggest/i);
    await expect(response).toContainText(/APY|yield|return/i);
  });

  test("should handle multi-step workflow", async ({ page }) => {
    // Step 1: Check pools
    await page.fill('[data-testid="chat-input"]', "Show me USDC pools");
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 10000 });
    
    // Step 2: Ask for details
    await page.fill('[data-testid="chat-input"]', "What's the APY for the first one?");
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="agent-response"]').nth(1)).toBeVisible({ timeout: 10000 });
    
    // Step 3: Execute supply
    await page.fill('[data-testid="chat-input"]', "Supply 50 USDC to it");
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="transaction-preview"]')).toBeVisible({ timeout: 15000 });
  });

  test("should handle cross-chain scenario", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "I have USDC on Ethereum, want to earn on Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 15000 });
    
    // Should suggest bridge + supply workflow
    await expect(response).toContainText(/bridge|transfer/i);
    await expect(response).toContainText(/Blend|supply/i);
  });
});

test.describe("Blend Agent - Edge Cases", () => {
  test.beforeEach(async ({ page, mockWallet }) => {
    await page.goto("/agents");
    await mockWallet.connect();
    await page.click('[data-testid="agent-card-blend_agent"]');
    await page.waitForLoadState("networkidle");
  });

  test("should handle insufficient balance", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Supply 1000000 USDC to Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/insufficient|balance|not enough/i);
  });

  test("should handle invalid asset", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Supply INVALID_TOKEN to Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/not supported|invalid|not available/i);
  });

  test("should handle zero amount", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Supply 0 USDC to Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/amount|greater than zero|invalid/i);
  });

  test("should handle negative amount", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Supply -50 USDC to Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/invalid|positive|greater than/i);
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Mock network failure
    await page.route("**/api/blend/**", (route) => {
      route.abort("failed");
    });
    
    await page.fill('[data-testid="chat-input"]', "Show me Blend pools");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/error|failed|try again/i);
  });

  test("should handle timeout scenarios", async ({ page }) => {
    // Mock slow response
    await page.route("**/api/blend/**", async (route) => {
      await new Promise(resolve => setTimeout(resolve, 30000));
      route.continue();
    });
    
    await page.fill('[data-testid="chat-input"]', "Show me Blend pools");
    await page.click('[data-testid="send-message"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="agent-loading"]')).toBeVisible();
    
    // Should eventually timeout with error
    await expect(page.locator('[data-testid="agent-error"]')).toBeVisible({ timeout: 35000 });
  });

  test("should handle wallet disconnection during transaction", async ({ page, mockWallet }) => {
    await page.fill('[data-testid="chat-input"]', "Supply 100 USDC to Blend");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="transaction-preview"]')).toBeVisible({ timeout: 15000 });
    
    // Disconnect wallet before confirming
    await mockWallet.disconnect();
    
    await page.click('[data-testid="confirm-transaction"]');
    await expect(page.locator('[data-testid="wallet-error"]')).toContainText(/connect|wallet/i);
  });

  test("should handle concurrent requests", async ({ page }) => {
    // Send multiple requests quickly
    await page.fill('[data-testid="chat-input"]', "Show me USDC pool");
    await page.click('[data-testid="send-message"]');
    
    await page.fill('[data-testid="chat-input"]', "Show me XLM pool");
    await page.click('[data-testid="send-message"]');
    
    await page.fill('[data-testid="chat-input"]', "Show me BTC pool");
    await page.click('[data-testid="send-message"]');
    
    // All responses should appear
    await expect(page.locator('[data-testid="agent-response"]').nth(0)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="agent-response"]').nth(1)).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="agent-response"]').nth(2)).toBeVisible({ timeout: 15000 });
  });

  test("should handle malformed input", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "!@#$%^&*()");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    // Should handle gracefully without crashing
  });

  test("should handle very long input", async ({ page }) => {
    const longInput = "Supply USDC to Blend ".repeat(100);
    await page.fill('[data-testid="chat-input"]', longInput);
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
  });

  test("should handle rapid consecutive messages", async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="chat-input"]', `Message ${i}`);
      await page.click('[data-testid="send-message"]');
      await page.waitForTimeout(100);
    }
    
    // Should handle all messages without crashing
    const responses = page.locator('[data-testid="agent-response"]');
    await expect(responses.first()).toBeVisible({ timeout: 15000 });
  });

  test("should maintain context after error", async ({ page }) => {
    // Cause an error
    await page.fill('[data-testid="chat-input"]', "Supply INVALID_TOKEN to Blend");
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 10000 });
    
    // Try valid request after error
    await page.fill('[data-testid="chat-input"]', "Show me USDC pool");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').nth(1);
    await expect(response).toBeVisible({ timeout: 10000 });
    await expect(response).toContainText(/USDC|pool/i);
  });

  test("should handle health factor warnings", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Borrow maximum USDC from Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 15000 });
    
    // Should warn about health factor
    await expect(response).toContainText(/health factor|risk|liquidation/i);
  });

  test("should handle pool capacity limits", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Supply 10000000 USDC to Blend");
    await page.click('[data-testid="send-message"]');
    
    const response = page.locator('[data-testid="agent-response"]').first();
    await expect(response).toBeVisible({ timeout: 10000 });
    // Should handle pool capacity check
  });

  test("should handle stale data refresh", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Show me USDC pool APY");
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 10000 });
    
    // Wait and request again
    await page.waitForTimeout(2000);
    await page.fill('[data-testid="chat-input"]', "Refresh the APY");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="agent-response"]').nth(1)).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Blend Agent - Performance", () => {
  test.beforeEach(async ({ page, mockWallet }) => {
    await page.goto("/agents");
    await mockWallet.connect();
    await page.click('[data-testid="agent-card-blend_agent"]');
  });

  test("should respond within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('[data-testid="chat-input"]', "Show me Blend pools");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="agent-response"]').first()).toBeVisible({ timeout: 10000 });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
  });

  test("should handle large pool lists efficiently", async ({ page }) => {
    await page.fill('[data-testid="chat-input"]', "Show me all available pools");
    await page.click('[data-testid="send-message"]');
    
    await expect(page.locator('[data-testid="pool-list"]')).toBeVisible({ timeout: 15000 });
    
    // Should render without lag
    const poolItems = page.locator('[data-testid^="pool-item-"]');
    await expect(poolItems.first()).toBeVisible();
  });
});
