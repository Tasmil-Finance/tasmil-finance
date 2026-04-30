/**
 * Card registry — single source of truth mapping tool names / panel IDs
 * to shared card components and their data adapters.
 *
 * Used by both:
 *   - Playground: query-panel.tsx result rendering
 *   - Chat: use-defi-tool-renderers.tsx CopilotKit registration
 */

import type { ComponentType } from "react";
import {
  normalizePoolFromSdk,
  normalizePoolsFromSdk,
  normalizeReserveFromSdk,
  normalizePositionsFromSdk,
  normalizeBackstopFromSdk,
  normalizeBackstopBalanceFromSdk,
} from "../adapters/from-sdk";
import {
  normalizePoolFromMcp,
  normalizePoolsFromMcp,
  normalizeReserveFromMcp,
  normalizePositionsFromMcp,
  normalizeBackstopFromMcp,
  normalizeBackstopBalanceFromMcp,
  normalizeTxFromMcp,
} from "../adapters/from-mcp";
import {
  normalizeAquaPoolFromSdk,
  normalizeAquaPoolsFromSdk,
  normalizeAquaPositionsFromSdk,
} from "../adapters/aquarius-from-sdk";
import {
  normalizeSoroswapPoolFromSdk,
  normalizeSoroswapPoolsFromSdk,
  normalizeSoroswapPositionsFromSdk,
} from "../adapters/soroswap-from-sdk";
import {
  normalizeSoroswapPoolFromMcp,
  normalizeSoroswapPoolsFromMcp,
  normalizeSoroswapPositionsFromMcp,
  normalizeSoroswapTxFromMcp,
} from "../adapters/soroswap-from-mcp";
import {
  normalizeAquaPoolFromMcp,
  normalizeAquaPoolsFromMcp,
  normalizeAquaPositionsFromMcp,
  normalizeAquaTxFromMcp,
} from "../adapters/aquarius-from-mcp";
import {
  normalizeAllbridgePoolsFromSdk,
  normalizeAllbridgePoolInfoFromSdk,
  normalizeAllbridgeUserBalanceFromSdk,
  normalizeAllbridgeQuoteFromSdk,
  normalizeAllbridgeRoutesFromSdk,
} from "../adapters/allbridge-from-sdk";
import {
  normalizeAllbridgePoolsFromMcp,
  normalizeAllbridgePoolInfoFromMcp,
  normalizeAllbridgeUserBalanceFromMcp,
  normalizeAllbridgeQuoteFromMcp,
  normalizeAllbridgeRoutesFromMcp,
  normalizeAllbridgeTxFromMcp,
} from "../adapters/allbridge-from-mcp";

// ─── Registry entry types ───────────────────────────────────────

export interface InfoCardEntry {
  toolName: string;
  type: string;
  panelId?: string;
  component: ComponentType<any>;
  fromSdk: (data: Record<string, unknown>) => unknown;
  fromMcp: (result: unknown) => unknown;
  cardPropName: string; // prop name to pass normalized data (e.g., "pool", "pools", "reserve", "data")
}

export interface OperationCardEntry {
  toolName: string;
  operation: string;
  component: ComponentType<any>;
  fromMcp: (result: unknown, args?: Record<string, unknown>) => unknown;
}

// ─── Lazy imports to avoid circular dependencies ────────────────
// Components are loaded lazily so this file can be imported from any context.

let _BlendPoolsCard: ComponentType<any> | null = null;
let _BlendPoolDetailCard: ComponentType<any> | null = null;
let _BlendReserveCard: ComponentType<any> | null = null;
let _BlendPositionsCard: ComponentType<any> | null = null;
let _BlendTxCard: ComponentType<any> | null = null;
let _BlendBackstopInfoCard: ComponentType<any> | null = null;
let _BlendBackstopBalanceCard: ComponentType<any> | null = null;

function getBlendPoolsCard() {
  if (!_BlendPoolsCard) {
    _BlendPoolsCard = require("../cards/blend/blend-pools-card").BlendPoolsCard;
  }
  return _BlendPoolsCard!;
}

function getBlendPoolDetailCard() {
  if (!_BlendPoolDetailCard) {
    _BlendPoolDetailCard = require("../cards/blend/blend-pool-detail-card").BlendPoolDetailCard;
  }
  return _BlendPoolDetailCard!;
}

