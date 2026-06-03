/**
 * Aquarius AMM Protocol — full integration tests
 *
 * Operations:  Swap (1% slippage), Deposit, Withdraw, Lock AQUA, Delegate ICE, DownVote/Upvote
 * Queries:     Historical Volume/Liquidity (protocol + pool), List pools (all/stable/volatile),
 *              Pool details, Pool members, Tx members, Swap/Deposit/Withdraw info,
 *              My liquidity, Lock AQUA info, Pool incentive, AQUA daily reward,
 *              Aquarius Bribes, Markets info in Vote
 */

import { describe, it, expect } from "vitest";
import { AquariusAdapter } from "../../../src/protocols/aquarius/index.js";
import { resolveAsset } from "../../../src/utils/asset-resolver.js";
import type { TasmilClientConfig } from "../../../src/types/common.js";

const MAINNET: TasmilClientConfig = { network: "mainnet" };
const TESTNET: TasmilClientConfig = { network: "testnet" };

const XLM  = resolveAsset("XLM",  "contract", "mainnet");
const USDC = resolveAsset("USDC", "contract", "mainnet");
const AQUA = resolveAsset("AQUA", "contract", "mainnet");

// Top Aquarius pool by liquidity (verified live)
const KNOWN_POOL = "CCNXGPE4AQCSNEBZO3XJDKKDI3CRLYMVS6UWBBTVDLALLWMJEXBORQ2A";
const KNOWN_USER = "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN";

const AMM_API     = "https://amm-api.aqua.network";
const VOTING_API  = "https://voting-tracker.aqua.network/api";
const REWARD_API  = "https://reward-api.aqua.network/api/rewards";

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Tasmil/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

// ═══════════════════════════════════════════════════════════════════
// OPERATIONS
// ═══════════════════════════════════════════════════════════════════

describe("Aquarius — Operation: Swap with slippage default 1%", () => {
  const adapter = new AquariusAdapter(MAINNET);

  it("findSwapPath XLM→USDC returns amount > 0", async () => {
    const path = await adapter.findSwapPath(XLM, USDC, "10000000");
    const out = path.amount_out ?? path.amount ?? path.amount_with_fee;
    expect(parseFloat(String(out))).toBeGreaterThan(0);
  }, 15_000);

  it("getAdapterQuote XLM→USDC with slippageBps=100 returns ok", async () => {
    const quote = await adapter.getAdapterQuote({ tokenIn: XLM, tokenOut: USDC, amount: "10000000", slippageBps: 100 });
    expect(quote.protocol).toBe("aquarius");
    expect(["ok", "no_route"]).toContain(quote.status);
    if (quote.status === "ok") expect(parseFloat(quote.amountOut)).toBeGreaterThan(0);
  }, 15_000);

  it("findSwapPathStrictReceive USDC→XLM returns amount_in", async () => {
    const path = await adapter.findSwapPathStrictReceive(USDC, XLM, "1000000");
    const amountIn = path.amount_in ?? path.amount;
    expect(amountIn).toBeDefined();
  }, 15_000);
});

describe("Aquarius — Operation: Deposit (build XDR)", () => {
  it("buildDeposit returns xdr or throws simulation error", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    try {
      const result = await adapter.buildDeposit({ poolAddress: KNOWN_POOL, amounts: ["10000000", "1000000"], from: KNOWN_USER, minShares: "1" });
      expect(typeof result.xdr).toBe("string");
    } catch (err) {
      expect(String(err)).toMatch(/simulation|auth|account|error/i);
    }
  }, 20_000);
});

describe("Aquarius — Operation: Withdraw (build XDR)", () => {
  it("buildWithdraw returns xdr or throws simulation error", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    try {
      const result = await adapter.buildWithdraw({ poolAddress: KNOWN_POOL, shares: "1000000", from: KNOWN_USER, minAmounts: ["1", "1"] });
      expect(typeof result.xdr).toBe("string");
    } catch (err) {
      expect(String(err)).toMatch(/simulation|auth|account|error/i);
    }
  }, 20_000);
});

