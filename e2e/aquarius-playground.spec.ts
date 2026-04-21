import { test, expect } from "@playwright/test";

// ─── Mock data ──────────────────────────────────────────────────

const MOCK_POOLS = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  filter: "all",
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 2,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
  pools: [
    {
      address: "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK",
      pool_type: "constant_product",
      tokens_addresses: [
        "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
      ],
      tokens_str: ["native", "USDC:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER"],
      fee: "0.0030",
      liquidity_usd: "12500000000000",  // $1.25M in stroops
      volume_usd: "3500000000000",      // $350K in stroops
      apy: "0.085",
      rewards_apy: "0.123",
      total_apy: "0.208",
      reserves: ["100000000000", "50000000000"],
      total_share: "70000000000",
    },
    {
      address: "CDANS3ESUL3FY22FK67QSRYS7E2C7HXAOVL2TJAND76CO3HTP26U5GOI",
      pool_type: "stable",
      tokens_addresses: [
        "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
        "CBL6KD2LFMLAUKFFWNNXWOXFN73GAXLEA4WMJRLQ5L76DMYTM3KWQVJN",
      ],
      tokens_str: ["USDC:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER", "USDT:GAHPYWLK6YRN7CVYZOO4H3VDRZ7PVF5UJGLZCSPAEIKJE2XSWF5LAGER"],
      fee: "0.0010",
      liquidity_usd: "8900000000000",
      volume_usd: "1200000000000",
      apy: "0.032",
      rewards_apy: "0.058",
      total_apy: "0.090",
      reserves: ["80000000000", "90000000000"],
      total_share: "85000000000",
    },
  ],
};

const MOCK_POOL_DETAIL = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  pool: MOCK_POOLS.pools[0],
};

const MOCK_QUOTE = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  quote: {
    protocol: "aquarius",
    amountIn: "10000000",
    amountOut: "1350000",
    fee: "0",
    feePercent: "~0.10%",
    route: ["XLM", "USDC"],
    estimatedTime: "~5s",
    status: "ok",
  },
};

const MOCK_YIELD = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  count: 2,
  opportunities: [
    {
      protocol: "aquarius",
      type: "lp",
      name: "Aquarius XLM-USDC",
      assets: ["XLM", "USDC"],
      apy: { base: 8.5, reward: 12.3, total: 20.8, rewardToken: "AQUA" },
      tvl: "1250000",
      poolAddress: "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK",
      risk: "medium",
      status: "ok",
      fee: "0.003",
      poolType: "constant_product",
    },
    {
      protocol: "aquarius",
      type: "lp",
      name: "Aquarius USDC-USDT",
      assets: ["USDC", "USDT"],
      apy: { base: 3.2, reward: 5.8, total: 9.0, rewardToken: "AQUA" },
      tvl: "890000",
      poolAddress: "CDANS3ESUL3FY22FK67QSRYS7E2C7HXAOVL2TJAND76CO3HTP26U5GOI",
      risk: "medium",
      status: "ok",
      fee: "0.001",
      poolType: "stable",
    },
  ],
};

const MOCK_REWARDS = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  totalDailyReward: 150000,
  rewards: [
    { pair: "XLM/USDC", asset1: "XLM:native", asset2: "USDC:issuer", dailyAmmReward: 50000, dailySdexReward: 20000, dailyTotalReward: 70000 },
    { pair: "XLM/AQUA", asset1: "XLM:native", asset2: "AQUA:issuer", dailyAmmReward: 30000, dailySdexReward: 10000, dailyTotalReward: 40000 },
    { pair: "USDC/USDT", asset1: "USDC:issuer", asset2: "USDT:issuer", dailyAmmReward: 25000, dailySdexReward: 15000, dailyTotalReward: 40000 },
  ],
};

const MOCK_LOCK_INFO = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  lockInfo: {
    amount: "1000",
    lockPeriodDays: 365,
    iceMultiplier: 3.33,
    estimatedIce: "3333.33",
    unlockDate: "2027-04-19",
    instruction: "To lock AQUA: create a Stellar claimable balance with your AQUA tokens and submit it to the ICE approval server.",
  },
};

const MOCK_MY_LIQUIDITY = {
  success: true,
  network: "testnet",
  protocol: "aquarius",
  hasPosition: true,
  positions: [
    {
      poolAddress: "CBQDHNBFBZYE4MKPWBSJOPIYLW4SFSXAXUTSXJN76GNKYVYPCKWC6QUK",
      shares: "5000000",
      tokens: ["XLM", "USDC"],
    },
  ],
};

