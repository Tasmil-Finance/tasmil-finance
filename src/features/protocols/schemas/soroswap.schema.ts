import { z } from "zod";
import { apySchema } from "./common.schema";

// ─── Pool ──────────────────────────────────────────────────────

export const soroswapPoolCardPropsSchema = z.object({
  address: z.string().optional(),
  tokenA: z.string(),
  tokenB: z.string(),
  tokenAAddress: z.string().optional(),
  tokenBAddress: z.string().optional(),
  reserveA: z.union([z.string(), z.number()]).nullable().optional(),
  reserveB: z.union([z.string(), z.number()]).nullable().optional(),
  tvl: z.union([z.string(), z.number()]).nullable().optional(),
  volume24h: z.union([z.string(), z.number()]).nullable().optional(),
  fee: z.string().optional(),
  feeBps: z.number().optional(),
  protocol: z.string().optional(),
  poolType: z.string().optional(),
});
export type SoroswapPoolCardProps = z.infer<typeof soroswapPoolCardPropsSchema>;

// ─── Quote ─────────────────────────────────────────────────────

export const soroswapQuoteCardPropsSchema = z.object({
  amountIn: z.string(),
  amountOut: z.string(),
  fee: z.string().optional(),
  feePercent: z.string().optional(),
  route: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  status: z.enum(["ok", "no_route"]).optional(),
  protocol: z.string().optional(),
});
export type SoroswapQuoteCardProps = z.infer<typeof soroswapQuoteCardPropsSchema>;

// ─── LP Position ───────────────────────────────────────────────

export const soroswapPositionItemSchema = z.object({
  poolAddress: z.string(),
  protocol: z.string().optional(),
  tokenA: z.string(),
  tokenB: z.string(),
  liquidityTokens: z.union([z.string(), z.number()]).nullable().optional(),
  amountA: z.union([z.string(), z.number()]).nullable().optional(),
  amountB: z.union([z.string(), z.number()]).nullable().optional(),
  valueUsd: z.number().nullable().optional(),
});
export type SoroswapPositionItem = z.infer<typeof soroswapPositionItemSchema>;

export const soroswapPositionsCardPropsSchema = z.object({
  hasPosition: z.boolean(),
  positions: z.array(soroswapPositionItemSchema).optional(),
  totalValueUsd: z.number().nullable().optional(),
});
export type SoroswapPositionsCardProps = z.infer<typeof soroswapPositionsCardPropsSchema>;

// ─── Yield ─────────────────────────────────────────────────────

export const soroswapYieldCardPropsSchema = z.object({
  protocol: z.string().optional(),
  type: z.literal("lp").optional(),
  name: z.string(),
  assets: z.array(z.string()),
  apy: z.object({
    base: apySchema,
    reward: apySchema,
    total: apySchema,
  }),
  tvl: z.union([z.string(), z.number()]).nullable().optional(),
  poolAddress: z.string().optional(),
  risk: z.string().optional(),
  status: z.string().optional(),
  fee: z.string().optional(),
});
export type SoroswapYieldCardProps = z.infer<typeof soroswapYieldCardPropsSchema>;

// ─── Price ─────────────────────────────────────────────────────

export const soroswapPriceCardPropsSchema = z.object({
  asset: z.string(),
  referenceCurrency: z.string(),
  price: z.number(),
  updatedAt: z.string().optional(),
});
export type SoroswapPriceCardProps = z.infer<typeof soroswapPriceCardPropsSchema>;

// ─── Transaction ───────────────────────────────────────────────

export const soroswapTxCardPropsSchema = z.object({
  operation: z.string(),
  xdr: z.string(),
  estimatedFee: z.string().optional(),
  from: z.string().optional(),
  tokenIn: z.string().optional(),
  tokenOut: z.string().optional(),
  amount: z.string().optional(),
  amountA: z.string().optional(),
  amountB: z.string().optional(),
  assetA: z.string().optional(),
  assetB: z.string().optional(),
  route: z.array(z.string()).optional(),
  context: z.object({
    amountOut: z.string().optional(),
    feePercent: z.string().optional(),
    poolTvl: z.union([z.string(), z.number()]).nullable().optional(),
  }).optional(),
});
export type SoroswapTxCardProps = z.infer<typeof soroswapTxCardPropsSchema>;
