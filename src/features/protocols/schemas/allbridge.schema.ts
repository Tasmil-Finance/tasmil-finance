import { z } from "zod";

// ─── LP Pool ──────────────────────────────────────────────────────

export const allbridgePoolCardPropsSchema = z.object({
  chain: z.string(),
  symbol: z.string(),
  name: z.string().optional(),
  tokenAddress: z.string().optional(),
  poolAddress: z.string(),
  decimals: z.number().optional(),
  apr7d: z.union([z.string(), z.number()]).nullable().optional(),
  apr30d: z.union([z.string(), z.number()]).nullable().optional(),
  feeShare: z.union([z.string(), z.number()]).nullable().optional(),
  lpRate: z.union([z.string(), z.number()]).nullable().optional(),
});
export type AllbridgePoolCardProps = z.infer<typeof allbridgePoolCardPropsSchema>;

// ─── Pool Info (on-chain state) ───────────────────────────────────

export const allbridgePoolInfoSchema = z.object({
  chain: z.string(),
  symbol: z.string(),
  poolAddress: z.string().optional(),
  tokenAddress: z.string().optional(),
  poolInfo: z.object({
    tokenBalance: z.string().optional(),
    vUsdBalance: z.string().optional(),
    totalLpAmount: z.string().optional(),
    aValue: z.string().optional(),
    dValue: z.string().optional(),
    imbalance: z.union([z.string(), z.number()]).nullable().optional(),
    accRewardPerShareP: z.string().optional(),
  }).optional(),
  apr7d: z.union([z.string(), z.number()]).nullable().optional(),
  apr30d: z.union([z.string(), z.number()]).nullable().optional(),
  feeShare: z.union([z.string(), z.number()]).nullable().optional(),
});
export type AllbridgePoolInfoProps = z.infer<typeof allbridgePoolInfoSchema>;

// ─── User Balance (LP position) ───────────────────────────────────

export const allbridgeUserBalanceSchema = z.object({
  chain: z.string(),
  symbol: z.string(),
  accountAddress: z.string(),
  poolAddress: z.string().optional(),
  lpAmount: z.string().optional(),
  userLiquidity: z.string().optional(),
  earnedRewards: z.string().optional(),
  hasRewards: z.boolean().optional(),
  note: z.string().optional(),
});
export type AllbridgeUserBalanceProps = z.infer<typeof allbridgeUserBalanceSchema>;

// ─── Bridge Quote ─────────────────────────────────────────────────

export const allbridgeQuoteCardPropsSchema = z.object({
  provider: z.string().optional(),
  amountIn: z.string(),
  amountOut: z.string(),
  fee: z.string().optional(),
  feePercent: z.string().optional(),
  estimatedTime: z.string().optional(),
  crossChainSwap: z.boolean().optional(),
  status: z.string().optional(),
  error: z.string().optional(),
});
export type AllbridgeQuoteCardProps = z.infer<typeof allbridgeQuoteCardPropsSchema>;

// ─── Bridge Routes ────────────────────────────────────────────────

export const allbridgeRouteSchema = z.object({
  provider: z.string(),
  asset: z.string(),
  fromChain: z.string(),
  toChain: z.string(),
  estimatedFee: z.string().optional(),
  estimatedTime: z.string().optional(),
  crossChainSwap: z.boolean().optional(),
});
export type AllbridgeRoute = z.infer<typeof allbridgeRouteSchema>;

// ─── Deposit/Withdraw Quote ───────────────────────────────────────

export const allbridgeDepositQuoteSchema = z.object({
  chain: z.string(),
  symbol: z.string(),
  amountIn: z.string(),
  lpTokensReceived: z.string(),
  poolAddress: z.string().optional(),
  apr7d: z.union([z.string(), z.number()]).nullable().optional(),
  note: z.string().optional(),
});
export type AllbridgeDepositQuoteProps = z.infer<typeof allbridgeDepositQuoteSchema>;

export const allbridgeWithdrawQuoteSchema = z.object({
  chain: z.string(),
  symbol: z.string(),
  lpAmountIn: z.string(),
  tokensReceived: z.string(),
  poolAddress: z.string().optional(),
  note: z.string().optional(),
});
export type AllbridgeWithdrawQuoteProps = z.infer<typeof allbridgeWithdrawQuoteSchema>;

// ─── Supported Chain ──────────────────────────────────────────────

export const allbridgeSupportedChainSchema = z.object({
  chain: z.string(),
  chainSymbol: z.string(),
  tokens: z.array(z.object({
    symbol: z.string(),
    name: z.string().optional(),
    tokenAddress: z.string().optional(),
    poolAddress: z.string().optional(),
    decimals: z.number().optional(),
  })),
  tokenCount: z.number(),
});
export type AllbridgeSupportedChain = z.infer<typeof allbridgeSupportedChainSchema>;

// ─── Transaction (bridge + LP operations) ─────────────────────────

export const allbridgeTxCardPropsSchema = z.object({
  operation: z.string(),
  xdr: z.string().nullable().optional(),
  transaction: z.any().optional(),
  chain: z.string().optional(),
  symbol: z.string().optional(),
  amount: z.string().optional(),
  fromChain: z.string().optional(),
  toChain: z.string().optional(),
  asset: z.string().optional(),
  fromAddress: z.string().optional(),
  toAddress: z.string().optional(),
  poolAddress: z.string().optional(),
  provider: z.string().optional(),
  earnedRewards: z.string().optional(),
  note: z.string().optional(),
});
export type AllbridgeTxCardProps = z.infer<typeof allbridgeTxCardPropsSchema>;