const MOCK_TX_RESULT = {
  success: true,
  operation: "swap",
  xdr: "AAAAAgAAAAB" + "A".repeat(200),
  estimatedFee: "100",
  route: { pools: ["pool1"], tokens: ["XLM", "USDC"], estimatedOutput: "1350000" },
  context: { poolApy: { feeApy: 8.5, rewardApy: 12.3 }, tokens: ["XLM", "USDC"] },
};

// ─── Tests ──────────────────────────────────────────────────────

test.describe("Aquarius Playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/aquarius/pools**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_POOLS) }),
    );
    await page.route("**/api/aquarius/pool-info**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_POOL_DETAIL) }),
    );
    await page.route("**/api/aquarius/quote**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_QUOTE) }),
    );
    await page.route("**/api/aquarius/yield", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_YIELD) }),
    );
    await page.route("**/api/aquarius/rewards", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_REWARDS) }),
    );
    await page.route("**/api/aquarius/lock-info**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_LOCK_INFO) }),
    );
    await page.route("**/api/aquarius/my-liquidity**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_MY_LIQUIDITY) }),
    );
    await page.route("**/api/aquarius/op/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_TX_RESULT) }),
    );
    await page.route("**/api/aquarius/statistics**", (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          success: true, network: "testnet", protocol: "aquarius",
          period: "totals", total: 3,
          items: [
            { date: "2026-04-19", volume: 0, liquidity: 513257706 },
            { date: "2026-04-18", volume: 1500, liquidity: 512000000 },
            { date: "2026-04-17", volume: 38000, liquidity: 510000000 },
          ],
        }),
      }),
    );
    await page.route("**/api/aquarius/tokens**", (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          success: true, network: "testnet", protocol: "aquarius", total: 3,
          tokens: [
            { code: "XLM", name: "Stellar Lumens", address: "CDLZFC3SY...", decimals: 7 },
            { code: "USDC", name: "USD Coin", address: "CAZRY5GSF...", decimals: 7 },
            { code: "AQUA", name: "Aquarius", address: "CDNVQW44C...", decimals: 7 },
          ],
        }),
      }),
    );
    await page.route("**/api/aquarius/pool-history**", (route) =>
      route.fulfill({
        status: 200, contentType: "application/json",
        body: JSON.stringify({
          success: true, network: "testnet", protocol: "aquarius", total: 3,
          items: [
            { date: "2026-04-19", volume: 0, liquidity: 2630000 },
            { date: "2026-04-18", volume: 500, liquidity: 2620000 },
            { date: "2026-04-17", volume: 3800, liquidity: 2610000 },
          ],
        }),
      }),
    );
  });

  // ─── Page structure ────────────────────────────────────────────

  test("page loads with header, tabs, and pool selector", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Aquarius AMM Playground")).toBeVisible();
    await expect(page.locator("text=testnet")).toBeVisible();
    await expect(page.locator("button", { hasText: "Queries (17)" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Operations (6)" })).toBeVisible();

    // Pool selector
    const selector = page.locator("select").first();
    await expect(selector).toBeVisible();
    expect(await selector.locator("option").count()).toBe(2);
  });

  // ─── Query tab: Pool queries ──────────────────────────────────

  test("Q1: List All Pools renders pool cards", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Aquarius Pools")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=XLM / USDC").first()).toBeVisible();
    await expect(page.locator("text=USDC / USDT").first()).toBeVisible();
  });

  test("Q1: Pool filter dropdown shows all/stable/volatile options", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    // The filter dropdown should exist
    const filterSelect = page.locator("select").nth(1); // first is pool selector, second is type filter
    await expect(filterSelect).toBeVisible({ timeout: 10000 });

    // Check options
    const options = filterSelect.locator("option");
    expect(await options.count()).toBe(3);
    await expect(options.nth(0)).toHaveText("All Pools");
    await expect(options.nth(1)).toHaveText("Stable Pools");
    await expect(options.nth(2)).toHaveText("Volatile (CP) Pools");
  });

  test("Q1: Pool count shows in pagination info", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    // Should show total pool count
    await expect(page.locator("text=2 pools")).toBeVisible({ timeout: 10000 });
  });

  test("Q2: Pool Detail card renders with APY metrics", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Fee APY")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Reward APY")).toBeVisible();
    await expect(page.locator("text=Total APY")).toBeVisible();
  });

  test("Q7: Swap Quote renders route and amounts", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=Get Info When Swap")).toBeVisible();
    const panel = page.locator("text=Get Info When Swap").locator("..").locator("..");
    await panel.locator("button", { hasText: "Fetch" }).click();

    await expect(page.locator("text=Amount In")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Amount Out")).toBeVisible();
  });

  test("Q10: My Liquidity renders LP positions", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    const panel = page.locator("text=Get My Liquidity").locator("..").locator("..");
    await panel.locator("button", { hasText: "Fetch" }).click();

    await expect(page.locator("text=LP Positions").or(page.locator("text=Shares"))).toBeVisible({ timeout: 10000 });
  });

  test("Q11: AQUA Daily Rewards table renders", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=AQUA Daily Rewards")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=XLM/USDC").first()).toBeVisible();
  });

  test("Q13: Lock Aqua info renders ICE preview", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    const panel = page.locator("text=Get Info Lock Aqua").locator("..").locator("..");
    await panel.locator("button", { hasText: "Fetch" }).click();

    await expect(page.locator("text=ICE Multiplier")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=3.33x")).toBeVisible();
  });

  // ─── Operations tab ───────────────────────────────────────────

  test("Operations tab shows all 6 operation panels", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (6)" }).click();

    await expect(page.locator("text=Swap (Slippage 1%)").first()).toBeVisible();
    await expect(page.locator("text=Deposit (Add Liquidity)").first()).toBeVisible();
    await expect(page.locator("text=Withdraw (Remove Liquidity)").first()).toBeVisible();
    await expect(page.locator("text=Lock AQUA for ICE")).toBeVisible();
    await expect(page.locator("text=Delegate my ICE")).toBeVisible();
    await expect(page.locator("text=DownVote / Upvote")).toBeVisible();
  });

  test("Op1: Swap builds TX and shows TX card", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (6)" }).click();

    const panel = page.locator("text=Swap (Slippage 1%)").first().locator("..").locator("..");
    await panel.locator("button", { hasText: "Build TX" }).click();

    await expect(page.locator("text=Transaction Overview")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Gas")).toBeVisible();
    await expect(page.locator("text=Show XDR")).toBeVisible();
  });

  test("Op1: TX card toggles XDR display", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (6)" }).click();

    const panel = page.locator("text=Swap (Slippage 1%)").first().locator("..").locator("..");
    await panel.locator("button", { hasText: "Build TX" }).click();
    await expect(page.locator("text=Transaction Overview")).toBeVisible({ timeout: 10000 });

    await page.locator("text=Show XDR").click();
    await expect(page.locator("text=Hide XDR")).toBeVisible();
    await expect(page.locator("pre").first()).toBeVisible();
  });

  // ─── Error handling ───────────────────────────────────────────

  test("error state on API failure", async ({ page }) => {
    await page.route("**/api/aquarius/pools**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Aquarius API unavailable" }),
      }),
    );

    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Aquarius API unavailable")).toBeVisible({ timeout: 10000 });
  });

  // ─── Screenshots ──────────────────────────────────────────────

  test("screenshot: queries tab - pool section", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Aquarius Pools")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "e2e/screenshots/aquarius-queries-pools.png",
      fullPage: true,
    });
  });

  test("screenshot: operations tab with TX card", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (6)" }).click();

    const panel = page.locator("text=Swap (Slippage 1%)").first().locator("..").locator("..");
    await panel.locator("button", { hasText: "Build TX" }).click();
    await expect(page.locator("text=Transaction Overview")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "e2e/screenshots/aquarius-operations-tx.png",
      fullPage: true,
    });
  });

  test("screenshot: rewards and lock info", async ({ page }) => {
    await page.goto("/playground/aquarius");
    await page.waitForLoadState("networkidle");

    // Wait for rewards to load
    await expect(page.locator("text=AQUA Daily Rewards")).toBeVisible({ timeout: 10000 });

    // Fetch lock info
    const lockPanel = page.locator("text=Get Info Lock Aqua").locator("..").locator("..");
    await lockPanel.locator("button", { hasText: "Fetch" }).click();
    await expect(page.locator("text=ICE Multiplier")).toBeVisible({ timeout: 10000 });

    await page.screenshot({
      path: "e2e/screenshots/aquarius-rewards-lock.png",
      fullPage: true,
    });
  });
});
