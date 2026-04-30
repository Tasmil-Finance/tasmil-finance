import { PROTOCOL_ICONS } from "@/shared/constants/asset-manifest";

export type PanelType =
  | "pools"
  | "pool"
  | "yield"
  | "positions"
  | "quote"
  | "markets"
  | "orderbook";

export interface PanelField {
  key: string;
  label: string;
  placeholder?: string;
}

export interface PanelConfig {
  id: PanelType;
  title: string;
  endpoint: string; // e.g. "pools", "pool", "yield"
  method: "GET" | "POST";
  fields: PanelField[];
  description?: string;
}

export interface ProtocolConfig {
  id: string;
  name: string;
  icon: string;
  category: "lending" | "dex" | "bridge" | "vault";
  color: string;
  panels: PanelConfig[];
}

// ─── Panel definitions ──────────────────────────────────────────

const POOLS_PANEL: PanelConfig = {
  id: "pools", title: "List Pools", endpoint: "pools", method: "GET",
  fields: [], description: "List all pools/vaults on the current network",
};

const POOL_PANEL: PanelConfig = {
  id: "pool", title: "Pool Detail", endpoint: "pool", method: "GET",
  fields: [{ key: "address", label: "Pool Address", placeholder: "C..." }],
};

const YIELD_PANEL: PanelConfig = {
  id: "yield", title: "Yield Opportunities", endpoint: "yield", method: "GET",
  fields: [], description: "Yield opportunities via getYieldOpportunities()",
};

const POSITIONS_BLEND: PanelConfig = {
  id: "positions", title: "User Positions", endpoint: "positions", method: "GET",
  fields: [
    { key: "pool", label: "Pool Address", placeholder: "C..." },
    { key: "user", label: "User Address", placeholder: "G..." },
  ],
};

const POSITIONS_TEMPLAR: PanelConfig = {
  id: "positions", title: "User Position", endpoint: "positions", method: "GET",
  fields: [
    { key: "market", label: "Market ID", placeholder: "ixlm-ixlmusdc.v1.tmplr.near" },
    { key: "user", label: "NEAR Account (optional)", placeholder: "account.near" },
  ],
};

const QUOTE_PANEL: PanelConfig = {
  id: "quote", title: "Swap Quote", endpoint: "quote", method: "GET",
  fields: [
    { key: "tokenIn", label: "Token In", placeholder: "XLM" },
    { key: "tokenOut", label: "Token Out", placeholder: "USDC" },
    { key: "amount", label: "Amount (stroops)", placeholder: "10000000" },
  ],
};

const MARKETS_PANEL: PanelConfig = {
  id: "markets", title: "Lending Markets", endpoint: "markets", method: "GET",
  fields: [], description: "All lending markets via getLendingMarkets()",
};

const ORDERBOOK_PANEL: PanelConfig = {
  id: "orderbook", title: "Order Book", endpoint: "orderbook", method: "GET",
  fields: [
    { key: "selling", label: "Selling Asset", placeholder: "XLM" },
    { key: "buying", label: "Buying Asset", placeholder: "USDC:GAHP..." },
    { key: "limit", label: "Depth", placeholder: "20" },
  ],
};

// ─── Protocol configs ───────────────────────────────────────────

export const PROTOCOL_CONFIGS: ProtocolConfig[] = [
  {
    id: "blend", name: "Blend Protocol", icon: PROTOCOL_ICONS.blend!,
    category: "lending", color: "#8b5cf6",
    panels: [POOLS_PANEL, POOL_PANEL, YIELD_PANEL, POSITIONS_BLEND, MARKETS_PANEL],
  },
  {
    id: "aquarius", name: "Aquarius", icon: PROTOCOL_ICONS.aquarius!,
    category: "dex", color: "#00B4D8",
    panels: [POOLS_PANEL, POOL_PANEL, YIELD_PANEL, QUOTE_PANEL],
  },
  {
    id: "soroswap", name: "Soroswap", icon: PROTOCOL_ICONS.soroswap!,
    category: "dex", color: "#7B61FF",
    panels: [POOLS_PANEL, YIELD_PANEL, QUOTE_PANEL],
  },
  {
    id: "phoenix", name: "Phoenix", icon: PROTOCOL_ICONS.phoenix!,
    category: "dex", color: "#FF6B35",
    panels: [POOLS_PANEL, POOL_PANEL, YIELD_PANEL, QUOTE_PANEL],
  },
  {
    id: "sdex", name: "Stellar DEX", icon: PROTOCOL_ICONS.sdex!,
    category: "dex", color: "#00C2FF",
    panels: [YIELD_PANEL, QUOTE_PANEL, ORDERBOOK_PANEL],
  },
  {
    id: "allbridge", name: "Allbridge", icon: PROTOCOL_ICONS.allbridge!,
    category: "bridge", color: "#3B82F6",
    panels: [YIELD_PANEL, QUOTE_PANEL],
  },
  {
    id: "defindex", name: "DeFindex", icon: PROTOCOL_ICONS.defindex!,
    category: "vault", color: "#10B981",
    panels: [POOLS_PANEL, POOL_PANEL, YIELD_PANEL],
  },
  {
    id: "templar", name: "Templar", icon: PROTOCOL_ICONS.templar!,
    category: "lending", color: "#10B981",
    panels: [YIELD_PANEL, POSITIONS_TEMPLAR, QUOTE_PANEL, MARKETS_PANEL],
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  lending: "Lending",
  dex: "DEX / AMM",
  bridge: "Bridge",
  vault: "Vaults",
};
