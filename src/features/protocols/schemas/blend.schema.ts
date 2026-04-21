import { z } from "zod";
import { apySchema, statusSchema } from "./common.schema";

// ─── Reserve (per-asset metrics) ────────────────────────────────

export const reserveCardPropsSchema = z.object({
  assetAddress: z.string(),
  symbol: z.string(),
  supplyApy: apySchema,
  borrowApy: apySchema,
  totalSupplied: z.number().nullable().optional(),
  totalBorrowed: z.number().nullable().optional(),
  utilization: z.number().nullable().optional(),
  collateralFactor: z.number().nullable().optional(),
  liabilityFactor: z.number().nullable().optional(),
  decimals: z.number().optional(),
  supplyEmissionApy: z.number().nullable().optional(),
  borrowEmissionApy: z.number().nullable().optional(),
  supplyCap: z.number().nullable().optional(),
  reserveIndex: z.number().optional(),
});
export type ReserveCardProps = z.infer<typeof reserveCardPropsSchema>;

// ─── Pool ───────────────────────────────────────────────────────

export const poolCardPropsSchema = z.object({
  address: z.string(),
  name: z.string(),
  status: statusSchema.catch("unknown"),
  reserves: z.array(reserveCardPropsSchema),
  backstopRate: z.number().optional(),
});
export type PoolCardProps = z.infer<typeof poolCardPropsSchema>;

// ─── Position (user's holdings in a pool) ───────────────────────

export const positionItemSchema = z.object({
  asset: z.string(),
  symbol: z.string(),
  isCollateral: z.boolean().optional(),
  isSupply: z.boolean().optional(),
  isBorrow: z.boolean().optional(),
  suppliedAmount: z.union([z.string(), z.number()]).nullable().optional(),
  borrowedAmount: z.union([z.string(), z.number()]).nullable().optional(),
  supplyApy: apySchema,
  borrowApy: apySchema,
  netApy: z.union([z.string(), z.number()]).nullable().optional(),
  supplyEmissionApy: z.number().nullable().optional(),
  borrowEmissionApy: z.number().nullable().optional(),
  collateralFactor: z.number().nullable().optional(),
  liabilityFactor: z.number().nullable().optional(),
  assetPrice: z.number().nullable().optional(),
  suppliedUsd: z.union([z.string(), z.number()]).nullable().optional(),
  borrowedUsd: z.union([z.string(), z.number()]).nullable().optional(),
  borrowCapacityUsd: z.union([z.string(), z.number()]).nullable().optional(),
});
export type PositionItem = z.infer<typeof positionItemSchema>;

export const positionSummarySchema = z.object({
  totalSuppliedUsd: z.union([z.string(), z.number()]).nullable().optional(),
  totalBorrowedUsd: z.union([z.string(), z.number()]).nullable().optional(),
  totalBorrowCapacityUsd: z.union([z.string(), z.number()]).nullable().optional(),
  availableBorrowUsd: z.union([z.string(), z.number()]).nullable().optional(),
  healthFactor: z.union([z.string(), z.number()]).nullable().optional(),
  netApy: z.union([z.string(), z.number()]).nullable().optional(),
  borrowLimitRatio: z.number().nullable().optional(),
  claimableBlnd: z.union([z.string(), z.number()]).nullable().optional(),
});
export type PositionSummary = z.infer<typeof positionSummarySchema>;

export const positionsCardPropsSchema = z.object({
  hasPosition: z.boolean(),
  positions: z.array(positionItemSchema).optional(),
  // SDK format (separate arrays)
  collateral: z
    .array(z.object({ symbol: z.string(), amount: z.number(), apy: z.number() }))
    .optional(),
  supply: z
    .array(z.object({ symbol: z.string(), amount: z.number(), apy: z.number() }))
    .optional(),
  liabilities: z
    .array(z.object({ symbol: z.string(), amount: z.number(), apy: z.number() }))
    .optional(),
  summary: positionSummarySchema.nullable().optional(),
});
export type PositionsCardProps = z.infer<typeof positionsCardPropsSchema>;

// ─── Transaction ────────────────────────────────────────────────

/** Enriched context returned by MCP operation endpoints alongside XDR. */
export const operationContextSchema = z.object({
  reserveApy: z.object({
    supplyApy: z.number(),
    borrowApy: z.number(),
    supplyEmissionApy: z.number().optional(),
    borrowEmissionApy: z.number().optional(),
  }).optional(),
  currentPosition: z.object({
    suppliedAmount: z.number().nullable().optional(),
    borrowedAmount: z.number().nullable().optional(),
  }).optional(),
  symbol: z.string().optional(),
}).optional();
export type OperationContext = z.infer<typeof operationContextSchema>;

export const txCardPropsSchema = z.object({
  operation: z.string(),
  xdr: z.string(),
  estimatedFee: z.string().optional(),
  asset: z.string().optional(),
  symbol: z.string().optional(),
  amount: z.string().optional(),
  pool: z.string().optional(),
  from: z.string().optional(),
  /** Enriched context from MCP (APY, position, summary). When present, card skips extra API calls. */
  context: operationContextSchema,
});
export type TxCardProps = z.infer<typeof txCardPropsSchema>;

// ─── Backstop ───────────────────────────────────────────────────

export const backstopCardPropsSchema = z.object({
  poolAddress: z.string().optional(),
  poolName: z.string().optional(),
  totalApr: z.number().nullable().optional(),
  interestApr: z.number().nullable().optional(),
  emissionApr: z.number().nullable().optional(),
  totalDepositedUsd: z.number().nullable().optional(),
  q4wPct: z.number().nullable().optional(),
  lpTokenPrice: z.number().nullable().optional(),
  shares: z.union([z.string(), z.number()]).nullable().optional(),
});
export type BackstopCardProps = z.infer<typeof backstopCardPropsSchema>;

// ─── Backstop Balance (user's position) ────────────────────────

export const backstopBalanceQueuedSchema = z.object({
  amount: z.union([z.string(), z.number()]),
  amountHuman: z.union([z.string(), z.number()]).nullable().optional(),
  expiration: z.number().nullable().optional(),
});

export const backstopBalanceCardPropsSchema = z.object({
  pool: z.string().optional(),
  poolName: z.string().optional(),
  shares: z.union([z.string(), z.number()]).nullable().optional(),
  sharesHuman: z.union([z.string(), z.number()]).nullable().optional(),
  hasPosition: z.boolean().optional(),
  queuedWithdrawals: z.array(backstopBalanceQueuedSchema).optional(),
});
export type BackstopBalanceCardProps = z.infer<typeof backstopBalanceCardPropsSchema>;
