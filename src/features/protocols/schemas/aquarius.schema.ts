import { z } from "zod";
import { apySchema } from "./common.schema";

// ─── Pool token ──────��─────────────────────────────────────────

export const aquaTokenSchema = z.object({
  address: z.string(),
  symbol: z.string().optional(),
});
export type AquaToken = z.infer<typeof aquaTokenSchema>;

// ─── Pool ──────────────────────────────────────────────────────

export const aquaPoolCardPropsSchema = z.object({
  address: z.string(),
  poolType: z.string().optional(),
  tokens: z.array(aquaTokenSchema).optional(),
  tokensStr: z.union([z.string(), z.array(z.string())]).optional(),
  fee: z.string().optional(),
  tvl: z.union([z.string(), z.number()]).nullable().optional(),
  volume24h: z.union([z.string(), z.number()]).nullable().optional(),
  feeApy: apySchema,
  rewardApy: apySchema,
  totalApy: apySchema,
});
export type AquaPoolCardProps = z.infer<typeof aquaPoolCardPropsSchema>;

// ─── Quote ──────────────────────────────────��──────────────────

export const aquaQuoteCardPropsSchema = z.object({
  protocol: z.literal("aquarius").optional(),
  amountIn: z.string(),
  amountOut: z.string(),
  fee: z.string().optional(),
  feePercent: z.string().optional(),
  route: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  status: z.enum(["ok", "no_route"]).optional(),
});
export type AquaQuoteCardProps = z.infer<typeof aquaQuoteCardPropsSchema>;

// ─── LP Position ─────��─────────────────────────────────────────

export const aquaPositionItemSchema = z.object({
  poolAddress: z.string(),
  tokens: z.array(z.string()).optional(),
  tokensStr: z.union([z.string(), z.array(z.string())]).optional(),
  shares: z.union([z.string(), z.number()]).nullable().optional(),
  valueUsd: z.number().nullable().optional(),
  poolType: z.string().optional(),
  feeApy: apySchema,
  rewardApy: apySchema,
});
export type AquaPositionItem = z.infer<typeof aquaPositionItemSchema>;

export const aquaPositionsCardPropsSchema = z.object({
  hasPosition: z.boolean(),
  positions: z.array(aquaPositionItemSchema).optional(),
  totalValueUsd: z.number().nullable().optional(),
});
export type AquaPositionsCardProps = z.infer<typeof aquaPositionsCardPropsSchema>;

// ─── Yield opportunity ─────────────────────────────────────────

export const aquaYieldCardPropsSchema = z.object({
  protocol: z.literal("aquarius").optional(),
  type: z.literal("lp").optional(),
  name: z.string(),
  assets: z.array(z.string()),
  apy: z.object({
    base: apySchema,
    reward: apySchema,
    total: apySchema,
    rewardToken: z.string().optional(),
  }),
  tvl: z.union([z.string(), z.number()]).nullable().optional(),
  poolAddress: z.string().optional(),
  risk: z.string().optional(),
  status: z.string().optional(),
  fee: z.string().optional(),
  poolType: z.string().optional(),
});
export type AquaYieldCardProps = z.infer<typeof aquaYieldCardPropsSchema>;

// ─── Lock AQUA info ────────────────────────────────────────────

export const aquaLockInfoSchema = z.object({
  amount: z.string(),
  lockPeriodDays: z.number(),
  iceMultiplier: z.number(),
  estimatedIce: z.string(),
  unlockDate: z.string(),
  instruction: z.string().optional(),
});
export type AquaLockInfo = z.infer<typeof aquaLockInfoSchema>;

// ─── AQUA Daily Rewards ────────────────────────────────────────

export const aquaRewardItemSchema = z.object({
  pair: z.string(),
  asset1: z.string(),
  asset2: z.string(),
  dailyAmmReward: z.number(),
  dailySdexReward: z.number(),
  dailyTotalReward: z.number(),
});
export type AquaRewardItem = z.infer<typeof aquaRewardItemSchema>;

export const aquaRewardsCardPropsSchema = z.object({
  rewards: z.array(aquaRewardItemSchema),
  totalDailyReward: z.number().optional(),
});
export type AquaRewardsCardProps = z.infer<typeof aquaRewardsCardPropsSchema>;

// ─── Pool Incentive ────────────────────────────────────────────

export const aquaPoolIncentiveSchema = z.object({
  poolAddress: z.string(),
  pair: z.string(),
  dailyReward: z.number(),
  rewardApy: apySchema,
  rewardToken: z.string().optional(),
});
export type AquaPoolIncentive = z.infer<typeof aquaPoolIncentiveSchema>;

// ─── Deposit/Withdraw Preview ──────────────────────────────────

export const aquaDepositPreviewSchema = z.object({
  poolAddress: z.string(),
  tokens: z.array(z.string()).optional(),
  amountsIn: z.array(z.string()),
  estimatedShares: z.string(),
  shareOfPool: z.string().optional(),
  currentReserves: z.array(z.string()).optional(),
});
export type AquaDepositPreview = z.infer<typeof aquaDepositPreviewSchema>;

export const aquaWithdrawPreviewSchema = z.object({
  poolAddress: z.string(),
  tokens: z.array(z.string()).optional(),
  sharesToBurn: z.string(),
  estimatedAmountsOut: z.array(z.string()),
  currentReserves: z.array(z.string()).optional(),
});
export type AquaWithdrawPreview = z.infer<typeof aquaWithdrawPreviewSchema>;

// ─── Vote / Governance ─────────────────────────────────────────

export const aquaVoteMarketSchema = z.object({
  pair: z.string(),
  asset1: z.object({ code: z.string(), issuer: z.string().optional() }),
  asset2: z.object({ code: z.string(), issuer: z.string().optional() }),
  totalVotes: z.number().optional(),
  bribes: z.number().optional(),
  adjustedVotes: z.number().optional(),
});
export type AquaVoteMarket = z.infer<typeof aquaVoteMarketSchema>;

// ─── Transaction ───────────────────────────────────────────────

export const aquaOperationContextSchema = z.object({
  poolApy: z.object({
    feeApy: z.number().nullable().optional(),
    rewardApy: z.number().nullable().optional(),
  }).optional(),
  tokens: z.array(z.string()).optional(),
  estimatedOutput: z.string().optional(),
}).optional();
export type AquaOperationContext = z.infer<typeof aquaOperationContextSchema>;

export const aquaTxCardPropsSchema = z.object({
  operation: z.string(),
  xdr: z.string(),
  estimatedFee: z.string().optional(),
  pool: z.string().optional(),
  from: z.string().optional(),
  amounts: z.array(z.string()).optional(),
  shares: z.string().optional(),
  tokenIn: z.string().optional(),
  tokenOut: z.string().optional(),
  amount: z.string().optional(),
  route: z.object({
    pools: z.array(z.string()).optional(),
    tokens: z.array(z.string()).optional(),
    estimatedOutput: z.string().optional(),
  }).optional(),
  context: aquaOperationContextSchema,
});
export type AquaTxCardProps = z.infer<typeof aquaTxCardPropsSchema>;