function getBlendReserveCard() {
  if (!_BlendReserveCard) {
    _BlendReserveCard = require("../cards/blend/blend-reserve-card").BlendReserveCard;
  }
  return _BlendReserveCard!;
}

function getBlendPositionsCard() {
  if (!_BlendPositionsCard) {
    _BlendPositionsCard = require("../cards/blend/blend-positions-card").BlendPositionsCard;
  }
  return _BlendPositionsCard!;
}

function getBlendTxCard() {
  if (!_BlendTxCard) {
    _BlendTxCard = require("../cards/blend/blend-tx-card").BlendTxCard;
  }
  return _BlendTxCard!;
}

function getBlendBackstopInfoCard() {
  if (!_BlendBackstopInfoCard) {
    _BlendBackstopInfoCard = require("../cards/blend/blend-backstop-info-card").BlendBackstopInfoCard;
  }
  return _BlendBackstopInfoCard!;
}

function getBlendBackstopBalanceCard() {
  if (!_BlendBackstopBalanceCard) {
    _BlendBackstopBalanceCard = require("../cards/blend/blend-backstop-balance-card").BlendBackstopBalanceCard;
  }
  return _BlendBackstopBalanceCard!;
}

// ─── Aquarius lazy imports ─────────────────────────────────────

let _AquaPoolsCard: ComponentType<any> | null = null;
let _AquaPoolDetailCard: ComponentType<any> | null = null;
let _AquaPositionsCard: ComponentType<any> | null = null;
let _AquaQuoteCard: ComponentType<any> | null = null;
let _AquaTxCard: ComponentType<any> | null = null;

function getAquaPoolsCard() {
  if (!_AquaPoolsCard) {
    _AquaPoolsCard = require("../cards/aquarius/aqua-pools-card").AquaPoolsCard;
  }
  return _AquaPoolsCard!;
}

function getAquaPoolDetailCard() {
  if (!_AquaPoolDetailCard) {
    _AquaPoolDetailCard = require("../cards/aquarius/aqua-pool-detail-card").AquaPoolDetailCard;
  }
  return _AquaPoolDetailCard!;
}

function getAquaPositionsCard() {
  if (!_AquaPositionsCard) {
    _AquaPositionsCard = require("../cards/aquarius/aqua-positions-card").AquaPositionsCard;
  }
  return _AquaPositionsCard!;
}

export function getAquaQuoteCard() {
  if (!_AquaQuoteCard) {
    _AquaQuoteCard = require("../cards/aquarius/aqua-quote-card").AquaQuoteCard;
  }
  return _AquaQuoteCard!;
}

function getAquaTxCard() {
  if (!_AquaTxCard) {
    _AquaTxCard = require("../cards/aquarius/aqua-tx-card").AquaTxCard;
  }
  return _AquaTxCard!;
}

// ─── Info card registry ──────────────────────────���──────────────

export const BLEND_INFO_CARDS: InfoCardEntry[] = [
  {
    toolName: "blend_get_pool_info",
    type: "blend_pool_info",
    panelId: "pool-info",
    get component() { return getBlendPoolDetailCard(); },
    fromSdk: (data) => normalizePoolFromSdk(data),
    fromMcp: (result) => normalizePoolFromMcp(result),
    cardPropName: "pool",
  },
  {
    toolName: "blend_get_reserve_info",
    type: "blend_reserve_info",
    panelId: "reserve",
    get component() { return getBlendReserveCard(); },
    fromSdk: (data) => normalizeReserveFromSdk(data),
    fromMcp: (result) => normalizeReserveFromMcp(result),
    cardPropName: "reserve",
  },
  {
    toolName: "blend_get_user_position",
    type: "blend_user_position",
    panelId: "positions",
    get component() { return getBlendPositionsCard(); },
    fromSdk: (data) => normalizePositionsFromSdk(data),
    fromMcp: (result) => normalizePositionsFromMcp(result),
    cardPropName: "data",
  },
  {
    toolName: "blend_backstop_get_user_balance",
    type: "blend_backstop_balance",
    panelId: "q4w",
    get component() { return getBlendBackstopBalanceCard(); },
    fromSdk: (data) => normalizeBackstopBalanceFromSdk(data),
    fromMcp: (result) => normalizeBackstopBalanceFromMcp(result),
    cardPropName: "data",
  },
  {
    toolName: "blend_backstop_get_pool_data",
    type: "blend_backstop_info",
    panelId: "backstop",
    get component() { return getBlendBackstopInfoCard(); },
    fromSdk: (data) => normalizeBackstopFromSdk(data),
    fromMcp: (result) => normalizeBackstopFromMcp(result),
    cardPropName: "backstop",
  },
  // Pools list (multiple)
  {
    toolName: "resolve_pool",
    type: "pool_discovery",
    panelId: "pools",
    get component() { return getBlendPoolsCard(); },
    fromSdk: (data) => normalizePoolsFromSdk(data),
    fromMcp: (result) => normalizePoolsFromMcp(result),
    cardPropName: "pools",
  },
];

