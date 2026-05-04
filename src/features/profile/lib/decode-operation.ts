import BigNumber from "bignumber.js";
import type { AssetDelta, DecodedOp, OpKind, TokenMetaLookup } from "./types";

export interface AssetBalanceChange {
  type: "transfer" | "mint" | "burn" | "clawback";
  from?: string;
  to?: string;
  amount: string; // raw stroops
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string; // contract id for sac/contract assets
}

export interface RawHorizonOp {
  id: string;
  type: string;
  type_i?: number;
  created_at: string;
  transaction_hash: string;
  paging_token: string;
  transaction_successful?: boolean;

  // payment
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  from?: string;
  to?: string;

  // path_payment
  source_amount?: string;
  source_asset_type?: string;
  source_asset_code?: string;
  source_asset_issuer?: string;

  // create_account
  funder?: string;
  account?: string;
  starting_balance?: string;

  // change_trust
  limit?: string;

  // account_merge
  into?: string;

  // soroban
  function?: string;
  parameters?: Array<{ value: string; type: string }>;
  asset_balance_changes?: AssetBalanceChange[];
}

function normalizeAmount(raw: string): string {
  const bn = new BigNumber(raw);
  return bn.isNaN() ? raw : bn.toFixed();
}

function classicAssetCode(type: string | undefined, code: string | undefined): string {
  if (type === "native") return "XLM";
  return code ?? "XLM";
}

function classicIssuer(type: string | undefined, issuer: string | undefined): string | undefined {
  if (type === "native") return undefined;
  return issuer;
}

function paymentDelta(
  amountRaw: string,
  isCredit: boolean,
  type: string | undefined,
  code: string | undefined,
  issuer: string | undefined,
): AssetDelta {
  return {
    code: classicAssetCode(type, code),
    issuer: classicIssuer(type, issuer),
    amount: normalizeAmount(amountRaw),
    isCredit,
    contractId: undefined,
  };
}

function emptyDecoded(op: RawHorizonOp, kind: OpKind): DecodedOp {
  return {
    id: op.id,
    txHash: op.transaction_hash,
    pagingToken: op.paging_token,
    createdAt: op.created_at,
    kind,
    successful: op.transaction_successful !== false,
    deltas: [],
    rawType: op.type,
  };
}

export function decodeOperation(
  op: RawHorizonOp,
  address: string,
  _tokenMeta: TokenMetaLookup,
): DecodedOp {
  const successful = op.transaction_successful !== false;

  // ── Classic transfers ───────────────────────────────────────────────
  if (op.type === "payment") {
    const outgoing = op.from === address;
    const kind: OpKind = outgoing ? "send" : "receive";
    const delta = paymentDelta(
      op.amount ?? "0",
      !outgoing,
      op.asset_type,
      op.asset_code,
      op.asset_issuer,
    );
    return {
      ...emptyDecoded(op, kind),
      successful,
      deltas: [delta],
      counterparty: outgoing ? op.to : op.from,
    };
  }

  if (op.type === "path_payment_strict_send" || op.type === "path_payment_strict_receive") {
    const src = paymentDelta(
      op.source_amount ?? "0",
      false,
      op.source_asset_type,
      op.source_asset_code,
      op.source_asset_issuer,
    );
    const dst = paymentDelta(
      op.amount ?? "0",
      true,
      op.asset_type,
      op.asset_code,
      op.asset_issuer,
    );
    return {
      ...emptyDecoded(op, "swap"),
      successful,
      deltas: [src, dst],
      counterparty: op.to !== address ? op.to : undefined,
    };
  }

  if (op.type === "create_account") {
    const isReceiving = op.account === address;
    const delta: AssetDelta = {
      code: "XLM",
      amount: normalizeAmount(op.starting_balance ?? "0"),
      isCredit: isReceiving,
    };
    return {
      ...emptyDecoded(op, "create-account"),
      successful,
      deltas: [delta],
      counterparty: isReceiving ? op.funder : op.account,
    };
  }

  if (op.type === "change_trust") {
    const limit = op.limit ?? "0";
    const isRemove = new BigNumber(limit).isZero();
    return {
      ...emptyDecoded(op, isRemove ? "trustline-remove" : "trustline-add"),
      successful,
      deltas: [],
    };
  }

  if (op.type === "account_merge") {
    return { ...emptyDecoded(op, "merge-account"), successful, counterparty: op.into };
  }

  if (op.type === "claim_claimable_balance") {
    return { ...emptyDecoded(op, "claim-balance"), successful };
  }

  if (op.type === "create_claimable_balance") {
    return { ...emptyDecoded(op, "lock-balance"), successful };
  }

  if (
    op.type === "manage_sell_offer" ||
    op.type === "manage_buy_offer" ||
    op.type === "create_passive_sell_offer"
  ) {
    return { ...emptyDecoded(op, "dex-offer"), successful };
  }

  if (op.type === "liquidity_pool_deposit") {
    return { ...emptyDecoded(op, "lp-deposit"), successful, protocol: "stellar" };
  }

  if (op.type === "liquidity_pool_withdraw") {
    return { ...emptyDecoded(op, "lp-withdraw"), successful, protocol: "stellar" };
  }

  if (op.type === "invoke_host_function") {
    // Soroban handling lands in a follow-up task.
    return { ...emptyDecoded(op, "contract-other"), successful, rawFnName: op.function };
  }

  return { ...emptyDecoded(op, "classic-other"), successful };
}
