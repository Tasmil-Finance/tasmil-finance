/**
 * Aquarius AMM Protocol Adapter
 * Usage: sdk.aquarius.listPools(), sdk.aquarius.getQuote(...)
 */

import { xdr as stellarXdr } from "@stellar/stellar-sdk";
import type { TasmilClientConfig } from "../../types/common.js";
import type { YieldOpportunity } from "../../types/yield.js";
import type { SwapAdapterQuoteParams } from "../../types/swap.js";
import { AQUARIUS_API_URLS } from "../../utils/network.js";
import { getAquariusContracts, getTokenContracts } from "../../utils/contracts.js";
import { getAssetSymbol, resolveAsset } from "../../utils/asset-resolver.js";
import { invokeContract, viewCall, buildScVal } from "../../utils/soroban.js";
import { createLogger } from "../../utils/logger.js";

const AQUARIUS_TIMEOUT_MS = 15_000;  // 15s — prevent hanging on slow API

const log = createLogger("aquarius");

const AQUARIUS_REWARD_API = "https://reward-api.aqua.network/api/rewards";
const AQUARIUS_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Accept: "application/json",
};

// ─── Types ────────────────────────────────────────────────────────

export interface AquariusPool {
  address: string;
  pool_type?: string;
  tokens?: Array<{ address: string; symbol?: string }>;
  tokens_str?: string | string[];
  fee?: string;
  total_value_locked?: string | number;
  volume_24h?: string | number;
  fee_apy?: string | number;
  reward_apy?: string | number;
  [key: string]: unknown;
}

export interface AquariusSwapPath {
  amount_in?: string;
  amount_out?: string;
  /** Testnet Aquarius API returns "amount" + "amount_with_fee" instead of amount_out */
  amount?: number | string;
  amount_with_fee?: number | string;
  swaps?: unknown[];
  [key: string]: unknown;
}

export interface AquariusReward {
  market_key: {
    asset1_code: string;
    asset1_issuer: string;
    asset2_code: string;
    asset2_issuer: string;
  };
  daily_amm_reward: number;
  daily_sdex_reward: number;
  daily_total_reward: number;
}

// ─── API helpers ──────────────────────────────────────────────────

export class AquariusApiError extends Error {
  public readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "AquariusApiError";
    this.status = status;
  }
}

// ─── AquariusAdapter ──────────────────────────────────────────────

const AQUARIUS_AMM_BASE: Record<string, string> = {
  mainnet: "https://amm-api.aqua.network",
  testnet: "https://amm-api-testnet.aqua.network",
};

export interface AquariusPoolRewards {
  /** Claimable AQUA tokens */
  toClaim: number;
  /** Tokens per second (for daily reward calculation) */
  tps: number;
  /** Daily reward estimate in AQUA */
  dailyReward: number;
}

export interface AquariusUserPool extends AquariusPool {
  balance: string;
  /** Rewards info — populated by getUserPoolsWithRewards */
  rewards?: AquariusPoolRewards;
}

export class AquariusAdapter {
  private readonly apiBase: string;
  private readonly ammBase: string;
  private readonly aquaToken: string;

  constructor(private readonly config: TasmilClientConfig) {
    this.apiBase = AQUARIUS_API_URLS[config.network];
    this.ammBase = AQUARIUS_AMM_BASE[config.network] ?? this.apiBase;
    this.aquaToken = getAquariusContracts(config.network).aquaToken;
  }

  /**
   * List pools with TVL, volume, fee data. Pages up to 5 × 50 pools.
   */
  async listPools(maxPages = 5, pageSize = 50): Promise<AquariusPool[]> {
    const all: AquariusPool[] = [];
    let page = 1;

    while (page <= maxPages) {
      const params = new URLSearchParams({
        page: String(page),
        size: String(pageSize),
        sort: "-liquidity",
      });

      const url = `${this.apiBase}/pools/?${params}`;
      try {
        const res = await fetch(url, { headers: AQUARIUS_HEADERS, signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS) });
        if (!res.ok) {
          throw new AquariusApiError(
            `Aquarius API error: ${res.status} ${res.statusText}`,
            res.status,
          );
        }
        const data = (await res.json()) as {
          count?: number; total?: number;
          results?: AquariusPool[];
          items?: AquariusPool[];
          next: string | null;
        };
        // Internal API returns "items", external returns "results"
        const pools = data.results ?? data.items ?? [];
        all.push(...pools);
        if (!data.next || pools.length === 0) break;
        page++;
      } catch (err) {
        log.warn("Aquarius listPools error", { err: String(err), page });
        break;
      }
    }

