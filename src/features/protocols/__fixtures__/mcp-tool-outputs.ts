/**
 * Real MCP tool output fixtures for protocol adapter tests.
 * Each fixture matches the [{type:"text", text: JSON.stringify(...)}] MCP result format.
 */

// ─── Aquarius ─────────────────────────────────────────────────

/** Aquarius resolve_pool — enriched format with token objects and TVL fields */
export const AQUARIUS_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "aquarius",
      pools: [
        {
          poolAddress:
            "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
          name: "XLM/USDC",
          tokens: [
            {
              address:
                "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
              symbol: "XLM",
            },
            {
              address:
                "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
            },
          ],
          tokens_str: [
            "native",
            "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
          ],
          tokens_addresses: [
            "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
            "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          ],
          poolType: "constant_product",
          fee: "0.0010",
          totalVolume: 1710736044750252,
          liquidity_usd: 28500000000000,
          volume_usd: 1500000000000,
          apy: 0.0016,
          rewards_apy: 0.05,
          total_apy: 0.0516,
        },
      ],
      count: 1,
    }),
  },
];

/** Aquarius resolve_pool — BROKEN old format: tokens as plain string addresses, no TVL */
export const AQUARIUS_RESOLVE_POOL_BROKEN = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "aquarius",
      pools: [
        {
          poolAddress:
            "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
          name: "XLM/USDC",
          tokens: [
            "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
            "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          ],
          poolType: "constant_product",
          fee: "0.0010",
          totalVolume: 1710736044750252,
        },
      ],
      count: 1,
    }),
  },
];

// ─── Soroswap ─────────────────────────────────────────────────

/** Soroswap resolve_pool — CURRENT BUG: tokenA/tokenB as objects instead of strings */
export const SOROSWAP_RESOLVE_POOL_OBJECT_TOKENS = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "soroswap",
      pools: [
        {
          poolAddress:
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
          tokenA: {
            address:
              "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
            symbol: "XLM",
          },
          tokenB: {
            address:
              "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
            symbol: "USDC",
          },
          reserveA: "1000000000",
          reserveB: "280000000",
          tvlUsd: 560.0,
          totalFeeBps: 30,
        },
      ],
      count: 1,
    }),
  },
];

/** Soroswap resolve_pool — CORRECT format: tokenA/tokenB as plain strings */
export const SOROSWAP_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "soroswap",
      pools: [
        {
          address:
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
          tokenA: "XLM",
          tokenB: "USDC",
          token0_address:
            "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
          token1_address:
            "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          reserveA: "1000000000",
          reserveB: "280000000",
          tvlUsd: 560.0,
          totalFeeBps: 30,
        },
      ],
      count: 1,
    }),
  },
];

// ─── Blend ────────────────────────────────────────────────────

/** Blend resolve_pool — standard format with reserves array */
export const BLEND_RESOLVE_POOL = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "blend",
      pools: [
        {
          poolAddress:
            "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
          name: "Fixed Pool",
          status: "active",
          canSupply: true,
          canBorrow: true,
          reserves: [
            {
              asset:
                "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
              totalSupply: "500000",
              totalBorrow: "120000",
              supplyApy: 9.3,
              borrowApy: 12.5,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.24,
              collateralFactor: 0.75,
              liabilityFactor: 0.8,
              enabled: true,
            },
            {
              asset:
                "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
              symbol: "XLM",
              totalSupply: "1000000",
              totalBorrow: "300000",
              supplyApy: 5.2,
              borrowApy: 8.1,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.3,
              collateralFactor: 0.65,
              liabilityFactor: 0.7,
              enabled: true,
            },
          ],
        },
      ],
      count: 1,
    }),
  },
];

// ─── V2 Fixtures: NEW MCP format (card-ready, matches Zod schemas) ──

/** Aquarius V2 — matches AquaPoolCardProps schema directly */
export const AQUARIUS_RESOLVE_POOL_V2 = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "aquarius",
      pools: [
        {
          address: "CA6PUJLBYKZKUEKLZJMKBZLEKP2OTHANDEOWSFF44FTSYLKQPIICCJBE",
          poolType: "constant_product",
          tokens: [
            { address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA", symbol: "XLM" },
            { address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75", symbol: "USDC" },
          ],
          tokensStr: ["XLM", "USDC"],
          fee: "0.10%",
          tvl: 2850,
          volume24h: 150,
          feeApy: 0.16,
          rewardApy: 5.0,
          totalApy: 5.16,
        },
      ],
      count: 1,
    }),
  },
];

/** Soroswap V2 — actual resolveSoroswap() output format */
export const SOROSWAP_RESOLVE_POOL_V2 = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "soroswap",
      pools: [
        {
          address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTHU2F",
          tokenA: "XLM",
          tokenB: "USDC",
          token0_address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
          token1_address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
          reserveA: "1000000000",
          reserveB: "280000000",
          tvlUsd: 560.0,
          fee: 0.003,
          totalFeeBps: 30,
        },
      ],
      count: 1,
    }),
  },
];

/** Blend V2 — actual resolveBlend() output format */
export const BLEND_RESOLVE_POOL_V2 = [
  {
    type: "text",
    text: JSON.stringify({
      success: true,
      protocol: "blend",
      pools: [
        {
          address: "CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD",
          name: "Fixed Pool",
          status: "active",
          canSupply: true,
          canBorrow: true,
          reserves: [
            {
              asset: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
              symbol: "USDC",
              totalSupply: "500000",
              totalBorrow: "120000",
              supplyApy: 9.3,
              borrowApy: 12.5,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.24,
              collateralFactor: 0.75,
              liabilityFactor: 0.8,
              enabled: true,
            },
            {
              asset: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
              symbol: "XLM",
              totalSupply: "1000000",
              totalBorrow: "300000",
              supplyApy: 5.2,
              borrowApy: 8.1,
              supplyEmissionApy: 0,
              borrowEmissionApy: 0,
              utilization: 0.3,
              collateralFactor: 0.65,
              liabilityFactor: 0.7,
              enabled: true,
            },
          ],
        },
      ],
      count: 1,
    }),
  },
];

// ─── Error / edge cases ───────────────────────────────────────

/** MCP error response — no pools found */
export const EMPTY_MCP_RESULT = [
  {
    type: "text",
    text: JSON.stringify({ success: false, error: "No pools found" }),
  },
];

/** Malformed MCP result — invalid JSON in text field */
export const MALFORMED_MCP_RESULT = [
  { type: "text", text: "not valid json{{{" },
];
