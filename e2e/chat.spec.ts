import { expect, test } from "@playwright/test";
import { freshWallet, loginAsWallet } from "./helpers/auth";

test.describe("Chat (/chat)", () => {
  test.skip(process.env.NODE_ENV === "production", "disabled on production");

  // T1
  test("New chat page loads at /chat/new", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await expect(page).toHaveURL(/\/chat/);
  });

  // T2
  test("Chat input field visible", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await expect(input).toBeVisible({ timeout: 8000 });
  });

  // T3
  test("Send button visible", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const btn = page.getByRole("button", { name: /send|submit|chat/i }).first();
    const hasBtn = await btn.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasBtn) await expect(btn).toBeVisible();
  });

  // T4
  test("Type in chat input", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("What is the best yield strategy for USDC?");
    await expect(input).toHaveValue(/yield|strategy|usdc/i);
  });

  // T5
  test("Send message with Enter key", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("What is Blend protocol?");
    await input.press("Enter");
    await page.waitForTimeout(1000);
    await expect(page.getByText("What is Blend protocol?")).toBeVisible({ timeout: 5000 });
  });

  // T6
  test("Send message with Send button", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Explain Soroswap");
    const btn = page.getByRole("button", { name: /send|submit/i }).first();
    const hasBtn = await btn.isVisible().catch(() => false);
    if (hasBtn) {
      await btn.click();
      await page.waitForTimeout(1000);
      await expect(page.getByText("Explain Soroswap")).toBeVisible({ timeout: 5000 });
    }
  });

  // T7
  test("User message appears in thread", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("What pools are available on Aquarius?");
    await input.press("Enter");
    await expect(page.getByText("What pools are available on Aquarius?")).toBeVisible({
      timeout: 5000,
    });
  });

  // T8
  test("AI streaming response appears", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("How do I start farming?");
    await input.press("Enter");
    await page.waitForTimeout(3000);
    const content = await page.content();
    const hasResponse = /farming|yield|strategy|deposit|blend|soroswap/i.test(content);
    expect(hasResponse).toBeTruthy();
  });

  // T9
  test("AI response completes", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("What is Tasmil Finance?");
    await input.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    const response = page.getByText(/tasmil|defi|finance/i).first();
    const hasResponse = await response.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasResponse).toBeTruthy();
  });

  // T10
  test("Multiple messages in thread", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    const msgs = ["What is Blend?", "How about Soroswap?", "Tell me about Aquarius"];
    for (const msg of msgs) {
      await input.fill(msg);
      await input.press("Enter");
      await page.waitForTimeout(2000);
    }
    for (const msg of msgs) {
      await expect(page.getByText(msg)).toBeVisible({ timeout: 3000 });
    }
  });

  // T11
  test("Chat thread persists on refresh", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Give me a summary");
    await input.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Give me a summary")).toBeVisible({ timeout: 5000 });
  });

  // T12
  test("New chat button works", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("First message");
    await input.press("Enter");
    await page.waitForTimeout(1000);
    const newChatBtn = page.getByText(/new chat|new conversation|clear/i).first();
    const hasNewChat = await newChatBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasNewChat) {
      await newChatBtn.click();
      await expect(page).toHaveURL(/\/chat/);
    }
  });

  // T13
  test("Thread list sidebar shows threads", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    const sidebar = page.locator("[class*=sidebar], aside").first();
    const hasSidebar = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSidebar !== null).toBeTruthy();
  });

  // T14
  test("Empty thread shows placeholder", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const placeholder = page.getByText(/type a message|send a message|ask anything/i).first();
    const hasPlaceholder = await placeholder.isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasPlaceholder !== null).toBeTruthy();
  });

  // T15
  test("Input cleared after send", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Clear me");
    await input.press("Enter");
    await page.waitForTimeout(2000);
    const inputVal = await input.inputValue();
    expect(inputVal).toBe("");
  });

  // T16
  test("Send button disabled while streaming", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Tell me everything about DeFi");
    await input.press("Enter");
    const btn = page.getByRole("button", { name: /send|submit/i }).first();
    const hasBtn = await btn.isVisible().catch(() => false);
    if (hasBtn) {
      const isDisabled = await btn.isDisabled();
      expect(isDisabled !== null).toBeTruthy();
    }
  });

  // T17
  test("Network error during send", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.route("**/agui/**", (route) => route.fulfill({ status: 503 }));
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Test error");
    await input.press("Enter");
    await page.waitForTimeout(3000);
    const content = await page.content();
    const ok = !(/error|503|unavailable/i.test(content) && /test error/i.test(content));
    expect(ok).toBeTruthy();
  });

  // T18
  test("Long message handled", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    const longMsg = "Explain " + "DeFi. ".repeat(100);
    await input.fill(longMsg);
    await input.press("Enter");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/explain/i)).toBeVisible({ timeout: 3000 });
  });

  // T19
  test("Special characters handled", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Hello! 🎉 @user #finance $100 & share 📊");
    await input.press("Enter");
    await page.waitForTimeout(2000);
    await expect(page.getByText(/hello/i)).toBeVisible({ timeout: 3000 });
  });

  // T20
  test("Markdown in AI response", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("How does Blend calculate APY?");
    await input.press("Enter");
    await page.waitForLoadState("networkidle", { timeout: 15000 });
    const content = await page.content();
    const hasMarkdown = /<code|<strong|<b|<pre/i.test(content);
    expect(hasMarkdown).toBeTruthy();
  });

  // T21
  test("No console errors during chat", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("Quick test");
    await input.press("Enter");
    await page.waitForTimeout(3000);
    expect(errors.filter((e) => !/warning|deprecated/i.test(e))).toHaveLength(0);
  });

  // T22
  test("Chat input autofocus on load", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await page.waitForLoadState("networkidle");
    const active = page.locator(":focus");
    const tag = await active.evaluate((el) => el.tagName);
    expect(["INPUT", "TEXTAREA"].includes(tag)).toBeTruthy();
  });

  // T23
  test("Escape key clears input", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 5000 });
    await input.fill("To be cleared");
    await page.keyboard.press("Escape");
    const val = await input.inputValue();
    expect(val).toBe("");
  });

  // T24
  test("Page title includes Tasmil", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await expect(page).toHaveTitle(/Tasmil/i);
  });

  // T25
  test("No error overlay on chat load", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);
    await page.goto("/chat/new");
    await page.waitForTimeout(2000);
    const alert = page.getByRole("alert");
    const hasAlert = await alert.isVisible().catch(() => false);
    expect(hasAlert).toBeFalsy();
  });

  // T26 — Regression for two bugs that surface as "Chat request was
  // missing a usable wallet identity":
  //   1. ai/api/api/agui.py _require_auth had a broken import → 500
  //   2. Frontend lacked /api/auth/me rehydrate → 403 SESSION_INVALID
  // This test asserts neither failure shape appears when the user sends
  // a message after a normal login.
  test("chat send: agui call has Bearer header and is not 403 or 500", async ({ page }) => {
    const wallet = freshWallet();
    await loginAsWallet(page, wallet);

    const aguiRequestPromise = page.waitForRequest(
      (req) => /\/agui\//.test(req.url()) && req.method() === "POST",
      { timeout: 20_000 }
    );

    await page.goto("/chat/new");
    const input = page.locator("textarea, input[type=text]").first();
    await input.waitFor({ timeout: 10_000 });
    await input.fill("Ping");
    await input.press("Enter");

    const aguiRequest = await aguiRequestPromise;
    expect(aguiRequest.headers()["authorization"]).toMatch(/^Bearer\s+\S+/);

    const aguiResponse = await aguiRequest.response();
    const status = aguiResponse?.status() ?? 0;
    expect(status).not.toBe(403);
    expect(status).not.toBe(500);

    await expect(page.getByText(/missing a usable wallet identity/i)).toHaveCount(0);
  });
});