// ─── Operation card registry ────────────────────────────────────

export const BLEND_OPERATION_CARDS: OperationCardEntry[] = [
  { toolName: "blend_deposit", operation: "blend_supply", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_borrow", operation: "blend_borrow", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_repay", operation: "blend_repay", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_withdraw", operation: "blend_withdraw", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_toggle_collateral", operation: "blend_toggle_collateral", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_claim_emissions", operation: "blend_claim", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_backstop_deposit", operation: "backstop_deposit", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_backstop_queue_withdrawal", operation: "backstop_queue", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_backstop_dequeue_withdrawal", operation: "backstop_dequeue", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
  { toolName: "blend_backstop_withdraw", operation: "backstop_withdraw", get component() { return getBlendTxCard(); }, fromMcp: normalizeTxFromMcp },
];

// ─── Aquarius info card registry ────────────────────────────────

export const AQUARIUS_INFO_CARDS: InfoCardEntry[] = [
  {
    toolName: "aquarius_get_pool_info",
    type: "aquarius_pool_info",
    panelId: "aqua-pool-info",
    get component() { return getAquaPoolDetailCard(); },
    fromSdk: (data) => normalizeAquaPoolFromSdk(data),
    fromMcp: (result) => normalizeAquaPoolFromMcp(result),
    cardPropName: "pool",
  },
  {
    toolName: "aquarius_list_pools",
    type: "aquarius_pools",
    panelId: "aqua-pools",
    get component() { return getAquaPoolsCard(); },
    fromSdk: (data) => normalizeAquaPoolsFromSdk(data),
    fromMcp: (result) => normalizeAquaPoolsFromMcp(result),
    cardPropName: "pools",
  },
  {
    toolName: "aquarius_track_liquidity",
    type: "aquarius_positions",
    panelId: "aqua-positions",
    get component() { return getAquaPositionsCard(); },
    fromSdk: (data) => normalizeAquaPositionsFromSdk(data),
    fromMcp: (result) => normalizeAquaPositionsFromMcp(result),
    cardPropName: "data",
  },
];

// ─── Aquarius operation card registry ───────────────────────────

export const AQUARIUS_OPERATION_CARDS: OperationCardEntry[] = [
  { toolName: "aquarius_add_liquidity", operation: "add_liquidity", get component() { return getAquaTxCard(); }, fromMcp: normalizeAquaTxFromMcp },
  { toolName: "aquarius_withdraw_liquidity", operation: "withdraw_liquidity", get component() { return getAquaTxCard(); }, fromMcp: normalizeAquaTxFromMcp },
  { toolName: "aquarius_swap", operation: "swap", get component() { return getAquaTxCard(); }, fromMcp: normalizeAquaTxFromMcp },
  { toolName: "aquarius_claim_rewards", operation: "claim_rewards", get component() { return getAquaTxCard(); }, fromMcp: normalizeAquaTxFromMcp },
];

// ─── Soroswap lazy imports ─────────────────────────────────────

let _SoroswapPoolsCard: ComponentType<any> | null = null;
let _SoroswapPoolDetailCard: ComponentType<any> | null = null;
let _SoroswapPositionsCard: ComponentType<any> | null = null;
let _SoroswapTxCard: ComponentType<any> | null = null;

function getSoroswapPoolsCard() {
  if (!_SoroswapPoolsCard) _SoroswapPoolsCard = require("../cards/soroswap/soroswap-pools-card").SoroswapPoolsCard;
  return _SoroswapPoolsCard!;
}
function getSoroswapPoolDetailCard() {
  if (!_SoroswapPoolDetailCard) _SoroswapPoolDetailCard = require("../cards/soroswap/soroswap-pool-detail-card").SoroswapPoolDetailCard;
  return _SoroswapPoolDetailCard!;
}
function getSoroswapPositionsCard() {
  if (!_SoroswapPositionsCard) _SoroswapPositionsCard = require("../cards/soroswap/soroswap-positions-card").SoroswapPositionsCard;
  return _SoroswapPositionsCard!;
}
function getSoroswapTxCard() {
  if (!_SoroswapTxCard) _SoroswapTxCard = require("../cards/soroswap/soroswap-tx-card").SoroswapTxCard;
  return _SoroswapTxCard!;
}

// ─── Soroswap info card registry ────────────────────────────────

export const SOROSWAP_INFO_CARDS: InfoCardEntry[] = [
  {
    toolName: "swap_get_pools",
    type: "soroswap_pools",
    panelId: "swap-pools",
    get component() { return getSoroswapPoolsCard(); },
    fromSdk: (data) => normalizeSoroswapPoolsFromSdk(data),
    fromMcp: (result) => normalizeSoroswapPoolsFromMcp(result),
    cardPropName: "pools",
  },
  {
    toolName: "swap_get_pool",
    type: "soroswap_pool_info",
    panelId: "swap-pool",
    get component() { return getSoroswapPoolDetailCard(); },
    fromSdk: (data) => normalizeSoroswapPoolFromSdk(data),
    fromMcp: (result) => normalizeSoroswapPoolFromMcp(result),
    cardPropName: "pool",
  },
  {
    toolName: "swap_get_user_positions",
    type: "soroswap_positions",
    panelId: "swap-positions",
    get component() { return getSoroswapPositionsCard(); },
    fromSdk: (data) => normalizeSoroswapPositionsFromSdk(data),
    fromMcp: (result) => normalizeSoroswapPositionsFromMcp(result),
    cardPropName: "data",
  },
];

// ─── Soroswap operation card registry ───────────────────────────

export const SOROSWAP_OPERATION_CARDS: OperationCardEntry[] = [
  { toolName: "swap_build_transaction", operation: "swap", get component() { return getSoroswapTxCard(); }, fromMcp: normalizeSoroswapTxFromMcp },
  { toolName: "swap_add_liquidity", operation: "add_liquidity", get component() { return getSoroswapTxCard(); }, fromMcp: normalizeSoroswapTxFromMcp },
  { toolName: "swap_remove_liquidity", operation: "remove_liquidity", get component() { return getSoroswapTxCard(); }, fromMcp: normalizeSoroswapTxFromMcp },
];

// ─── Allbridge lazy imports ───────────────────────────────────

let _AllbridgePoolsCard: ComponentType<any> | null = null;
let _AllbridgePoolInfoCard: ComponentType<any> | null = null;
let _AllbridgeUserBalanceCard: ComponentType<any> | null = null;
let _AllbridgeQuoteCard: ComponentType<any> | null = null;
let _AllbridgeRoutesCard: ComponentType<any> | null = null;
let _AllbridgeTxCard: ComponentType<any> | null = null;

function getAllbridgePoolsCard() {
  if (!_AllbridgePoolsCard) _AllbridgePoolsCard = require("../cards/allbridge/allbridge-pools-card").AllbridgePoolsCard;
  return _AllbridgePoolsCard!;
}
function getAllbridgePoolInfoCard() {
  if (!_AllbridgePoolInfoCard) _AllbridgePoolInfoCard = require("../cards/allbridge/allbridge-pool-info-card").AllbridgePoolInfoCard;
  return _AllbridgePoolInfoCard!;
}
function getAllbridgeUserBalanceCard() {
  if (!_AllbridgeUserBalanceCard) _AllbridgeUserBalanceCard = require("../cards/allbridge/allbridge-user-balance-card").AllbridgeUserBalanceCard;
  return _AllbridgeUserBalanceCard!;
}
function getAllbridgeQuoteCard() {
  if (!_AllbridgeQuoteCard) _AllbridgeQuoteCard = require("../cards/allbridge/allbridge-quote-card").AllbridgeQuoteCard;
  return _AllbridgeQuoteCard!;
}
function getAllbridgeRoutesCard() {
  if (!_AllbridgeRoutesCard) _AllbridgeRoutesCard = require("../cards/allbridge/allbridge-routes-card").AllbridgeRoutesCard;
  return _AllbridgeRoutesCard!;
}
function getAllbridgeTxCard() {
  if (!_AllbridgeTxCard) _AllbridgeTxCard = require("../cards/allbridge/allbridge-tx-card").AllbridgeTxCard;
  return _AllbridgeTxCard!;
}

// ─── Allbridge info card registry ─────────────────────────────

export const ALLBRIDGE_INFO_CARDS: InfoCardEntry[] = [
  {
    toolName: "allbridge_pool_list",
    type: "allbridge_pool_list",
    panelId: "allbridge-pools",
    get component() { return getAllbridgePoolsCard(); },
    fromSdk: (data) => normalizeAllbridgePoolsFromSdk(data),
    fromMcp: (result) => normalizeAllbridgePoolsFromMcp(result),
    cardPropName: "pools",
  },
  {
    toolName: "allbridge_pool_info",
    type: "allbridge_pool_info",
    panelId: "allbridge-pool-info",
    get component() { return getAllbridgePoolInfoCard(); },
    fromSdk: (data) => normalizeAllbridgePoolInfoFromSdk(data),
    fromMcp: (result) => normalizeAllbridgePoolInfoFromMcp(result),
    cardPropName: "data",
  },
  {
    toolName: "allbridge_pool_user_balance",
    type: "allbridge_user_balance",
    panelId: "allbridge-user-balance",
    get component() { return getAllbridgeUserBalanceCard(); },
    fromSdk: (data) => normalizeAllbridgeUserBalanceFromSdk(data),
    fromMcp: (result) => normalizeAllbridgeUserBalanceFromMcp(result),
    cardPropName: "data",
  },
  {
    toolName: "allbridge_get_quote",
    type: "allbridge_quote",
    panelId: "allbridge-quote",
    get component() { return getAllbridgeQuoteCard(); },
    fromSdk: (data) => normalizeAllbridgeQuoteFromSdk(data),
    fromMcp: (result) => normalizeAllbridgeQuoteFromMcp(result),
    cardPropName: "quote",
  },
  {
    toolName: "allbridge_get_routes",
    type: "allbridge_routes",
    panelId: "allbridge-routes",
    get component() { return getAllbridgeRoutesCard(); },
    fromSdk: (data) => normalizeAllbridgeRoutesFromSdk(data),
    fromMcp: (result) => normalizeAllbridgeRoutesFromMcp(result),
    cardPropName: "routes",
  },
];

// ─── Allbridge operation card registry ────────────────────────

export const ALLBRIDGE_OPERATION_CARDS: OperationCardEntry[] = [
  { toolName: "allbridge_build_transaction", operation: "bridge", get component() { return getAllbridgeTxCard(); }, fromMcp: normalizeAllbridgeTxFromMcp },
  { toolName: "allbridge_pool_deposit", operation: "pool-deposit", get component() { return getAllbridgeTxCard(); }, fromMcp: normalizeAllbridgeTxFromMcp },
  { toolName: "allbridge_pool_withdraw", operation: "pool-withdraw", get component() { return getAllbridgeTxCard(); }, fromMcp: normalizeAllbridgeTxFromMcp },
  { toolName: "allbridge_pool_claim_rewards", operation: "claim-rewards", get component() { return getAllbridgeTxCard(); }, fromMcp: normalizeAllbridgeTxFromMcp },
];

// ─── Combined registries ────────────────────────────────────────

const ALL_INFO_CARDS = [...BLEND_INFO_CARDS, ...AQUARIUS_INFO_CARDS, ...SOROSWAP_INFO_CARDS, ...ALLBRIDGE_INFO_CARDS];
const ALL_OPERATION_CARDS = [...BLEND_OPERATION_CARDS, ...AQUARIUS_OPERATION_CARDS, ...SOROSWAP_OPERATION_CARDS, ...ALLBRIDGE_OPERATION_CARDS];

// ─── Lookup helpers ─────────────────────────────────────────────

export function findInfoCard(toolName: string): InfoCardEntry | undefined {
  return ALL_INFO_CARDS.find((e) => e.toolName === toolName);
}

export function findOperationCard(toolName: string): OperationCardEntry | undefined {
  return ALL_OPERATION_CARDS.find((e) => e.toolName === toolName);
}

export function findInfoCardByPanelId(panelId: string): InfoCardEntry | undefined {
  return ALL_INFO_CARDS.find((e) => e.panelId === panelId);
}
