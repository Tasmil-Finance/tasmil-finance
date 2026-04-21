import { test, expect } from "@playwright/test";

const MOCK_POOLS = {
  success: true,
  network: "testnet",
  protocol: "soroswap",
  filter: "soroswap",
  pagination: { page: 1, limit: 10, totalCount: 2, totalPages: 1, hasNext: false, hasPrev: false },
  pools: [
    {
      address: "CABC123POOL1",
      tokenA: "XLM",
      tokenB: "USDC",
      token0_address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      token1_address: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
      reserveA: "500000000000",
      reserveB: "250000000000",
      tvlUsd: 125000,
      volume_24h: 35000,
      fee: 0.003,
      protocol: "soroswap",
    },
    {
      address: "CABC123POOL2",
      tokenA: "USDC",
      tokenB: "BLND",
      token0_address: "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU",
      token1_address: "CB22KRA3YZVCNCQI64JQ5WE7UY2VAV7WFLK6A2JN3HEX56T2EDAFO7QF",
      reserveA: "100000000000",
      reserveB: "800000000000",
      tvlUsd: 45000,
      volume_24h: 8000,
      fee: 0.003,
      protocol: "soroswap",
    },
  ],
};

const MOCK_QUOTE = {
  success: true,
  network: "testnet",
  protocol: "soroswap",
  quote: {
    protocol: "soroswap",
    amountIn: "10000000",
    amountOut: "1350000",
    fee: "30000",
    feePercent: "0.30%",
    route: ["XLM", "USDC"],
    estimatedTime: "~5s",
    status: "ok",
  },
};

const MOCK_YIELD = {
  success: true,
  network: "testnet",
  protocol: "soroswap",
  count: 1,
  opportunities: [
    {
      protocol: "soroswap",
      type: "lp",
      name: "Soroswap XLM-USDC",
      assets: ["XLM", "USDC"],
      apy: { base: 5.2, reward: null, total: 5.2 },
      tvl: "125000",
      poolAddress: "CABC123POOL1",
      risk: "medium",
      status: "ok",
      fee: "0.003",
    },
  ],
};

const MOCK_POSITIONS = {
  success: true,
  network: "testnet",
  protocol: "soroswap",
  hasPosition: true,
  positions: [
    {
      poolAddress: "CABC123POOL1",
      protocol: "soroswap",
      tokenA: "XLM",
      tokenB: "USDC",
      liquidityTokens: "5000000",
      amountA: "10000000",
      amountB: "5000000",
      valueUsd: 250,
    },
  ],
};

const MOCK_TX = {
  success: true,
  operation: "swap",
  xdr: "AAAAAgAAAAB" + "A".repeat(200),
  estimatedFee: "100",
};

test.describe("Soroswap Playground", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/soroswap/pools**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_POOLS) }),
    );
    await page.route("**/api/soroswap/quote**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_QUOTE) }),
    );
    await page.route("**/api/soroswap/yield**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_YIELD) }),
    );
    await page.route("**/api/soroswap/positions**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_POSITIONS) }),
    );
    await page.route("**/api/soroswap/price**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, price: { asset: "XLM", referenceCurrency: "USD", price: 0.135 } }) }),
    );
    await page.route("**/api/soroswap/op/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_TX) }),
    );
  });

  test("page loads with header and tabs", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Soroswap DEX Playground")).toBeVisible();
    await expect(page.locator("button", { hasText: "Queries (8)" })).toBeVisible();
    await expect(page.locator("button", { hasText: "Operations (3)" })).toBeVisible();
  });

  test("pools card renders with protocol filter", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Soroswap Pools")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=XLM / USDC").first()).toBeVisible();
    // Protocol filter dropdown
    const filterSelect = page.locator("select").first();
    await expect(filterSelect).toBeVisible();
  });

  test("swap quote renders", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    const panel = page.locator("text=Swap Quote").first().locator("..").locator("..");
    await panel.locator("button", { hasText: "Fetch" }).click();
    await expect(page.locator("text=Amount Out")).toBeVisible({ timeout: 10000 });
  });

  test("yield table renders", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Yield Opportunities")).toBeVisible();
    await expect(page.locator("text=XLM / USDC").first()).toBeVisible({ timeout: 10000 });
  });

  test("operations tab shows 3 panels", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (3)" }).click();
    await expect(page.locator("text=Swap").first()).toBeVisible();
    await expect(page.locator("text=Add Liquidity").first()).toBeVisible();
    await expect(page.locator("text=Remove Liquidity").first()).toBeVisible();
  });

  test("swap operation builds TX card", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (3)" }).click();
    const panel = page.locator("text=POST /op/swap").locator("..").locator("..");
    await panel.locator("button", { hasText: "Build TX" }).click();
    await expect(page.locator("text=Transaction Overview")).toBeVisible({ timeout: 10000 });
  });

  test("screenshot: queries tab", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("text=Soroswap Pools")).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: "e2e/screenshots/soroswap-queries.png", fullPage: true });
  });

  test("screenshot: operations tab", async ({ page }) => {
    await page.goto("/playground/soroswap");
    await page.waitForLoadState("networkidle");
    await page.locator("button", { hasText: "Operations (3)" }).click();
    await page.screenshot({ path: "e2e/screenshots/soroswap-operations.png", fullPage: true });
  });
});
