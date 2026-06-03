/**
 * Yield Aggregator — collect and rank earn opportunities across all protocols.
 *
 * Ported from apps/mcp-stellar/src/tools/unified/internals/compare-earn-logic.ts
 * Now works with SDK protocol adapters.
 */

import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity, YieldFilterParams } from "../../types/yield.js";
import { withTimeout } from "../../utils/timeout.js";
import { createLogger } from "../../utils/logger.js";

const log = createLogger("yield-aggregator");
const TIMEOUT_MS = 12_000;

// ─── Scoring ──────────────────────────────────────────────────────

// NOTE: Protocol adapters are responsible for returning APY in percentage format
// (9.3 = 9.3%). The aggregator no longer guesses or converts — each adapter
// normalizes at source (Blend: SDK decimal * 100, Aquarius: API already %).

function riskPenalty(risk: "low" | "medium" | "high"): number {
  switch (risk) {
    case "low": return 0;
    case "medium": return 0.1;
    case "high": return 0.25;
  }
}

/**
 * Score an opportunity for ranking.
 * Score = totalApy × (1 - riskPenalty) × liquidityBonus
 */
function scoreOpportunity(o: YieldOpportunity): number {
  const apy = o.apy.total ?? o.apy.base ?? 0;
  const tvlNum = o.tvl ? parseFloat(o.tvl) : 0;
  // Liquidity bonus: ln(1 + TVL/1000) normalized roughly to 0–1
  const liquidityBonus = tvlNum > 0 ? Math.min(1, Math.log(1 + tvlNum / 1000) / 10) : 0;
  return apy * (1 - riskPenalty(o.risk)) * (1 + liquidityBonus);
}

// ─── YieldAggregator ─────────────────────────────────────────────

export class YieldAggregator {
  constructor(private readonly config: TasmilClientConfig) {}

  /**
   * Fetch yield opportunities from all protocols in parallel.
   * Failed protocols are silently dropped.
   */
  async getAll(filters?: YieldFilterParams): Promise<YieldOpportunity[]> {
    // Lazy-import adapters to avoid circular deps and allow tree-shaking.
    // Active: Blend (lending), Aquarius (AMM LP), Soroswap (AMM LP), DeFindex (vaults).
    // Inactive:
    //   - Phoenix: No APY/TVL data available on-chain (needs subgraph).
    //   - Allbridge: Bridge LP yields not yet modeled.
    //   - Templar: NEAR-chain yield requires cross-chain indexing.
    const [
      { BlendAdapter },
      { AquariusAdapter },
      { SoroswapAdapter },
      { DefindexAdapter },
      { TasmilAdapter },
    ] = await Promise.all([
      import("../../protocols/blend/index.js"),
      import("../../protocols/aquarius/index.js"),
      import("../../protocols/soroswap/index.js"),
      import("../../protocols/defindex/index.js"),
      import("../../protocols/tasmil/index.js"),
    ]);

    const adapters = [
      new BlendAdapter(this.config),
      new AquariusAdapter(this.config),
      new SoroswapAdapter(this.config),
      new DefindexAdapter(this.config),
      new TasmilAdapter(this.config),
    ];

    // Filter to requested protocols only
    const protocolFilter = filters?.protocols;

    const tasks = adapters
      .filter((a) => {
        if (!protocolFilter) return true;
        // Determine adapter protocol id
        const name = a.constructor.name.toLowerCase().replace("adapter", "");
        return protocolFilter.some((p) => name.includes(p.replace("-", "")));
      })
      .map((a) =>
        withTimeout(
          (a as unknown as { getYieldOpportunities(): Promise<YieldOpportunity[]> }).getYieldOpportunities(),
          TIMEOUT_MS,
        ).catch((err) => {
          log.warn(`${a.constructor.name} getYieldOpportunities failed`, { err: String(err) });
          return [] as YieldOpportunity[];
        }),
      );

    const results = await Promise.all(tasks);
    let all = results.flat().filter((o) => o.status === "ok");

    // Protocol adapters now return APY in percentage format (9.3 = 9.3%)
    // No aggregator-level conversion needed.

    // Apply filters
    if (filters) {
      if (filters.assetFilter) {
        const filterUp = filters.assetFilter.toUpperCase();
        all = all.filter((o) =>
          o.assets.some((a) => a.toUpperCase().includes(filterUp)),
        );
      }
      if (filters.minApy != null) {
        all = all.filter((o) => (o.apy.total ?? o.apy.base ?? 0) >= filters.minApy!);
      }
      if (filters.minTvl != null) {
        all = all.filter((o) => {
          if (!o.tvl) return false;
          return parseFloat(o.tvl) >= filters.minTvl!;
        });
      }
      if (filters.types && filters.types.length > 0) {
        all = all.filter((o) => filters.types!.includes(o.type));
      }
    }

    // Sort by score descending
    return all.sort((a, b) => scoreOpportunity(b) - scoreOpportunity(a));
  }

  /**
   * Get opportunities filtered by a specific asset.
   */
  async getByAsset(asset: string): Promise<YieldOpportunity[]> {
    return this.getAll({ assetFilter: asset });
  }

  /**
   * Get the single best opportunity for an asset.
   */
  async getBest(
    asset: string,
    filters?: Omit<YieldFilterParams, "assetFilter">,
  ): Promise<YieldOpportunity | null> {
    const all = await this.getAll({ ...filters, assetFilter: asset });
    return all[0] ?? null;
  }
}