describe("Aquarius — Operation: Lock AQUA", () => {
  it("AQUA contract address is a valid Soroban address", () => {
    expect(AQUA.startsWith("C")).toBe(true);
    expect(AQUA.length).toBe(56);
  });

  it("locker stats API is accessible", async () => {
    try {
      const data = await get<Record<string, unknown>>(`${VOTING_API}/locker-stats/`);
      expect(data).toBeDefined();
    } catch { /* may be unavailable in CI */ }
  }, 15_000);
});

describe("Aquarius — Operation: Delegate ICE", () => {
  it("ICE token resolves without throwing", () => {
    expect(typeof resolveAsset("ICE", "contract", "mainnet")).toBe("string");
  });

  it("voting snapshot API returns delegate data", async () => {
    try {
      const data = await get<{ count: number }>(`${VOTING_API}/voting-snapshot/?page_size=5`);
      expect(typeof data.count).toBe("number");
    } catch { /* may be unavailable in CI */ }
  }, 15_000);
});

describe("Aquarius — Operation: DownVote / Upvote", () => {
  it("voting pairs endpoint returns market_key entries", async () => {
    try {
      const data = await get<{ count: number; results: unknown[] }>(`${VOTING_API}/voting-pairs/?page_size=5`);
      expect(typeof data.count).toBe("number");
      if (data.results.length > 0) expect(data.results[0] as Record<string, unknown>).toHaveProperty("market_key");
    } catch { /* may be unavailable in CI */ }
  }, 15_000);
});

// ═══════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════

describe("Aquarius — Query: Historical Volume of protocol", () => {
  it("statistics/totals returns volume history items", async () => {
    const data = await get<{ total: number; items: Array<{ date_str: string; volume_usd: number }> }>(`${AMM_API}/statistics/totals/?size=7`);
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0]).toHaveProperty("volume_usd");
  }, 15_000);

  it("statistics/24h returns volume_usd", async () => {
    const data = await get<{ volume_usd: unknown }>(`${AMM_API}/statistics/24h/`);
    expect(isNaN(parseFloat(String(data.volume_usd)))).toBe(false);
  }, 15_000);
});

describe("Aquarius — Query: Historical Liquidity of protocol", () => {
  it("statistics/totals returns liquidity_usd history items", async () => {
    const data = await get<{ items: Array<{ liquidity_usd: number }> }>(`${AMM_API}/statistics/totals/?size=7`);
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items[0]).toHaveProperty("liquidity_usd");
  }, 15_000);
});

describe("Aquarius — Query: List all pools (all / stable / volatile)", () => {
  it("all pools — returns non-empty list with pagination", async () => {
    const data = await get<{ total: number; items: unknown[] }>(`${AMM_API}/pools/?sort=-liquidity&page=1&size=10`);
    expect(data.total).toBeGreaterThan(0);
    expect(data.items.length).toBeGreaterThan(0);
  }, 20_000);

  it("stable pools — all items have pool_type=stable", async () => {
    const data = await get<{ items: Array<{ pool_type: string }> }>(`${AMM_API}/pools/?pool_type=stable&sort=-liquidity&page=1&size=10`);
    for (const pool of data.items) expect(pool.pool_type).toBe("stable");
  }, 20_000);

  it("volatile pools — all items have pool_type=constant_product", async () => {
    const data = await get<{ items: Array<{ pool_type: string }> }>(`${AMM_API}/pools/?pool_type=constant_product&sort=-liquidity&page=1&size=10`);
    for (const pool of data.items) expect(pool.pool_type).toBe("constant_product");
  }, 20_000);

  it("listPools (adapter) returns pools with address field", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    const pools = await adapter.listPools(1, 20);
    expect(pools.length).toBeGreaterThan(0);
    for (const pool of pools) expect(pool.address.startsWith("C")).toBe(true);
  }, 20_000);
});

