"use client";

import { AccountInfoCard } from "@/features/chat/actions/components/stellar/account-info-card";
import { AccountSetupCard } from "@/features/chat/actions/components/stellar/account-setup-card";
import { BridgeDiscoveryCard } from "@/features/chat/actions/components/stellar/bridge-discovery-card";
import { EarnDiscoveryCard } from "@/features/chat/actions/components/stellar/earn-discovery-card";
import { StrategyPresetCard } from "@/features/chat/actions/components/stellar/strategy-preset-card";

// ─── Mock Data ───────────────────────────────────────────────────

const MOCK_EARN_OPPORTUNITIES = {
  opportunities: [
    {
      protocol: "blend",
      type: "lending",
      name: "Fixed Pool — USDC",
      apy: 9.41,
      tvl: "91050000",
      assets: ["USDC"],
      risk: "low",
      poolAddress: "CBQHNAX...",
      status: "ok",
      supplyApy: 9.41,
      borrowApy: 12.5,
      utilization: 75.2,
      collateralFactor: 0.75,
    },
    {
      protocol: "aquarius",
      type: "lp",
      name: "XLM-USDC",
      apy: 125.4,
      tvl: "44700",
      assets: ["XLM", "USDC"],
      risk: "medium",
      status: "ok",
    },
    {
      protocol: "soroswap",
      type: "lp",
      name: "USDC/EURC",
      apy: 5.6,
      tvl: "27000",
      assets: ["USDC", "EURC"],
      risk: "low",
      status: "ok",
    },
  ],
  count: 3,
  totalScanned: 20,
};

const MOCK_EARN_EMPTY = {
  opportunities: [],
  count: 0,
  totalScanned: 10,
};

const MOCK_EARN_NAN_APY = {
  opportunities: [
    {
      protocol: "blend",
      type: "lending",
      name: "Etherfuse Pool — XLM",
      apy: null,
      tvl: "36000",
      assets: ["XLM"],
      risk: "low",
      status: "ok",
    },
  ],
  count: 1,
  totalScanned: 5,
};

const MOCK_BALANCE_NATIVE = {
  token: {
    asset_type: "native",
    balance: "12.1545542",
  },
};

const MOCK_BALANCE_USDC = {
  token: {
    assetCode: "USDC",
    balance: "0.0000000",
    limit: "922337203685.4775807",
  },
};

const MOCK_BALANCE_MISSING_ASSET = {
  token: {
    balance: "3.389",
  },
};

const MOCK_ACCOUNT_INFO = {
  account: {
    address: "GDQI7LOGDRQRM5OXEIEY7TDHUYEHGQ7RX3KOJU3FNUP6HBDHUGWA3I6R",
    sequence: "267181862420480048",
    subentryCount: 5,
    balances: [
      { code: "AQUA", balance: "0", asset_type: "credit_alphanum4" },
      { code: "BLND", balance: "3.389", asset_type: "credit_alphanum4" },
      { code: "ICE", balance: "0", asset_type: "credit_alphanum4" },
      { code: "USDC", balance: "0", asset_type: "credit_alphanum4" },
      { asset_type: "native", balance: "12.1546" },
    ],
  },
};

const MOCK_BRIDGE_QUOTES = {
  quotes: [
    {
      provider: "allbridge",
      amountIn: "100 USDC",
      amountOut: "99.7 USDC",
      fee: "0.3 USDC",
      feePercent: "0.3",
      estimatedTime: "60",
      crossChainSwap: false,
      status: "ok",
    },
    {
      provider: "near-intents",
      amountIn: "100 USDC",
      amountOut: "99.5 USDC",
      fee: "0.5 USDC",
      feePercent: "0.5",
      estimatedTime: "45",
      crossChainSwap: true,
      status: "ok",
    },
  ],
  best: "allbridge",
};

const MOCK_BRIDGE_EMPTY = { quotes: [], best: "" };

const MOCK_STRATEGY_PRESETS = {
  presets: [
    {
      name: "SAFE",
      estimatedApy: 4.61,
      poolCount: 1,
      poolTypes: ["lending"],
      risks: ["low volatility"],
      topPools: [{ name: "USDC (blend)", apy: 9.4, weightPercent: 98 }],
      description: "Stablecoin-only lending, minimal risk",
    },
    {
      name: "BALANCED",
      estimatedApy: 6.59,
      poolCount: 4,
      poolTypes: ["lending", "lp"],
      risks: ["moderate IL"],
      topPools: [
        { name: "USDC (blend)", apy: 9.4, weightPercent: 38.66 },
        { name: "USDC/EURC (soroswap)", apy: 5.6, weightPercent: 22.59 },
        { name: "USDC/XLM (soroswap)", apy: 5.6, weightPercent: 20.28 },
      ],
      description: "Mix of lending + LP, moderate risk",
    },
    {
      name: "AGGRESSIVE",
      estimatedApy: 7.56,
      poolCount: 4,
      poolTypes: ["lending", "lp"],
      risks: ["high IL", "backstop exposure"],
      topPools: [
        { name: "USDC (blend)", apy: 9.4, weightPercent: 58.67 },
        { name: "USDC/EURC (soroswap)", apy: 5.6, weightPercent: 16.25 },
        { name: "USDC/XLM (soroswap)", apy: 5.6, weightPercent: 15.69 },
      ],
      description: "Higher-yield LP pairs + backstop",
    },
  ],
};

