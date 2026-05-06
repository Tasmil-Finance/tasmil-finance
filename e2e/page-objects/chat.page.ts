import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** All card data-testid values that can appear in AI responses. */
export type CardType =
  | "card-clarify"
  | "card-plan-preview"
  | "card-execution"
  | "card-swap-execute"
  | "card-stellar-execute"
  | "card-trustline"
  | "card-bridge-execute"
  | "card-account-setup"
  | "card-account-strategy"
  | "card-strategy-preset"
  | "card-earn-discovery"
  | "card-pool-info"
  | "card-account-info"
  | "card-swap-quote"
  | "card-bridge-discovery"
  | "card-blend-tx"
  | "card-blend-pools"
  | "card-blend-pool-detail"
  | "card-blend-positions"
  | "card-blend-reserve"
  | "card-blend-backstop-info"
  | "card-blend-backstop-balance"
  | "card-aqua-pools"
  | "card-aqua-pool-detail"
  | "card-aqua-positions"
  | "card-aqua-tx"
  | "card-action-search"
  | "card-soroswap-pools";

export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly messageList: Locator;

  constructor(page: Page) {
    this.page = page;
    // The chat input — try multiple selectors to match the app's actual markup
    this.messageInput = page
      .locator(
        'textarea, [contenteditable="true"], input[placeholder*="message" i], [role="textbox"]'
      )
      .first();
    this.sendButton = page
      .locator(
        'button[type="submit"], button:has(svg[class*="send" i]), button[aria-label*="send" i]'
      )
      .first();
    this.messageList = page.locator('[data-testid="agent-response"], [class*="message"]');
  }

  /** Navigate to a chat thread. */
  async goto(threadId?: string) {
    const path = threadId ? `/chat/${threadId}` : "/chat/new";
    await this.page.goto(path, { waitUntil: "networkidle" });
  }

  /** Get the current thread ID from the URL. */
  get threadId(): string {
    const url = this.page.url();
    const match = url.match(/\/chat\/([a-f0-9-]+)/);
    return match?.[1] ?? "";
  }

  /** Send a message in the chat. */
  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    // Press Enter to send (common pattern in chat UIs)
    await this.messageInput.press("Enter");
  }

  /**
   * Wait for the AI to finish responding.
   *
   * The chat UI swaps between:
   * - Streaming: stop button (variant="destructive", Square icon)
   * - Done: send button (type="submit", Send icon)
   *
   * We wait for the send submit button to reappear.
   */
  async waitForResponse(timeout = 180_000) {
    // Phase 1: Wait for AI to START (stop button appears)
    await this.page.waitForTimeout(2000);
    try {
      await this.page.waitForFunction(
        () => {
          const btns = document.querySelectorAll("button");
          return Array.from(btns).some((b) => b.className.includes("destructive"));
        },
        { timeout: 15_000 }
      );
    } catch {
      // AI might respond very fast
    }

    // Phase 2: Wait for stop button to disappear (AI done streaming)
    // Only check the stop button — NOT spinners, because tool calls
    // can leave stuck spinners (e.g. duplicate flow_compose_plan)
    await this.page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll("button"));
        return !btns.some((b) => b.className.includes("destructive"));
      },
      { timeout: 170000, polling: 1000 }
    );

    // Phase 3: Wait 8s after stop button gone for final rendering
    await this.page.waitForTimeout(8000);

    // Phase 4: If HMR recompiled during the wait, the page might show "Compiling..."
    // or the welcome screen. Wait for it to settle.
    try {
      await this.page.waitForFunction(() => !document.body.textContent?.includes("Compiling"), {
        timeout: 15_000,
      });
    } catch {
      /* no compiling indicator — OK */
    }

    // Scroll to bottom
    await this.scrollToBottom();
  }

  /** Wait for a specific card type to appear in the chat. */
  async waitForCard(cardType: CardType, timeout = 90_000): Promise<Locator> {
    const selector = `[data-testid="${cardType}"]`;
    await this.page.waitForSelector(selector, { timeout });
    return this.page.locator(selector).last();
  }

  /** Wait for any card to appear (returns the last one). */
  async waitForAnyCard(timeout = 90_000): Promise<{ type: CardType; locator: Locator }> {
    const cardSelector = '[data-testid^="card-"]';
    await this.page.waitForSelector(cardSelector, { timeout });
    const lastCard = this.page.locator(cardSelector).last();
    const testId = await lastCard.getAttribute("data-testid");
    return { type: testId as CardType, locator: lastCard };
  }

  /** Get all cards currently visible in the chat. */
  async getAllCards(): Promise<Array<{ type: string; locator: Locator }>> {
    const cards = this.page.locator('[data-testid^="card-"]');
    const count = await cards.count();
    const result: Array<{ type: string; locator: Locator }> = [];
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const testId = await card.getAttribute("data-testid");
      if (testId) result.push({ type: testId, locator: card });
    }
    return result;
  }

  /** Select an option in a ClarifyCard by its label text. */
  async selectClarifyOption(label: string) {
    const clarifyCard = this.page.locator('[data-testid="card-clarify"]').last();
    // ClarifyCard options have aria-label="Select {label}"
    const option = clarifyCard
      .locator(`[aria-label*="${label}"], button:has-text("${label}")`)
      .first();
    await option.click();
  }

  /** Click confirm/approve on a PlanPreviewCard. */
  async confirmPlan() {
    const planCard = this.page.locator('[data-testid="card-plan-preview"]').last();
    const confirmBtn = planCard
      .locator('button:has-text("Confirm"), button:has-text("Approve"), button:has-text("Execute")')
      .first();
    await confirmBtn.click();
  }

  /** Click the sign/submit button on a TX execute card. */
  async signTransaction() {
    const txCard = this.page
      .locator(
        '[data-testid="card-stellar-execute"], [data-testid="card-swap-execute"], [data-testid="card-bridge-execute"], [data-testid="card-blend-tx"], [data-testid="card-aqua-tx"]'
      )
      .last();
    const signBtn = txCard
      .locator('button:has-text("Sign"), button:has-text("Submit"), button:has-text("Confirm")')
      .first();
    await signBtn.click();
  }

  /** Get text content of the AI response area (chat messages only, not sidebar). */
  async getLastResponseText(): Promise<string> {
    // Strategy: collect text from all AI message bubbles + tool cards in the chat.
    // The chat area is the main content region (right of sidebar).
    // AI messages have role/data attributes or are inside the message thread container.
    const text = await this.page.evaluate(() => {
      // 1. Try to find the chat thread/messages container (not the sidebar)
      //    The sidebar has nav links like "Chat", "Farming", etc.
      //    The chat area is typically inside a container after the sidebar.
      const selectors = [
        '[data-testid="chat-messages"]',
        '[data-testid="agent-response"]',
        // The chat messages scroll container (overflow-y-auto in the main area)
        "main .overflow-y-auto",
        "main",
      ];

      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent && el.textContent.length > 50) {
          return el.textContent;
        }
      }

      // 2. Fallback: find the largest text block that's NOT the sidebar
      //    The sidebar is typically <200px wide; the chat area is the rest.
      const allDivs = document.querySelectorAll("div");
      let bestText = "";
      for (const div of allDivs) {
        const rect = div.getBoundingClientRect();
        // Skip narrow elements (sidebar) and tiny elements
        if (rect.width < 300 || rect.height < 100) continue;
        // Skip if it's the sidebar (left edge at 0 and narrow)
        if (rect.left < 10 && rect.width < 250) continue;
        const t = div.textContent || "";
        if (t.length > bestText.length && t.length < 50000) {
          bestText = t;
        }
      }
      return bestText;
    });

    return text || "";
  }

  /** Scroll the chat container to the very bottom so latest content is visible. */
  async scrollToBottom() {
    await this.page.evaluate(() => {
      // Try common chat scroll containers
      const selectors = [
        '[class*="overflow-y"]',
        '[class*="scroll"]',
        "main",
        '[role="log"]',
        '[data-testid="chat-messages"]',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el && el.scrollHeight > el.clientHeight) {
          el.scrollTop = el.scrollHeight;
          return;
        }
      }
      // Fallback: scroll the whole page
      window.scrollTo(0, document.body.scrollHeight);
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Take a full-chat screenshot showing ALL messages from top to bottom.
   *
   * The chat uses a flex-1 overflow-y-auto container that clips messages.
   * We temporarily:
   * 1. Set the scroll container to overflow:visible + height:auto
   * 2. Walk up the DOM removing any height/overflow constraints on parents
   * 3. Expand the viewport to fit the full content
   * 4. Take the screenshot
   * 5. Restore everything
   */
  async screenshotFullPage(name: string) {
    // Guard: verify the conversation is still rendered (not reset by HMR/Fast Refresh).
    // If the page shows the welcome screen instead of messages, wait for HMR to complete.
    for (let attempt = 0; attempt < 3; attempt++) {
      const hasMessages =
        (await this.page
          .locator('[data-testid^="card-"], [data-testid="agent-response"]')
          .count()) > 0 ||
        (await this.page.locator('button[class*="destructive"]').count()) > 0 ||
        (await this.page.evaluate(() => {
          // Check if any AI message text is visible (not just the welcome screen)
          const msgs = document.querySelectorAll('[class*="message"], [class*="prose"]');
          return msgs.length > 2; // welcome screen has ~2 elements, conversations have more
        }));

      if (hasMessages) break;

      // Page likely reset by HMR — wait for recompile to finish
      console.warn(
        `[screenshotFullPage] Conversation not visible (attempt ${attempt + 1}/3), waiting for HMR...`
      );
      await this.page.waitForTimeout(3000);
      // Check if "Compiling..." indicator disappears
      try {
        await this.page.waitForFunction(() => !document.body.textContent?.includes("Compiling"), {
          timeout: 10_000,
        });
      } catch {
        /* no compiling indicator */
      }
      await this.page.waitForTimeout(2000);
    }

    const originalSize = this.page.viewportSize();

    const totalHeight = await this.page.evaluate(() => {
      // Find the chat messages scroll container (overflow-y-auto with scrollHeight > clientHeight)
      const scrollEl =
        (document.querySelector(".overflow-y-auto") as HTMLElement) ||
        (document.querySelector('[data-scrollable="true"]') as HTMLElement);

      if (!scrollEl) return 900;

      const contentHeight = scrollEl.scrollHeight;

      // Keep chat input and suggestions visible in screenshots

      // Remove overflow on the scroll container
      scrollEl.style.setProperty("overflow", "visible", "important");
      scrollEl.style.setProperty("max-height", "none", "important");
      scrollEl.style.setProperty("height", "auto", "important");
      scrollEl.style.setProperty("flex", "none", "important");

      // Walk up parents and remove any height/overflow constraints
      let parent = scrollEl.parentElement;
      while (parent && parent !== document.body) {
        const cs = window.getComputedStyle(parent);
        if (cs.overflow !== "visible" || cs.maxHeight !== "none") {
          parent.style.setProperty("overflow", "visible", "important");
          parent.style.setProperty("max-height", "none", "important");
          parent.style.setProperty("height", "auto", "important");
        }
        parent = parent.parentElement;
      }

      document.documentElement.style.setProperty("overflow", "visible", "important");
      document.body.style.setProperty("overflow", "visible", "important");

      return contentHeight + 150;
    });

    // Expand viewport to fit all chat content
    const width = originalSize?.width ?? 1440;
    const height = Math.min(Math.max(totalHeight, 900), 10000);
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(300);

    await this.page.screenshot({
      path: `e2e/test-results/cards/${name}.png`,
      fullPage: true,
    });

    // Restore viewport
    if (originalSize) {
      await this.page.setViewportSize(originalSize);
    }

    // Restore styles via page reload (cleanest way — next navigation resets anyway)
    // Skip reload if this is the last action (test ends after screenshot)
  }

  /** @deprecated Use screenshotFullPage instead */
  async screenshotLastCard(name: string) {
    await this.screenshotFullPage(name);
  }
}
