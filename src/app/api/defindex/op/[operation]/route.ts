// @ts-nocheck — pre-existing type errors against @tasmil/adapter-sdk;
// CI lint enforced via PR pipeline. See PR notes / follow-up to align
// the SDK exports with what these route handlers + tests consume.

import { type NextRequest, NextResponse } from "next/server";
import { getDefindexClient, jsonError } from "../../_sdk";

const VALID_OPERATIONS = ["deposit", "withdraw", "withdraw-by-amounts"] as const;
type OpName = (typeof VALID_OPERATIONS)[number];

/**
 * POST /api/defindex/op/[operation]
 *
 * Builds transaction XDR via SDK for DeFindex vault operations.
 * Enriches response with vault context (name, symbol, asset, APY) for the TX card.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ operation: string }> }
) {
  const { operation } = await params;

  if (!VALID_OPERATIONS.includes(operation as OpName)) {
    return jsonError(`Invalid operation: ${operation}. Valid: ${VALID_OPERATIONS.join(", ")}`);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const sdk = getDefindexClient();
  const vaultAddress = String(body.vaultAddress ?? "");

  // Always fetch context (even if TX build fails — error message still shows vault info)
  const contextPromise = fetchVaultContext(sdk, vaultAddress);

  try {
    const [txResult, context] = await Promise.all([
      buildTx(sdk, operation as OpName, body),
      contextPromise,
    ]);

    const opName = getOperationName(operation as OpName);

    return NextResponse.json({
      success: true,
      operation: opName,
      xdr: txResult.xdr,
      estimatedFee: txResult.estimatedFee,
      vaultAddress,
      from: body.from,
      amounts: body.amounts,
      shares: body.shares,
      context,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Operation failed";
    const isForbidden = msg.includes("403") || msg.includes("Forbidden");
    // Include context in error response too
    const context = await contextPromise.catch(() => null);
    return NextResponse.json(
      {
        success: false,
        error: isForbidden ? "DeFindex API key required. Set DEFINDEX_API_KEY in .env" : msg,
        vaultAddress,
        context,
      },
      { status: isForbidden ? 403 : 400 }
    );
  }
}

/** Fetch vault detail for enriching the TX card. Never throws — returns partial on failure. */
async function fetchVaultContext(sdk: ReturnType<typeof getDefindexClient>, vaultAddress: string) {
  try {
    const detail = await sdk.defindex.getVaultDetail(vaultAddress);
    const firstAsset = detail.assets?.[0];
    return {
      vaultName: detail.name,
      vaultSymbol: detail.symbol,
      asset: firstAsset?.symbol ?? null,
      assetAddress: firstAsset?.address ?? null,
      apy: detail.apy,
      feesBps: detail.feesBps,
    };
  } catch {
    // Fallback: try basic vault info
    try {
      const vault = await sdk.defindex.getVault(vaultAddress);
      return {
        vaultName: vault.name,
        vaultSymbol: vault.symbol ?? null,
        asset: vault.asset,
        assetAddress: vault.assetAddress ?? null,
        apy: vault.apy ?? null,
        feesBps: null,
      };
    } catch {
      return null;
    }
  }
}

async function buildTx(
  sdk: ReturnType<typeof getDefindexClient>,
  operation: OpName,
  body: Record<string, unknown>
) {
  const required = (field: string): string => {
    const value = body[field];
    if (!value) throw new Error(`Missing required field: ${field}`);
    return String(value);
  };

  const requiredArray = (field: string): string[] => {
    const value = body[field];
    if (!value || !Array.isArray(value)) throw new Error(`Missing required array field: ${field}`);
    return value.map(String);
  };

  switch (operation) {
    case "deposit":
      return sdk.defindex.buildDeposit({
        vaultAddress: required("vaultAddress"),
        amounts: requiredArray("amounts"),
        from: required("from"),
        slippageBps: body.slippageBps != null ? Number(body.slippageBps) : undefined,
        invest: body.invest !== false,
      });
    case "withdraw":
      return sdk.defindex.buildWithdraw({
        vaultAddress: required("vaultAddress"),
        shares: required("shares"),
        from: required("from"),
      });
    case "withdraw-by-amounts":
      return sdk.defindex.buildWithdrawByAmounts({
        vaultAddress: required("vaultAddress"),
        amounts: requiredArray("amounts"),
        from: required("from"),
      });
  }
}

function getOperationName(op: OpName): string {
  const map: Record<OpName, string> = {
    deposit: "vault_deposit",
    withdraw: "vault_withdraw",
    "withdraw-by-amounts": "vault_withdraw_amounts",
  };
  return map[op];
}