const MOCK_ACCOUNT_STATUS_DEPLOY = {
  has_account: false,
  next_step: "deploy",
  message: "You don't have a Tasmil smart account yet.",
};

const MOCK_ACCOUNT_STATUS_ACTIVE = {
  has_account: true,
  status: "ACTIVE",
  preset: "BALANCED",
  next_step: "active",
  total_value_usd: 1250.5,
  current_apy: 6.59,
  position_count: 4,
};

// ─── Section Component ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">{title}</h3>
      <div className="flex flex-wrap gap-4">{children}</div>
    </div>
  );
}

function CardWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="max-w-[360px]">{children}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function ChatCardsPlaygroundPage() {
  return (
    <div className="space-y-8 p-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold">Chat Cards Playground</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preview AI chat tool result cards with mock data. Test happy paths, empty states, and edge
          cases.
        </p>
      </div>

      {/* ─── EarnDiscoveryCard ─────────────────────────── */}
      <Section title="EarnDiscoveryCard">
        <CardWrapper label="Happy path (3 results)">
          <EarnDiscoveryCard result={MOCK_EARN_OPPORTUNITIES} status="completed" />
        </CardWrapper>
        <CardWrapper label="Empty (0 results)">
          <EarnDiscoveryCard result={MOCK_EARN_EMPTY} status="completed" />
        </CardWrapper>
        <CardWrapper label="Null APY (NaN edge case)">
          <EarnDiscoveryCard result={MOCK_EARN_NAN_APY} status="completed" />
        </CardWrapper>
      </Section>

      {/* ─── AccountInfoCard ──────────────────────────── */}
      <Section title="AccountInfoCard">
        <CardWrapper label="Account info (balances)">
          <AccountInfoCard type="account_info" result={MOCK_ACCOUNT_INFO} status="completed" />
        </CardWrapper>
        <CardWrapper label="Balance: XLM (native)">
          <AccountInfoCard type="balance" result={MOCK_BALANCE_NATIVE} status="completed" />
        </CardWrapper>
        <CardWrapper label="Balance: USDC (trustline)">
          <AccountInfoCard type="balance" result={MOCK_BALANCE_USDC} status="completed" />
        </CardWrapper>
        <CardWrapper label="Balance: missing asset name">
          <AccountInfoCard type="balance" result={MOCK_BALANCE_MISSING_ASSET} status="completed" />
        </CardWrapper>
      </Section>

      {/* ─── BridgeDiscoveryCard ──────────────────────── */}
      <Section title="BridgeDiscoveryCard">
        <CardWrapper label="With quotes (ETH → Stellar)">
          <BridgeDiscoveryCard
            args={{ fromChain: "ethereum", toChain: "stellar", tokenIn: "USDC" }}
            result={MOCK_BRIDGE_QUOTES}
            status="completed"
          />
        </CardWrapper>
        <CardWrapper label="Empty (no routes)">
          <BridgeDiscoveryCard
            args={{ fromChain: "stellar", toChain: "ethereum", tokenIn: "XLM" }}
            result={MOCK_BRIDGE_EMPTY}
            status="completed"
          />
        </CardWrapper>
      </Section>

      {/* ─── StrategyPresetCard ───────────────────────── */}
      <Section title="StrategyPresetCard">
        <CardWrapper label="3 presets">
          <StrategyPresetCard result={MOCK_STRATEGY_PRESETS} status="completed" />
        </CardWrapper>
        <CardWrapper label="Empty presets">
          <StrategyPresetCard result={{ presets: [] }} status="completed" />
        </CardWrapper>
      </Section>

      {/* ─── AccountSetupCard ─────────────────────────── */}
      <Section title="AccountSetupCard">
        <CardWrapper label="No account (deploy)">
          <AccountSetupCard result={MOCK_ACCOUNT_STATUS_DEPLOY} />
        </CardWrapper>
        <CardWrapper label="Active account">
          <AccountSetupCard result={MOCK_ACCOUNT_STATUS_ACTIVE} />
        </CardWrapper>
      </Section>
    </div>
  );
}
