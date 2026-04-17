"use client";

/**
 * Card Playground — /dev/cards
 *
 * Visual inspection page for every chat action card with realistic mock data.
 * Use this to verify data rendering without triggering real AI tool calls.
 */

import { useState } from "react";
import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { PoolInfoCard } from "@/features/chat/actions/components/stellar/pool-info-card";
import { SwapQuoteCard } from "@/features/chat/actions/components/stellar/swap-quote-card";
import { EarnDiscoveryCard } from "@/features/chat/actions/components/stellar/earn-discovery-card";
import { BridgeDiscoveryCard } from "@/features/chat/actions/components/stellar/bridge-discovery-card";
import { BlendExecuteCard } from "@/features/chat/actions/components/stellar/blend-execute-card";
import { StellarExecuteCard } from "@/features/chat/actions/components/stellar/execute-card";
import { TxSubmitCard } from "@/features/chat/actions/components/stellar/tx-submit-card";
import { StreamContext, type StreamContextType } from "@/features/chat/providers/stream-provider";

// Minimal mock stream context so execute cards (which call useStreamContext) don't throw
const MOCK_STREAM = {
  messages: [],
  values: {},
  isLoading: false,
  error: undefined,
  interrupt: undefined,
  submit: async () => {},
  stop: () => {},
  getMessagesMetadata: () => undefined,
} as unknown as StreamContextType;

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_WALLET = "GD6V3KKRLH32PNLZ3T4W37FSRJB5Y2KQHBX5HQMD4NXWL63T4W3T4W";

