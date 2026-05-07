import BigNumber from "bignumber.js";
import { lookupProtocol } from "./protocol-registry";
import type { AssetDelta, DecodedOp, OpKind, Protocol, TokenMetaLookup } from "./types";

const HARVEST_FN_NAMES = new Set(["claim", "claim_emissions", "claim_rewards", "harvest"]);

export interface AssetBalanceChange {
  type: "transfer" | "mint" | "burn" | "clawback";
  from?: string;
  to?: string;
  amount: string; // human-readable decimal (e.g. "0.1000000"), as Horizon emits
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
  issuer: string | undefined
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
  tokenMeta: TokenMetaLookup
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
      op.asset_issuer
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
      op.source_asset_issuer
    );
    const dst = paymentDelta(op.amount ?? "0", true, op.asset_type, op.asset_code, op.asset_issuer);
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

  if (op.type === "manage_sell_offer") {
    return { ...emptyDecoded(op, "manage-sell-offer"), successful };
  }
  if (op.type === "manage_buy_offer") {
    return { ...emptyDecoded(op, "manage-buy-offer"), successful };
  }
  if (op.type === "create_passive_sell_offer") {
    return { ...emptyDecoded(op, "passive-sell-offer"), successful };
  }
  if (op.type === "manage_data") {
    return { ...emptyDecoded(op, "manage-data"), successful };
  }
  if (op.type === "set_options") {
    return { ...emptyDecoded(op, "set-options"), successful };
  }
  if (op.type === "set_trust_line_flags") {
    return { ...emptyDecoded(op, "set-trustline-flags"), successful };
  }
  if (op.type === "allow_trust") {
    return { ...emptyDecoded(op, "allow-trust"), successful };
  }
  if (op.type === "begin_sponsoring_future_reserves") {
    return { ...emptyDecoded(op, "begin-sponsoring"), successful };
  }
  if (op.type === "end_sponsoring_future_reserves") {
    return { ...emptyDecoded(op, "end-sponsoring"), successful };
  }
  if (
    op.type === "revoke_sponsorship" ||
    (op.type.startsWith("revoke_") && op.type.endsWith("_sponsorship"))
  ) {
    return { ...emptyDecoded(op, "revoke-sponsorship"), successful };
  }
  if (op.type === "clawback" || op.type === "clawback_claimable_balance") {
    return { ...emptyDecoded(op, "clawback"), successful };
  }
  if (op.type === "bump_sequence") {
    return { ...emptyDecoded(op, "bump-sequence"), successful };
  }
  if (op.type === "inflation") {
    return { ...emptyDecoded(op, "inflation"), successful };
  }
  if (op.type === "extend_footprint_ttl") {
    return { ...emptyDecoded(op, "extend-footprint-ttl"), successful };
  }
  if (op.type === "restore_footprint") {
    return { ...emptyDecoded(op, "restore-footprint"), successful };
  }

  if (op.type === "liquidity_pool_deposit") {
    return { ...emptyDecoded(op, "lp-deposit"), successful, protocol: "stellar" };
  }

  if (op.type === "liquidity_pool_withdraw") {
    return { ...emptyDecoded(op, "lp-withdraw"), successful, protocol: "stellar" };
  }

  if (op.type === "invoke_host_function") {
    return decodeSoroban(op, address, tokenMeta, successful);
  }

  return { ...emptyDecoded(op, "classic-other"), successful };
}

function resolveCode(
  contractId: string | undefined,
  fallbackCode: string | undefined,
  tokenMeta: TokenMetaLookup
): string {
  if (contractId) {
    const m = tokenMeta(contractId);
    if (m) return m.code;
  }
  return fallbackCode ?? "XLM";
}

// Horizon already emits `asset_balance_changes[*].amount` in decimal form
// (e.g. "0.1000000"), not raw stroops — so we just canonicalize via BigNumber,
// never scaleByDecimals.
function abcToDelta(
  change: NonNullable<RawHorizonOp["asset_balance_changes"]>[number],
  isCredit: boolean,
  tokenMeta: TokenMetaLookup
): AssetDelta {
  const isNative = change.asset_type === "native";
  const contractId = isNative ? undefined : change.asset_issuer;
  const code = isNative ? "XLM" : resolveCode(contractId, change.asset_code, tokenMeta);
  return {
    code,
    issuer: contractId,
    amount: normalizeAmount(change.amount),
    isCredit,
    contractId,
  };
}

function decodeSoroban(
  op: RawHorizonOp,
  address: string,
  tokenMeta: TokenMetaLookup,
  successful: boolean
): DecodedOp {
  const fnName = op.function ?? undefined;
  const userChanges = (op.asset_balance_changes ?? []).filter(
    (c) => (c.from === address || c.to === address) && !new BigNumber(c.amount).isZero()
  );

  if (userChanges.length === 0) {
    return {
      ...emptyDecoded(op, "contract-other"),
      successful,
      rawFnName: fnName,
    };
  }

  const deltas: AssetDelta[] = userChanges.map((c) => abcToDelta(c, c.to === address, tokenMeta));

  // Counterparty contract = the non-address side of the first change.
  const counterParty = userChanges[0]!.to === address ? userChanges[0]!.from : userChanges[0]!.to;
  const protocol: Protocol | undefined = lookupProtocol(counterParty);

  const credits = deltas.filter((d) => d.isCredit);
  const debits = deltas.filter((d) => !d.isCredit);

  let kind: OpKind = "contract-other";

  if (debits.length > 0 && credits.length > 0) {
    kind = "swap";
  } else if (debits.length === 1 && credits.length === 0) {
    kind =
      protocol === "blend"
        ? "lend-deposit"
        : protocol === "soroswap" || protocol === "aquarius" || protocol === "phoenix"
          ? "lp-deposit"
          : "send";
  } else if (credits.length === 1 && debits.length === 0) {
    kind =
      protocol === "blend"
        ? "lend-withdraw"
        : protocol === "soroswap" || protocol === "aquarius" || protocol === "phoenix"
          ? "lp-withdraw"
          : HARVEST_FN_NAMES.has(fnName ?? "")
            ? "harvest"
            : "receive";
  } else if (debits.length > 1 && credits.length === 0) {
    kind = "lp-deposit";
  } else if (credits.length > 1 && debits.length === 0) {
    kind = "lp-withdraw";
  }

  return {
    ...emptyDecoded(op, kind),
    successful,
    deltas,
    counterparty: counterParty,
    protocol,
    rawFnName: fnName,
  };
}
