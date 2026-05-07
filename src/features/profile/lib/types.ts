export type OpKind =
  | "send"
  | "receive"
  | "swap"
  | "lp-deposit"
  | "lp-withdraw"
  | "lend-deposit"
  | "lend-withdraw"
  | "harvest"
  | "trustline-add"
  | "trustline-remove"
  | "create-account"
  | "merge-account"
  | "claim-balance"
  | "lock-balance"
  | "contract-other"
  | "classic-other"
  | "manage-buy-offer"
  | "manage-sell-offer"
  | "passive-sell-offer"
  | "manage-data"
  | "set-options"
  | "set-trustline-flags"
  | "allow-trust"
  | "begin-sponsoring"
  | "end-sponsoring"
  | "revoke-sponsorship"
  | "clawback"
  | "bump-sequence"
  | "inflation"
  | "extend-footprint-ttl"
  | "restore-footprint"
  | "soroban-token-mint";

export type Protocol = "soroswap" | "blend" | "aquarius" | "phoenix" | "stellar";

export interface AssetDelta {
  code: string;
  issuer?: string;
  amount: string;
  isCredit: boolean;
  contractId?: string;
}

export interface DecodedOp {
  id: string;
  txHash: string;
  pagingToken: string;
  createdAt: string;
  kind: OpKind;
  successful: boolean;
  protocol?: Protocol;
  deltas: AssetDelta[];
  counterparty?: string;
  rawType: string;
  rawFnName?: string;
}

export interface TxAttrs {
  feeChargedStroops?: string;
  memo?: string | null;
  memoType?: string | null;
  ledger?: number;
  envelopeXdr?: string;
  operationCount?: number;
}

export interface TxGroup {
  txHash: string;
  createdAt: string;
  successful: boolean;
  primary: DecodedOp;
  ops: DecodedOp[];
  attrs: TxAttrs;
}

export interface SorobanTokenMeta {
  code: string;
  decimals: number;
  contractId: string;
}

export type TokenMetaLookup = (contractId: string) => SorobanTokenMeta | undefined;

// ─── Row presentation (consumed by transaction-row.tsx) ───────────────

export type AvatarGlyph = "user" | "wallet" | "plus" | "arrow-up" | "x-circle";

export type SublineGlyph =
  | "sent"
  | "received"
  | "swap"
  | "contract"
  | "failed"
  | "add"
  | "remove"
  | "generic";

export type RowAvatar =
  | { kind: "token"; code: string; src?: string }
  | {
      kind: "bordered-glyph";
      glyph: AvatarGlyph;
      corner?: { glyph: AvatarGlyph; tone: "primary" | "destructive" };
    }
  | { kind: "swap-dual"; src: string; dst: string };

export type AmountDisplay =
  | { kind: "none" }
  | { kind: "multiple" }
  | { kind: "single"; value: string; code: string; isCredit: boolean };

export interface RowPresentation {
  title: string;
  subline: string;
  sublineGlyph: SublineGlyph;
  avatar: RowAvatar;
  amount: AmountDisplay;
  date: string;
  moreOpsLabel?: string;
}