const mocks = {
  // get_account → account_info
  account_info: {
    success: true,
    account: {
      id: MOCK_WALLET,
      sequence: "48203485028352",
      subentry_count: 4,
      balances: [
        { asset_type: "native", balance: "6980.0000000" },
        { asset_type: "credit_alphanum4", asset_code: "USDC", asset_issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN", balance: "125.5000000" },
        { asset_type: "credit_alphanum4", asset_code: "BLND", asset_issuer: "GDNSSYSCSSJ47ODQKQ3LXFWFIZLBRSVNHAQPCVXPUOYF", balance: "500.0000000" },
      ],
    },
  },

  // get_account → assets
  account_assets: {
    success: true,
    address: MOCK_WALLET,
    count: 3,
    assets: [
      { type: "native", code: "XLM", balance: "6980.0000000" },
      { type: "credit_alphanum4", code: "USDC", balance: "125.5000000" },
      { type: "credit_alphanum4", code: "BLND", balance: "500.0000000" },
    ],
  },

  // resolve_pool → blend → pools[]
  blend_pools: {
    success: true,
    protocol: "blend",
    pools: [
      {
        poolAddress: "CAPBMKXCQFBM5JBXM3BXNPYNL5MMJFQG4NPPXJQ5PRWNKJQNHQNHQNQ",
        name: "RegionalStarterPack",
        status: "setup",
        canSupply: true,
        canBorrow: false,
        reserveCount: 3,
        reserves: [
          { symbol: "XLM", supplyApy: 1.2, borrowApy: 3.5 },
          { symbol: "USDC", supplyApy: 0.18, borrowApy: 0.58 },
          { symbol: "BLND", supplyApy: 0, borrowApy: 0 },
        ],
      },
      {
        poolAddress: "CCEB4HGFCCEB4HGFCCEB4HGFCCEB4HGFCCEB4HGFCCEB4HGF",
        name: "TestnetV2 Pool",
        status: "setup",
        canSupply: true,
        canBorrow: true,
        reserveCount: 2,
        reserves: [
          { symbol: "XLM", supplyApy: 2.1, borrowApy: 5.3 },
          { symbol: "USDC", supplyApy: 0.22, borrowApy: 0.71 },
        ],
      },
    ],
    count: 2,
  },

  // blend_get_reserve_info → reserve
  blend_reserve: {
    success: true,
    reserve: {
      asset: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UGRKVSG5DZHHQD57OKUNO",
      symbol: "USDC",
      totalSupply: "92755.123",
      totalBorrow: "35132.456",
      supplyApy: 0.18,
      borrowApy: 0.58,
      supplyEmissionApy: 1.23,
      borrowEmissionApy: 0.89,
      collateralFactor: 0.95,
      liabilityFactor: 1.0526,
      utilization: 0.3788,
      targetUtilization: 0.7,
      maxUtilization: 0.9,
      supplyCap: "150000",
      reserveIndex: 1,
    },
  },

  // blend_get_pool_info → pool nested
  blend_pool_info: {
    success: true,
    pool: {
      address: "CAPBMKXCQFBM5JBXM3BXNPYNL5MMJFQG4NPPXJQ5PRWNKJQNHQNHQNQ",
      status: "Active",
      reserveCount: 3,
      reserves: [
        { address: "CCW67", symbol: "USDC", explorerUrl: "#" },
        { address: "XLM", symbol: "XLM", explorerUrl: "#" },
        { address: "GDNSS", symbol: "BLND", explorerUrl: "#" },
      ],
    },
  },

  // blend_get_user_position → enriched positions
  blend_user_position: {
    success: true,
    hasPosition: true,
    poolAddress: "CAPB...5PRW",
    positions: [
      {
        reserveIndex: 0,
        asset: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        symbol: "XLM",
        isCollateral: true,
        isSupply: false,
        isBorrow: false,
        suppliedAmount: "1.000000",
        borrowedAmount: null,
        supplyApy: 0.11,
        borrowApy: 2.45,
        collateralFactor: 0.75,
        liabilityFactor: 1.25,
        assetPrice: 0.1066,
        borrowCapacityUsd: "0.0800",
        borrowedUsd: null,
        totalSupply: "12000.0000",
        totalBorrow: "7000.0000",
      },
    ],
  },

  // blend_user_position empty
  blend_user_position_empty: {
    success: true,
    hasPosition: false,
    poolAddress: "CAPB...5PRW",
    positions: [],
  },

  // swap_get_quote / compare_swap
  swap_quote: {
    success: true,
    quotes: [
      {
        protocol: "soroswap",
        status: "ok",
        amountIn: "100.0000000",
        amountOut: "22.4891000",
        fee: "0.3000000",
        feePercent: 0.3,
        priceImpact: 0.12,
        route: ["XLM", "USDC"],
        estimatedTime: "~5s",
      },
      {
        protocol: "phoenix",
        status: "ok",
        amountIn: "100.0000000",
        amountOut: "22.3102000",
        fee: "0.2500000",
        feePercent: 0.25,
        priceImpact: 0.08,
        route: ["XLM", "USDC"],
        estimatedTime: "~5s",
      },
      {
        protocol: "sdex",
        status: "ok",
        amountIn: "100.0000000",
        amountOut: "22.5012000",
        fee: "0.0000000",
        feePercent: 0,
        priceImpact: 0.05,
        route: ["XLM", "USDC"],
        estimatedTime: "~3s",
      },
    ],
    best: "sdex",
  },

  // discover (earn)
  earn_discovery: {
    success: true,
    opportunities: [
      {
        protocol: "blend",
        type: "lending",
        name: "USDC Supply",
        apy: 1.41,
        tvl: 92755,
        assets: ["USDC"],
        risk: "low",
        status: "ok",
        poolAddress: "CAPB...5PRW",
        supplyApy: 0.18,
        borrowApy: 0.58,
        utilization: 0.38,
        collateralFactor: 0.95,
      },
      {
        protocol: "soroswap",
        type: "liquidity",
        name: "XLM/USDC LP",
        apy: 12.5,
        tvl: 245000,
        assets: ["XLM", "USDC"],
        risk: "medium",
        status: "ok",
        poolAddress: "CDRA...YPQL",
        fee: "0.3%",
      },
      {
        protocol: "phoenix",
        type: "staking",
        name: "Phoenix Stake",
        apy: 8.2,
        tvl: 58000,
        assets: ["PHO"],
        risk: "medium",
        status: "ok",
        poolAddress: "CDPH...NQMO",
      },
    ],
    count: 3,
    totalScanned: 12,
  },

  // bridge
  bridge_quote: {
    success: true,
    quotes: [
      {
        provider: "allbridge",
        status: "ok",
        amountIn: "100",
        amountOut: "98.5",
        fee: "1.5",
        feePercent: 1.5,
        estimatedTime: "~10min",
        crossChainSwap: false,
      },
      {
        provider: "NEAR Intents",
        status: "ok",
        amountIn: "100",
        amountOut: "99.1",
        fee: "0.9",
        feePercent: 0.9,
        estimatedTime: "~2min",
        crossChainSwap: true,
        depositAddress: "intents.near",
        depositMemo: "tx123",
      },
    ],
    best: "NEAR Intents",
  },

  // blend execute (HITL sign card)
  blend_execute: {
    success: true,
    operation: "deposit",
    xdr: "AAAAAgAAAAB...AAAA",
    estimatedFee: "1234567",
  },

  // soroswap execute (non-blend HITL)
  soroswap_execute: {
    success: true,
    operation: "swap",
    xdr: "AAAAAgAAAAB...BBBB",
    estimatedFee: "987654",
    protocol: "soroswap",
    route: ["XLM", "USDC"],
  },

  // tx submit
  tx_success: {
    success: true,
    result: {
      id: "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
      hash: "a3f1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
    },
  },

  // tx submit error
  tx_error: {
    success: false,
    error: "Transaction failed: insufficient balance",
  },
};

// ── Playground sections ────────────────────────────────────────────────────────

type Section = {
  id: string;
  label: string;
  cards: CardEntry[];
};

type CardEntry = {
  title: string;
  description: string;
  element: React.ReactNode;
};

function makeCards(): Section[] {
  return [
    {
      id: "account",
      label: "Account Info",
      cards: [
        {
          title: "Account Overview",
          description: "get_account → type=account_info",
          element: <AccountInfoCard type="account_info" args={{}} result={mocks.account_info} status="complete" />,
        },
        {
          title: "Asset List",
          description: "get_account → type=account_info, query=assets",
          element: <AccountInfoCard type="account_info" args={{ query: "assets" }} result={mocks.account_assets} status="complete" />,
        },
        {
          title: "Blend Position (with data)",
          description: "blend_get_user_position → type=blend_user_position",
          element: (
            <AccountInfoCard
              type="blend_user_position"
              args={{ poolAddress: "CAPBMKXCQFBM5JBXM3BXNPYNL5MMJFQG4NPPXJQ" }}
              result={mocks.blend_user_position}
              status="complete"
            />
          ),
        },
        {
          title: "Blend Position (empty)",
          description: "blend_get_user_position → no positions",
          element: (
            <AccountInfoCard
              type="blend_user_position"
              args={{ poolAddress: "CCEB4HGFCCEB4HGFCCEB4HGF" }}
              result={mocks.blend_user_position_empty}
              status="complete"
            />
          ),
        },
      ],
    },
    {
      id: "pool",
      label: "Pool Info",
      cards: [
        {
          title: "Blend Pool List",
          description: "resolve_pool protocol=blend → pools[]",
          element: (
            <PoolInfoCard
              type="pool_discovery"
              args={{ protocol: "blend" }}
              result={mocks.blend_pools}
              status="complete"
            />
          ),
        },
        {
          title: "Blend Reserve Info",
          description: "blend_get_reserve_info → reserve{}",
          element: (
            <PoolInfoCard
              type="blend_reserve_info"
              args={{ protocol: "blend" }}
              result={mocks.blend_reserve}
              status="complete"
            />
          ),
        },
        {
          title: "Blend Pool Info (nested)",
          description: "blend_get_pool_info → pool{ address, reserves[] }",
          element: (
            <PoolInfoCard
              type="blend_pool_info"
              args={{ protocol: "blend" }}
              result={mocks.blend_pool_info}
              status="complete"
            />
          ),
        },
        {
          title: "Loading state",
          description: "Tool in-flight",
          element: <PoolInfoCard type="pool_info" args={{}} result={null} status="pending" />,
        },
      ],
    },
    {
      id: "swap",
      label: "Swap Quote",
      cards: [
        {
          title: "Multi-protocol Quote",
          description: "compare_swap → quotes[] with best",
          element: (
            <SwapQuoteCard
              type="swap_quote"
              args={{ tokenIn: "XLM", tokenOut: "USDC", amount: "100" }}
              result={mocks.swap_quote}
              status="complete"
            />
          ),
        },
      ],
    },
    {
      id: "earn",
      label: "Earn Discovery",
      cards: [
        {
          title: "Earn Opportunities",
          description: "discover → opportunities[]",
          element: (
            <EarnDiscoveryCard
              type="earn_discovery"
              args={{}}
              result={mocks.earn_discovery}
              status="complete"
            />
          ),
        },
      ],
    },
    {
      id: "bridge",
      label: "Bridge",
      cards: [
        {
          title: "Bridge Quotes",
          description: "allbridge_get_quote / bridge_get_quote",
          element: (
            <BridgeDiscoveryCard
              type="bridge_quote"
              args={{ fromChain: "Ethereum", toChain: "Stellar", fromToken: "USDC", toToken: "USDC", amount: "100" }}
              result={mocks.bridge_quote}
              status="complete"
            />
          ),
        },
      ],
    },
    {
      id: "execute",
      label: "Execute (Sign)",
      cards: [
        {
          title: "Blend Deposit",
          description: "blend_deposit → BlendExecuteCard (auto-sign)",
          element: (
            <BlendExecuteCard
              operation="blend_supply"
              args={{ amount: "10", from: MOCK_WALLET, poolAddress: "CAPB...5PRW", asset: "XLM", estimatedFee: "0.1234567 XLM", xdr: mocks.blend_execute.xdr }}
              result={mocks.blend_execute}
              status="executing"
              toolCallId="mock-blend-deposit-1"
            />
          ),
        },
        {
          title: "Blend Borrow",
          description: "blend_borrow → BlendExecuteCard",
          element: (
            <BlendExecuteCard
              operation="blend_borrow"
              args={{ amount: "50", from: MOCK_WALLET, poolAddress: "CAPB...5PRW", asset: "USDC", estimatedFee: "0.1234567 XLM", xdr: mocks.blend_execute.xdr }}
              result={null}
              status="executing"
              toolCallId="mock-blend-borrow-1"
            />
          ),
        },
        {
          title: "Swap Execute",
          description: "swap_build_transaction → StellarExecuteCard (HITL)",
          element: (
            <StellarExecuteCard
              operation="swap_execute"
              args={{ amount: "100", from: MOCK_WALLET, protocol: "soroswap", route: ["XLM", "USDC"], estimatedFee: "0.00987654 XLM", xdr: mocks.soroswap_execute.xdr }}
              result={null}
              status="executing"
              toolCallId="mock-swap-1"
            />
          ),
        },
        {
          title: "Tx Submitted",
          description: "submit_transaction → success",
          element: (
            <TxSubmitCard
              operation="tx_submit"
              args={{}}
              result={mocks.tx_success}
              status="complete"
              toolCallId="mock-tx-1"
            />
          ),
        },
        {
          title: "Tx Failed",
          description: "submit_transaction → error",
          element: (
            <TxSubmitCard
              operation="tx_submit"
              args={{}}
              result={mocks.tx_error}
              status="error"
              toolCallId="mock-tx-error-1"
            />
          ),
        },
      ],
    },
  ];
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CardsPlayground() {
  const sections = makeCards();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const visible = activeSection
    ? sections.filter((s) => s.id === activeSection)
    : sections;

  return (
    <StreamContext.Provider value={MOCK_STREAM}>
    <div className="min-h-screen bg-background">
      <div className="border-b px-6 py-4">
        <h1 className="font-semibold text-lg">Card UI Playground</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Inspect every chat action card with realistic MCP mock data.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => setActiveSection(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              !activeSection ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
            }`}
          >
            All
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(activeSection === s.id ? null : s.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                activeSection === s.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-6 space-y-10">
        {visible.map((section) => (
          <section key={section.id}>
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wider mb-4">
              {section.label}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {section.cards.map((card) => (
                <div key={card.title} className="space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-sm">{card.title}</span>
                  </div>
                  <p className="text-muted-foreground text-xs font-mono">{card.description}</p>
                  <div className="rounded-lg border bg-card p-1">
                    {card.element}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
    </StreamContext.Provider>
  );
}