    return all;
  }

  /**
   * Get pools where a user has a non-zero balance.
   * Uses the AMM internal API `/pools/user/{accountId}/` — single HTTP call.
   */
  async getUserPools(accountId: string): Promise<AquariusUserPool[]> {
    const url = `${this.ammBase}/pools/user/${accountId}/?size=1000`;
    try {
      const res = await fetch(url, { headers: AQUARIUS_HEADERS, signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS) });
      if (!res.ok) {
        throw new AquariusApiError(
          `Aquarius user pools API error: ${res.status} ${res.statusText}`,
          res.status,
        );
      }
      const data = (await res.json()) as { items: AquariusUserPool[] };
      return data.items ?? [];
    } catch (err) {
      log.warn("Aquarius getUserPools error", { err: String(err) });
      return [];
    }
  }

  /**
   * Get claimable AQUA rewards for a user in a specific pool.
   * Calls the pool contract's `get_rewards_info` via Soroban simulation.
   */
  async getPoolRewards(poolAddress: string, userAddress: string): Promise<AquariusPoolRewards | null> {
    try {
      const { scValToNative, xdr: stellarXdrMod, Contract, TransactionBuilder, Account, rpc } = await import("@stellar/stellar-sdk");
      const { createSorobanClient } = await import("../../utils/stellar-client.js");
      const { getNetworkPassphrase } = await import("../../utils/network.js");

      // Must use the actual user address as source — the contract reads the invoker
      const soroban = createSorobanClient(this.config);
      const networkPassphrase = getNetworkPassphrase(this.config.network);
      const account = new Account(userAddress, "0");
      const contract = new Contract(poolAddress);
      const args = [buildScVal("address", userAddress)];
      const operation = contract.call("get_rewards_info", ...args);

      const tx = new TransactionBuilder(account, { fee: "10000000", networkPassphrase })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      const simulation = await soroban.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(simulation) || !rpc.Api.isSimulationSuccess(simulation)) {
        return null;
      }

      const retval = simulation.result?.retval;
      if (!retval) return null;

      const val = scValToNative(retval);
      const SCALAR = 1e7;
      const toClaim = Number(val.to_claim ?? 0) / SCALAR;
      const tps = Number(val.tps ?? 0) / SCALAR;
      const workingBalance = Number(val.working_balance ?? 0);
      const workingSupply = Number(val.working_supply ?? 0);
      const dailyReward = workingSupply > 0
        ? (tps * 86400 * workingBalance) / workingSupply
        : 0;

      return { toClaim, tps, dailyReward };
    } catch (err) {
      log.warn("Aquarius getPoolRewards error", { err: String(err), poolAddress });
      return null;
    }
  }

  /**
   * Get user pools with rewards info.
   * Fetches user pools via HTTP API, then gets rewards via Soroban in parallel.
   */
  async getUserPoolsWithRewards(accountId: string): Promise<AquariusUserPool[]> {
    const pools = await this.getUserPools(accountId);
    if (pools.length === 0) return [];

    const rewardsResults = await Promise.allSettled(
      pools.map((pool) => this.getPoolRewards(pool.address, accountId)),
    );

    for (let i = 0; i < pools.length; i++) {
      const r = rewardsResults[i];
      if (r && r.status === "fulfilled" && r.value) {
        pools[i]!.rewards = r.value;
      }
    }

    return pools;
  }

  /**
   * Get single pool detail by address.
   */
  async getPool(poolAddress: string): Promise<AquariusPool> {
    // Internal API uses /pools/{address}/ (direct path), not ?address__in=
    const url = `${this.apiBase}/pools/${poolAddress}/`;
    const res = await fetch(url, { headers: AQUARIUS_HEADERS, signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS) });
    if (!res.ok) {
      throw new AquariusApiError(
        `Aquarius API error: ${res.status} ${res.statusText}`,
        res.status,
      );
    }
    const data = (await res.json()) as AquariusPool & { count?: number; total?: number; results?: AquariusPool[]; items?: AquariusPool[] };
    // Direct path /pools/{addr}/ returns the pool object directly.
    // List path /pools/?address__in= returns {results: [...]} or {items: [...]}.
    if (data.address) return data;
    const pools = data.results ?? data.items ?? [];
    if (pools.length === 0) {
      throw new AquariusApiError(`Pool not found: ${poolAddress}`);
    }
    return pools[0]!;
  }

  /**
   * Find swap path (strict send).
   */
  async findSwapPath(
    tokenInAddress: string,
    tokenOutAddress: string,
    amount: string,
  ): Promise<AquariusSwapPath> {
    const url = `${this.apiBase}/find-path/`;
    const res = await fetch(url, {
      method: "POST",
      headers: AQUARIUS_HEADERS,
      signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS),
      body: JSON.stringify({
        token_in_address: tokenInAddress,
        token_out_address: tokenOutAddress,
        amount,
      }),
    });
    if (!res.ok) {
      throw new AquariusApiError(
        `Aquarius path-finding failed: ${res.status} ${res.statusText}`,
        res.status,
      );
    }
    return (await res.json()) as AquariusSwapPath;
  }

  /**
   * Find swap path (strict receive).
   */
  async findSwapPathStrictReceive(
    tokenInAddress: string,
    tokenOutAddress: string,
    amount: string,
  ): Promise<AquariusSwapPath> {
    const url = `${this.apiBase}/find-path-strict-receive/`;
    const res = await fetch(url, {
      method: "POST",
      headers: AQUARIUS_HEADERS,
      signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS),
      body: JSON.stringify({
        token_in_address: tokenInAddress,
        token_out_address: tokenOutAddress,
        amount,
      }),
    });
    if (!res.ok) {
      throw new AquariusApiError(
        `Aquarius strict-receive path-finding failed: ${res.status} ${res.statusText}`,
        res.status,
      );
    }
    return (await res.json()) as AquariusSwapPath;
  }

  /**
   * Fetch AQUA daily reward distribution per market pair.
   */
  async fetchRewards(): Promise<AquariusReward[]> {
    const all: AquariusReward[] = [];
    let url: string | null = `${AQUARIUS_REWARD_API}/?page_size=100`;

    while (url) {
      const res = await fetch(url, { signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS) });
      if (!res.ok) {
        throw new AquariusApiError(
          `Aquarius rewards API error: ${res.status} ${res.statusText}`,
          res.status,
        );
      }
      const data = (await res.json()) as {
        count: number;
        next: string | null;
        results: AquariusReward[];
      };
      all.push(...data.results);
      url = data.next;
    }

    return all;
  }

  /**
   * Resolve an asset to its Soroban contract address, substituting the Aquarius-specific
   * USDC override when one is configured for the network (testnet uses a different USDC).
   */
  /**
   * All known USDC contract addresses across testnet configs.
   * Any of these should be mapped to the Aquarius-specific USDC.
   */
  private static readonly USDC_VARIANTS = new Set([
    "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU", // Blend testnet USDC
    "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA", // Another testnet USDC
  ]);

  private resolveForAquarius(asset: string): string {
    const resolved = resolveAsset(asset, "contract", this.config.network);
    const aquContracts = getAquariusContracts(this.config.network);

    if (aquContracts.usdcOverride) {
      // Map canonical USDC
      const canonicalUsdc = getTokenContracts(this.config.network).usdc;
      if (resolved === canonicalUsdc) return aquContracts.usdcOverride;
      // Map all known USDC variants
      if (AquariusAdapter.USDC_VARIANTS.has(resolved)) return aquContracts.usdcOverride;
    }
    return resolved;
  }

  /**
   * Get quote for a swap via Aquarius path-finding.
   */
  async getQuote(params: SwapAdapterQuoteParams): Promise<{
    protocol: "aquarius";
    amountIn: string;
    amountOut: string;
    fee: string;
    feePercent: string;
    route: string[];
    estimatedTime: string;
    status: "ok" | "no_route";
  }> {
    // Aquarius find-path API requires Soroban contract addresses (C... 56 chars), not symbols.
    // On testnet, Aquarius uses a protocol-specific USDC contract (usdcOverride).
    const contractIn = this.resolveForAquarius(params.tokenIn);
    const contractOut = this.resolveForAquarius(params.tokenOut);

    const path = await this.findSwapPath(
      contractIn,
      contractOut,
      params.amount,
    );

    // Mainnet returns "amount_out"; testnet API returns "amount" (already in token units)
    const amountOut = String(path.amount_out ?? path.amount ?? "0");
    if (!amountOut || amountOut === "0") {
      return {
        protocol: "aquarius",
        amountIn: params.amount,
        amountOut: "0",
        fee: "0",
        feePercent: "N/A",
        route: [],
        estimatedTime: "N/A",
        status: "no_route",
      };
    }

    const tokenInSym = getAssetSymbol(params.tokenIn, this.config.network);
    const tokenOutSym = getAssetSymbol(params.tokenOut, this.config.network);

    // Aquarius charges ~0.10% fee; estimate in input token units
    const feeRate = 0.001;
    const estimatedFee = String(Math.floor(Number(params.amount) * feeRate));

    return {
      protocol: "aquarius",
      amountIn: params.amount,
      amountOut,
      fee: estimatedFee,
      feePercent: "~0.10%",
      route: [tokenInSym, tokenOutSym],
      estimatedTime: "~5s",
      status: "ok",
    };
  }

  /**
   * Alias for getQuote — satisfies SwapAggregator interface.
   */
  async getAdapterQuote(params: SwapAdapterQuoteParams) {
    return this.getQuote(params);
  }

  // ─── Soroban operations (build unsigned XDR) ───────────────────

  /**
   * Build swap TX via Aquarius optimal path routing.
   * 1) Calls find-path API to get swap_chain_xdr
   * 2) Builds invokeContract TX for router.swap_chained()
   */
  async buildSwap(params: {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    from: string;
    slippageBps?: number;
  }): Promise<{ xdr: string; estimatedFee: string; route: { pools: string[]; tokens: string[]; estimatedOutput: string } }> {
    const tokenIn = this.resolveForAquarius(params.tokenIn);
    const tokenOut = this.resolveForAquarius(params.tokenOut);

    const path = await this.findSwapPath(tokenIn, tokenOut, params.amount);
    const raw = path as Record<string, unknown>;

    if (!raw.swap_chain_xdr) {
      throw new AquariusApiError("No swap path found for this pair");
    }

    const slippage = params.slippageBps ?? 100;
    const amountBigInt = BigInt(Number(raw.amount_with_fee ?? raw.amount ?? 0));
    const minOut = amountBigInt - (amountBigInt * BigInt(slippage)) / 10000n;

    // Decode swap_chain_xdr into ScVal (contains routing instructions)
    const swapChainScVal = stellarXdr.ScVal.fromXDR(String(raw.swap_chain_xdr), "base64");

    const routerContract = getAquariusContracts(this.config.network).router;
    // Args per Aquarius docs: (user, swaps_chain, token_in, amount_in, amount_out_min)
    // All amounts must be u128 (not i128)
    const args = [
      buildScVal("address", params.from),       // user address (G...)
      swapChainScVal,                            // swap chain XDR (decoded ScVal)
      buildScVal("address", tokenIn),            // token_in contract address (C...)
      buildScVal("u128", params.amount),         // amount_in (u128)
      buildScVal("u128", minOut.toString()),     // amount_out_min (u128)
    ];

    const result = await invokeContract(this.config, routerContract, "swap_chained", args, params.from);

    return {
      xdr: result.xdr,
      estimatedFee: result.simulationResult.resourceFee,
      route: {
        pools: (raw.pools ?? []) as string[],
        tokens: (raw.tokens ?? []) as string[],
        estimatedOutput: String(raw.amount_with_fee ?? raw.amount ?? "0"),
      },
    };
  }

  /**
   * Build deposit (add liquidity) TX.
   * Calls pool.deposit(user, [amountA, amountB], minShares)
   */
  async buildDeposit(params: {
    poolAddress: string;
    amounts: string[];
    from: string;
    minShares?: string;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    const amountsScVal = params.amounts.map((a) => buildScVal("u128", a));
    const args = [
      buildScVal("address", params.from),
      stellarXdr.ScVal.scvVec(amountsScVal),
      buildScVal("u128", params.minShares ?? "1"),
    ];

    const result = await invokeContract(this.config, params.poolAddress, "deposit", args, params.from);
    return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
  }

  /**
   * Get pool share token address and total shares.
   * Uses share_id() for the token address and get_total_shares() for supply.
   */
  async getShareInfo(poolAddress: string): Promise<{ shareToken: string; totalShares: bigint }> {
    const { scValToNative, xdr: stellarXdrMod } = await import("@stellar/stellar-sdk");

    const [shareTokenRaw, totalSharesRaw] = await Promise.all([
      viewCall(this.config, poolAddress, "share_id", []),
      viewCall(this.config, poolAddress, "get_total_shares", []),
    ]);

    if (!shareTokenRaw) throw new Error(`share_id returned null for pool ${poolAddress}`);
    const shareToken = String(scValToNative(stellarXdrMod.ScVal.fromXDR(shareTokenRaw, "base64")));
    const totalShares = totalSharesRaw
      ? BigInt(String(scValToNative(stellarXdrMod.ScVal.fromXDR(totalSharesRaw, "base64"))))
      : 0n;

    return { shareToken, totalShares };
  }

  /**
   * Get user's LP share balance for a pool.
   * Handles both G-addresses (classic accounts) and C-addresses (contracts).
   */
  async getUserShares(poolAddress: string, userAddress: string): Promise<bigint> {
    const { scValToNative, xdr: stellarXdrMod, Keypair } = await import("@stellar/stellar-sdk");
    const { shareToken } = await this.getShareInfo(poolAddress);
    if (!shareToken || !shareToken.startsWith("C")) {
      throw new Error(`Could not resolve share token for pool ${poolAddress}`);
    }

    // Build correct ScVal for the address type
    let addrScVal: ReturnType<typeof stellarXdrMod.ScVal.scvAddress>;
    if (userAddress.startsWith("G")) {
      // Classic Stellar account (G...)
      const kp = Keypair.fromPublicKey(userAddress);
      addrScVal = stellarXdrMod.ScVal.scvAddress(
        stellarXdrMod.ScAddress.scAddressTypeAccount(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (stellarXdr as any).AccountId.publicKeyTypeEd25519(kp.rawPublicKey()),
        ),
      );
    } else {
      // Soroban contract address (C...)
      addrScVal = buildScVal("address", userAddress) as ReturnType<typeof stellarXdrMod.ScVal.scvAddress>;
    }

    const raw = await viewCall(this.config, shareToken, "balance", [addrScVal]);
    if (!raw) return 0n;
    return BigInt(String(scValToNative(stellarXdrMod.ScVal.fromXDR(raw, "base64"))));
  }

  /**
   * Build withdraw (remove liquidity) TX for a volatile (constant_product) pool.
   *
   * For volatile pools the contract signature is:
   *   withdraw(user: Address, share_amount: u128, min_amounts: Vec<u128>) → Vec<u128>
   *
   * IMPORTANT: The pool internally calls burn() on the share token, so the TX
   * must include an explicit SorobanAuthorizationEntry with a burn sub-invocation.
   * Without it the simulation/submission will fail with an auth error.
   *
   * @param shares - LP share amount in stroops (7 decimals). If omitted, fetches user's full balance.
   * @param minAmounts - minimum token amounts to receive (slippage protection), in stroops. Defaults to ["1","1"].
   */
  async buildWithdraw(params: {
    poolAddress: string;
    shares?: string;
    from: string;
    minAmounts?: string[];
  }): Promise<{ xdr: string; estimatedFee: string }> {
    const { xdr: stellarXdrMod, Operation, TransactionBuilder, Account, Contract, Address: StellarAddress } = await import("@stellar/stellar-sdk");
    const { rpc } = await import("@stellar/stellar-sdk");
    const { createSorobanClient, createHorizonClient } = await import("../../utils/stellar-client.js");
    const { getNetworkPassphrase } = await import("../../utils/network.js");

    // 1. Resolve share amount — fetch user balance if not provided
    const { shareToken } = await this.getShareInfo(params.poolAddress);
    let shareAmount: bigint;
    if (params.shares) {
      shareAmount = BigInt(params.shares);
    } else {
      shareAmount = await this.getUserShares(params.poolAddress, params.from);
      if (shareAmount === 0n) throw new Error("User has no LP shares in this pool");
    }

    // 2. Build args: withdraw(user, share_amount, [min_a, min_b])
    const minAmounts = params.minAmounts ?? ["1", "1"];
    const minAmountsScVal = minAmounts.map((a) => buildScVal("u128", a));
    const withdrawArgs = [
      buildScVal("address", params.from),
      buildScVal("u128", shareAmount.toString()),
      stellarXdrMod.ScVal.scvVec(minAmountsScVal),
    ];

    // 3. Build burn sub-invocation (required auth for share token burn)
    const burnInvocation = new stellarXdrMod.SorobanAuthorizedInvocation({
      function: stellarXdrMod.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
        new stellarXdrMod.InvokeContractArgs({
          functionName: "burn",
          contractAddress: new StellarAddress(shareToken).toScAddress(),
          args: [
            buildScVal("address", params.from),
            buildScVal("i128", shareAmount.toString()),
          ],
        }),
      ),
      subInvocations: [],
    });

    // 4. Build withdraw root invocation with burn as sub-invocation
    const withdrawRootInvocation = new stellarXdrMod.SorobanAuthorizationEntry({
      credentials: stellarXdrMod.SorobanCredentials.sorobanCredentialsSourceAccount(),
      rootInvocation: new stellarXdrMod.SorobanAuthorizedInvocation({
        function: stellarXdrMod.SorobanAuthorizedFunction.sorobanAuthorizedFunctionTypeContractFn(
          new stellarXdrMod.InvokeContractArgs({
            contractAddress: new StellarAddress(params.poolAddress).toScAddress(),
            functionName: "withdraw",
            args: withdrawArgs,
          }),
        ),
        subInvocations: [burnInvocation],
      }),
    });

    // 5. Build and simulate the transaction
    const soroban = createSorobanClient(this.config);
    const horizon = createHorizonClient(this.config);
    const networkPassphrase = getNetworkPassphrase(this.config.network);

    const account = await horizon.loadAccount(params.from);
    const operation = Operation.invokeContractFunction({
      contract: params.poolAddress,
      function: "withdraw",
      args: withdrawArgs,
      auth: [withdrawRootInvocation],
    });

    const tx = new TransactionBuilder(account, { fee: "10000000", networkPassphrase })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    const simulation = await soroban.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simulation)) {
      throw new Error(`Withdraw simulation failed: ${simulation.error}`);
    }

    const preparedTx = rpc.assembleTransaction(tx, simulation).build();
    return {
      xdr: preparedTx.toXDR(),
      estimatedFee: simulation.minResourceFee ?? "0",
    };
  }

  /**
   * Build claim LP rewards TX.
   * Calls pool.claim(user)
   */
  async buildClaim(params: {
    poolAddress: string;
    from: string;
  }): Promise<{ xdr: string; estimatedFee: string }> {
    const args = [buildScVal("address", params.from)];
    const result = await invokeContract(this.config, params.poolAddress, "claim", args, params.from);
    return { xdr: result.xdr, estimatedFee: result.simulationResult.resourceFee };
  }

  /**
   * Query a concentrated pool position for a user at given tick range.
   * Returns { liquidity, tokens_owed_0, tokens_owed_1 }.
   */
  async getPosition(params: {
    poolAddress: string;
    user: string;
    tickLower: number;
    tickUpper: number;
  }): Promise<{ liquidity: string; tokensOwed0: string; tokensOwed1: string } | null> {
    const { nativeToScVal, scValToNative } = await import("@stellar/stellar-sdk");

    const args = [
      buildScVal("address", params.user),
      nativeToScVal(params.tickLower, { type: "i32" }),
      nativeToScVal(params.tickUpper, { type: "i32" }),
    ];

    const result = await viewCall(this.config, params.poolAddress, "get_position", args);
    if (!result) return null;

    const { xdr: stellarXdrMod } = await import("@stellar/stellar-sdk");
    const val = scValToNative(stellarXdrMod.ScVal.fromXDR(result, "base64"));
    return {
      liquidity: String(val.liquidity ?? "0"),
      tokensOwed0: String(val.tokens_owed_0 ?? "0"),
      tokensOwed1: String(val.tokens_owed_1 ?? "0"),
    };
  }

  // ─── Yield Aggregator interface ────────────────────────────────

  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    // Use internal API (ammBase/pools/) which returns APY + TVL fields.
    // The external API (apiBase/pools/) does NOT include these fields.
    const url = `${this.ammBase}/pools/?sort=-liquidity&size=100`;
    let pools: any[] = [];
    try {
      const res = await fetch(url, { headers: AQUARIUS_HEADERS, signal: AbortSignal.timeout(AQUARIUS_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`Aquarius API ${res.status}`);
      const data = (await res.json()) as any;
      pools = data.items ?? data.results ?? [];
    } catch (err) {
      log.warn("Aquarius getYieldOpportunities fetch failed", { err: String(err) });
      return [];
    }

    const opportunities: YieldOpportunity[] = [];

    for (const pool of pools) {
      const rawTokens: string[] = Array.isArray(pool.tokens_str)
        ? (pool.tokens_str as string[])
        : typeof pool.tokens_str === "string"
          ? pool.tokens_str.split("-")
          : [];

      // Resolve raw token strings to clean symbols:
      //   "native" → "XLM"
      //   "yXLM:GARDNV3Q..." → "yXLM"
      //   "C..." → KNOWN_ASSETS lookup
      const tokens = rawTokens.map((t: string) => getAssetSymbol(t, this.config.network));

      // Internal API fields: apy (fee), rewards_apy, total_apy — all decimals (0.006 = 0.6%)
      const feeApy = pool.apy != null ? parseFloat(String(pool.apy)) * 100 : null;
      const rewardApy = pool.rewards_apy != null ? parseFloat(String(pool.rewards_apy)) * 100 : null;
      const totalApy = pool.total_apy != null ? parseFloat(String(pool.total_apy)) * 100
        : feeApy != null || rewardApy != null ? (feeApy ?? 0) + (rewardApy ?? 0) : null;

      // liquidity_usd is in stroops (7 decimals) — divide by 1e7 for USD
      const tvlRaw = pool.liquidity_usd;
      const tvl = tvlRaw != null ? String(parseFloat(String(tvlRaw)) / 1e7) : null;

      opportunities.push({
        protocol: "aquarius",
        type: "lp",
        name: `Aquarius ${tokens.join("-")}`,
        assets: tokens,
        apy: {
          base: feeApy,
          reward: rewardApy,
          total: totalApy,
          rewardToken: "AQUA",
        },
        tvl,
        poolAddress: pool.address,
        risk: "medium",
        status: "ok",
        fee: pool.fee ? String(pool.fee) : undefined,
        poolType: pool.pool_type,
      });
    }

    return opportunities;
  }
}
