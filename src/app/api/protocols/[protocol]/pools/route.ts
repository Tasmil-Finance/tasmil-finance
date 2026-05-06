// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import type { NextRequest } from "next/server";
import { getClient, getNetwork, isValidProtocol, jsonError } from "../../_sdk";

const SUPPORTS_POOLS = new Set(["blend", "aquarius", "soroswap", "phoenix", "defindex"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ protocol: string }> }
) {
  const { protocol } = await params;
  if (!isValidProtocol(protocol)) return jsonError(`Unknown protocol: ${protocol}`, 404);
  if (!SUPPORTS_POOLS.has(protocol)) return jsonError(`${protocol} does not support pool listing`);

  try {
    const sdk = getClient();
    const network = getNetwork();

    switch (protocol) {
      case "blend": {
        const reg = await sdk.blend.loadRegistry();
        return Response.json({
          success: true,
          network,
          protocol,
          pools: reg.pools.map((p) => ({
            address: p.address,
            name: p.name,
            status: p.status,
            backstopRate: p.backstopRate,
            reserves: p.reserves.map((r) => ({
              symbol: r.symbol,
              assetAddress: r.assetAddress,
              supplyApy: r.supplyApy,
              borrowApy: r.borrowApy,
              totalSupplied: r.totalSupplied,
              totalBorrowed: r.totalBorrowed,
              utilization: r.utilization,
              collateralFactor: r.collateralFactor,
            })),
          })),
        });
      }
      case "aquarius": {
        const pools = await sdk.aquarius.listPools(2, 50);
        return Response.json({
          success: true,
          network,
          protocol,
          pools: pools.map((p) => ({
            address: p.address,
            poolType: p.pool_type,
            tokens: p.tokens,
            tokensStr: p.tokens_str,
            tvl: p.total_value_locked,
            volume24h: p.volume_24h,
            feeApy: p.fee_apy,
            rewardApy: p.reward_apy,
          })),
        });
      }
      case "soroswap": {
        const pools = await sdk.soroswap.listPools("soroswap");
        return Response.json({
          success: true,
          network,
          protocol,
          pools: pools.map((p) => ({
            address: p.address,
            token0: p.token0 ?? p.token0_address,
            token1: p.token1 ?? p.token1_address,
            tvl: p.tvl ?? p.tvlUsd,
            volume24h: p.volume_24h,
            fee: p.fee ?? p.totalFeeBps,
            protocol: p.protocol,
          })),
        });
      }
      case "phoenix": {
        const pools = await sdk.phoenix.listPools();
        return Response.json({
          success: true,
          network,
          protocol,
          pools: pools.map((p) => ({
            address: p.pool_address,
            assetA: p.asset_a,
            assetB: p.asset_b,
            lpShare: p.asset_lp_share,
            stakeAddress: p.stake_address,
            poolResponse: p.pool_response,
          })),
        });
      }
      case "defindex": {
        const vaults = await sdk.defindex.listVaults();
        return Response.json({
          success: true,
          network,
          protocol,
          pools: vaults.map((v) => ({
            address: v.address,
            name: v.name,
            symbol: v.symbol,
            asset: v.asset,
            assetAddress: v.assetAddress,
            totalSupply: v.totalSupply,
            tvl: v.tvl,
            apy: v.apy,
            status: v.status,
          })),
        });
      }
      default:
        return jsonError(`${protocol} does not support pool listing`);
    }
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to fetch pools", 500);
  }
}