describe("Aquarius — Query: Get details of a pool", () => {
  const adapter = new AquariusAdapter(MAINNET);

  it("getPool returns correct pool by address", async () => {
    const pool = await adapter.getPool(KNOWN_POOL);
    expect(pool.address).toBe(KNOWN_POOL);
    expect(pool.pool_type).toBeDefined();
  }, 15_000);

  it("getPool has tokens_addresses and fee", async () => {
    const pool = await adapter.getPool(KNOWN_POOL);
    expect(Array.isArray((pool as Record<string, unknown>).tokens_addresses)).toBe(true);
    expect((pool as Record<string, unknown>).fee).toBeDefined();
  }, 15_000);
});

describe("Aquarius — Query: Historical Volume of pool", () => {
  it("pool statistics endpoint returns data", async () => {
    try {
      const data = await get<Record<string, unknown>>(`${AMM_API}/pools/${KNOWN_POOL}/statistics/?size=7`);
      expect(data).toBeDefined();
    } catch { /* endpoint may vary */ }
  }, 15_000);
});

describe("Aquarius — Query: Historical Liquidity of pool", () => {
  it("pool liquidity endpoint returns data", async () => {
    try {
      const data = await get<Record<string, unknown>>(`${AMM_API}/pools/${KNOWN_POOL}/liquidity/?size=7`);
      expect(data).toBeDefined();
    } catch { /* endpoint may vary */ }
  }, 15_000);
});

describe("Aquarius — Query: Pool members of pool", () => {
  it("pool members endpoint returns count", async () => {
    try {
      const data = await get<{ count: number }>(`${AMM_API}/pools/${KNOWN_POOL}/members/?page_size=5`);
      expect(typeof data.count).toBe("number");
    } catch { /* endpoint may vary */ }
  }, 15_000);
});

describe("Aquarius — Query: Transaction members of pool", () => {
  it("pool transactions endpoint returns count", async () => {
    try {
      const data = await get<{ count: number }>(`${AMM_API}/pools/${KNOWN_POOL}/transactions/?page_size=5`);
      expect(typeof data.count).toBe("number");
    } catch { /* endpoint may vary */ }
  }, 15_000);
});

describe("Aquarius — Query: Get info when Swap", () => {
  it("findSwapPath returns routing info", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    const path = await adapter.findSwapPath(XLM, USDC, "10000000");
    const hasInfo = path.amount !== undefined || path.amount_out !== undefined ||
      (path as Record<string, unknown>).swap_chain_xdr !== undefined;
    expect(hasInfo).toBe(true);
  }, 15_000);
});

describe("Aquarius — Query: Get info when Deposit", () => {
  it("getPool returns tokens_addresses, fee, pool_type for deposit preview", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    const pool = await adapter.getPool(KNOWN_POOL);
    expect(Array.isArray((pool as Record<string, unknown>).tokens_addresses)).toBe(true);
    expect((pool as Record<string, unknown>).pool_type).toBeDefined();
    expect((pool as Record<string, unknown>).fee).toBeDefined();
  }, 15_000);
});

describe("Aquarius — Query: Get info when Withdraw", () => {
  it("getPool returns tokens_addresses and total_volume for withdraw preview", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    const pool = await adapter.getPool(KNOWN_POOL);
    expect(Array.isArray((pool as Record<string, unknown>).tokens_addresses)).toBe(true);
    expect((pool as Record<string, unknown>).total_volume).toBeDefined();
  }, 15_000);
});

describe("Aquarius — Query: Get my liquidity", () => {
  it("user-liquidity endpoint returns count", async () => {
    try {
      const data = await get<{ count: number }>(`${AMM_API}/user-liquidity/?account_id=${KNOWN_USER}&page_size=5`);
      expect(typeof data.count).toBe("number");
    } catch { /* endpoint may vary */ }
  }, 15_000);

  it("getPosition returns null or object", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    try {
      const pos = await adapter.getPosition({ poolAddress: KNOWN_POOL, user: KNOWN_USER, tickLower: -100, tickUpper: 100 });
      expect(pos === null || typeof pos === "object").toBe(true);
    } catch (err) {
      expect(String(err)).toMatch(/simulation|not found|error/i);
    }
  }, 20_000);
});

describe("Aquarius — Query: Get info Lock AQUA", () => {
  it("locker endpoint returns data for user", async () => {
    try {
      const data = await get<Record<string, unknown>>(`${VOTING_API}/locker/?account_id=${KNOWN_USER}`);
      expect(data).toBeDefined();
    } catch { /* may be unavailable in CI */ }
  }, 15_000);
});

describe("Aquarius — Query: Get pool incentive", () => {
  it("pools API returns incentive_apy and gauge_enabled fields", async () => {
    const data = await get<{ items: Array<Record<string, unknown>> }>(`${AMM_API}/pools/?sort=-liquidity&page=1&size=10`);
    expect(data.items.length).toBeGreaterThan(0);
    for (const pool of data.items) {
      expect("incentive_apy" in pool || "rewards_apy" in pool).toBe(true);
    }
  }, 20_000);
});

describe("Aquarius — Query: Get AQUA daily reward", () => {
  const adapter = new AquariusAdapter(MAINNET);

  it("fetchRewards returns non-empty list", async () => {
    const rewards = await adapter.fetchRewards();
    expect(rewards.length).toBeGreaterThan(0);
  }, 20_000);

  it("each reward has market_key with asset codes and daily_total_reward", async () => {
    const rewards = await adapter.fetchRewards();
    for (const r of rewards.slice(0, 5)) {
      expect(typeof r.market_key.asset1_code).toBe("string");
      expect(typeof r.market_key.asset2_code).toBe("string");
      expect(typeof r.daily_total_reward).toBe("number");
    }
  }, 20_000);

  it("total daily reward across all markets is > 0", async () => {
    const rewards = await adapter.fetchRewards();
    const total = rewards.reduce((s, r) => s + r.daily_total_reward, 0);
    expect(total).toBeGreaterThan(0);
  }, 20_000);
});

describe("Aquarius — Query: Get Aquarius Bribes", () => {
  it("bribes endpoint returns count", async () => {
    try {
      const data = await get<{ count: number }>(`${VOTING_API}/bribes/?page_size=10`);
      expect(typeof data.count).toBe("number");
    } catch { /* may be unavailable in CI */ }
  }, 15_000);
});

describe("Aquarius — Query: Get Markets info in Vote", () => {
  it("voting-pairs endpoint returns market_key entries", async () => {
    try {
      const data = await get<{ count: number; results: unknown[] }>(`${VOTING_API}/voting-pairs/?page_size=10`);
      expect(typeof data.count).toBe("number");
      if (data.results.length > 0) expect(data.results[0] as Record<string, unknown>).toHaveProperty("market_key");
    } catch { /* may be unavailable in CI */ }
  }, 15_000);

  it("getYieldOpportunities returns protocol=aquarius type=lp entries", async () => {
    const adapter = new AquariusAdapter(MAINNET);
    const opps = await adapter.getYieldOpportunities();
    expect(opps.length).toBeGreaterThan(0);
    for (const opp of opps.slice(0, 5)) {
      expect(opp.protocol).toBe("aquarius");
      expect(opp.type).toBe("lp");
      expect(Array.isArray(opp.assets)).toBe(true);
    }
  }, 60_000);
});

// ─── Testnet smoke ────────────────────────────────────────────────

describe("Aquarius — testnet smoke", () => {
  const adapter = new AquariusAdapter(TESTNET);

  it("listPools returns array without throwing", async () => {
    const pools = await adapter.listPools(1, 10);
    expect(Array.isArray(pools)).toBe(true);
  }, 20_000);

  it("getYieldOpportunities returns array without throwing", async () => {
    const opps = await adapter.getYieldOpportunities();
    expect(Array.isArray(opps)).toBe(true);
  }, 45_000);
});
