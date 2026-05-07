import { formatRowDate } from "@/shared/utils/date-group";
import type { RowPresentation, TxGroup } from "./types";
import type { OpKind } from "./types";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  Droplets,
  Layers,
  Link2,
  Lock,
  type LucideIcon,
  PiggyBank,
  Shield,
  ShieldOff,
  TrendingUp,
  UserPlus,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";

const FAILED_PRESENTATION = {
  title: "Transaction Failed",
  subline: "Failed",
  sublineGlyph: "failed",
  avatar: {
    kind: "bordered-glyph",
    glyph: "wallet",
    corner: { glyph: "x-circle", tone: "destructive" },
  },
  amount: { kind: "none" },
} as const;

function humanizeOpType(rawType: string): string {
  return rawType
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const TITLE_BY_KIND: Partial<Record<TxGroup["primary"]["kind"], string>> = {
  "manage-buy-offer": "Manage Buy Offer",
  "manage-sell-offer": "Manage Sell Offer",
  "passive-sell-offer": "Create Passive Sell Offer",
  "manage-data": "Manage Data",
  "set-options": "Set Options",
  "set-trustline-flags": "Set Trustline Flags",
  "allow-trust": "Allow Trust",
  "begin-sponsoring": "Begin Sponsoring Future Reserves",
  "end-sponsoring": "End Sponsoring Future Reserves",
  "revoke-sponsorship": "Revoke Sponsorship",
  clawback: "Clawback",
  "bump-sequence": "Bump Sequence",
  inflation: "Inflation",
  "extend-footprint-ttl": "Extend Footprint TTL",
  "restore-footprint": "Restore Footprint",
};

function genericRow(title: string): {
  title: string;
  subline: string;
  sublineGlyph: "generic";
  avatar: { kind: "bordered-glyph"; glyph: "user" };
  amount: { kind: "none" };
} {
  return {
    title,
    subline: "Operation",
    sublineGlyph: "generic",
    avatar: { kind: "bordered-glyph", glyph: "user" },
    amount: { kind: "none" },
  };
}

/**
 * Resolve a display label for an OpKind without computing the whole RowPresentation.
 * Used by detail-panel / sidebar which need per-op labels.
 */
export function getOpLabel(kind: OpKind): string {
  const titled = TITLE_BY_KIND[kind];
  if (titled) return titled;
  switch (kind) {
    case "send": return "Sent";
    case "receive": return "Received";
    case "swap": return "Swap";
    case "lp-deposit": return "Added Liquidity";
    case "lp-withdraw": return "Removed Liquidity";
    case "lend-deposit": return "Deposit";
    case "lend-withdraw": return "Withdraw";
    case "harvest": return "Harvest";
    case "trustline-add": return "Add trustline";
    case "trustline-remove": return "Remove trustline";
    case "create-account": return "Create Account";
    case "merge-account": return "Merge Account";
    case "claim-balance": return "Claim Balance";
    case "lock-balance": return "Lock Balance";
    case "contract-other": return "Contract Function";
    case "classic-other": return "Operation";
    case "soroban-token-mint": return "Mint";
    default: return "Operation";
  }
}

export interface IconStyle {
  icon: LucideIcon;
  bg: string;
  fg: string;
  label: string;
}

const OP_ICONS: Record<OpKind, IconStyle> = {
  send: { icon: ArrowUpRight, bg: "bg-destructive/10", fg: "text-destructive", label: "Sent" },
  receive: { icon: ArrowDownLeft, bg: "bg-emerald-500/10", fg: "text-emerald-400", label: "Received" },
  swap: { icon: ArrowLeftRight, bg: "bg-violet-500/10", fg: "text-violet-400", label: "Swap" },
  "lp-deposit": { icon: Droplets, bg: "bg-violet-500/10", fg: "text-violet-400", label: "Added Liquidity" },
  "lp-withdraw": { icon: Droplets, bg: "bg-amber-500/10", fg: "text-amber-400", label: "Removed Liquidity" },
  "lend-deposit": { icon: PiggyBank, bg: "bg-emerald-500/10", fg: "text-emerald-400", label: "Deposit" },
  "lend-withdraw": { icon: Wallet, bg: "bg-amber-500/10", fg: "text-amber-400", label: "Withdraw" },
  harvest: { icon: Zap, bg: "bg-emerald-500/10", fg: "text-emerald-400", label: "Harvest" },
  "trustline-add": { icon: Shield, bg: "bg-blue-500/10", fg: "text-blue-400", label: "Add trustline" },
  "trustline-remove": { icon: ShieldOff, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Remove trustline" },
  "create-account": { icon: UserPlus, bg: "bg-emerald-500/10", fg: "text-emerald-400", label: "Create Account" },
  "merge-account": { icon: Link2, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Merge Account" },
  "claim-balance": { icon: Coins, bg: "bg-emerald-500/10", fg: "text-emerald-400", label: "Claim Balance" },
  "lock-balance": { icon: Lock, bg: "bg-amber-500/10", fg: "text-amber-400", label: "Lock Balance" },
  "contract-other": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Contract Function" },
  "classic-other": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Operation" },
  "manage-buy-offer": { icon: TrendingUp, bg: "bg-amber-500/10", fg: "text-amber-400", label: "Manage Buy Offer" },
  "manage-sell-offer": { icon: TrendingUp, bg: "bg-amber-500/10", fg: "text-amber-400", label: "Manage Sell Offer" },
  "passive-sell-offer": { icon: TrendingUp, bg: "bg-amber-500/10", fg: "text-amber-400", label: "Create Passive Sell Offer" },
  "manage-data": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Manage Data" },
  "set-options": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Set Options" },
  "set-trustline-flags": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Set Trustline Flags" },
  "allow-trust": { icon: Shield, bg: "bg-blue-500/10", fg: "text-blue-400", label: "Allow Trust" },
  "begin-sponsoring": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Begin Sponsoring Future Reserves" },
  "end-sponsoring": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "End Sponsoring Future Reserves" },
  "revoke-sponsorship": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Revoke Sponsorship" },
  clawback: { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Clawback" },
  "bump-sequence": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Bump Sequence" },
  inflation: { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Inflation" },
  "extend-footprint-ttl": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Extend Footprint TTL" },
  "restore-footprint": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Restore Footprint" },
  "soroban-token-mint": { icon: Layers, bg: "bg-muted/30", fg: "text-muted-foreground", label: "Mint" },
};

const FAILED_ICON: IconStyle = {
  icon: XCircle,
  bg: "bg-destructive/10",
  fg: "text-destructive",
  label: "Transaction Failed",
};

export function getOpIconStyle(kind: OpKind, successful: boolean): IconStyle {
  return successful ? OP_ICONS[kind] : FAILED_ICON;
}

function moreOpsLabel(group: TxGroup): string | undefined {
  if (group.ops.length <= 1) return undefined;
  return ` + ${group.ops.length - 1} ops`;
}

export function presentRow(group: TxGroup, _viewer: string): RowPresentation {
  const date = formatRowDate(new Date(group.createdAt));
  const more = moreOpsLabel(group);
  const withCommon = <T extends Omit<RowPresentation, "date" | "moreOpsLabel">>(
    base: T,
  ): RowPresentation => ({
    ...base,
    date,
    ...(more !== undefined ? { moreOpsLabel: more } : {}),
  });

  if (!group.successful) {
    return withCommon({ ...FAILED_PRESENTATION });
  }

  const primary = group.primary;
  const deltas = primary.deltas;
  const dst = deltas.find((d) => d.isCredit) ?? deltas[0];
  const src = deltas.find((d) => !d.isCredit) ?? deltas[0];

  switch (primary.kind) {
    case "send": {
      const code = dst?.code ?? "XLM";
      return withCommon({
        title: code,
        subline: "Sent",
        sublineGlyph: "sent",
        avatar: { kind: "token", code },
        amount: dst
          ? { kind: "single", value: dst.amount, code: dst.code, isCredit: false }
          : { kind: "none" },
      });
    }
    case "receive": {
      const code = dst?.code ?? "XLM";
      return withCommon({
        title: code,
        subline: "Received",
        sublineGlyph: "received",
        avatar: { kind: "token", code },
        amount: dst
          ? { kind: "single", value: dst.amount, code: dst.code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "swap": {
      const srcCode = src?.code ?? "XLM";
      const dstCode = dst?.code ?? "XLM";
      return withCommon({
        title: `${srcCode} to ${dstCode}`,
        subline: "Swapped",
        sublineGlyph: "swap",
        avatar: { kind: "swap-dual", src: srcCode, dst: dstCode },
        amount: dst
          ? { kind: "single", value: dst.amount, code: dst.code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "lp-deposit": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Liquidity Pool Deposit",
        subline: "Sent",
        sublineGlyph: "sent",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: false }
          : { kind: "none" },
      });
    }
    case "lp-withdraw": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Liquidity Pool Withdraw",
        subline: "Received",
        sublineGlyph: "received",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "lend-deposit": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Deposit",
        subline: "Sent",
        sublineGlyph: "sent",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: false }
          : { kind: "none" },
      });
    }
    case "lend-withdraw": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Withdraw",
        subline: "Received",
        sublineGlyph: "received",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "harvest": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Harvest",
        subline: "Received",
        sublineGlyph: "received",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "trustline-add": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Add trustline",
        subline: "Added",
        sublineGlyph: "add",
        avatar: { kind: "token", code },
        amount: { kind: "none" },
      });
    }
    case "trustline-remove": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Remove trustline",
        subline: "Removed",
        sublineGlyph: "remove",
        avatar: { kind: "token", code },
        amount: { kind: "none" },
      });
    }
    case "create-account": {
      const isReceiving = !!deltas[0]?.isCredit;
      return withCommon({
        title: "Create Account",
        subline: isReceiving ? "Received" : "Sent",
        sublineGlyph: isReceiving ? "received" : "sent",
        avatar: {
          kind: "bordered-glyph",
          glyph: "user",
          corner: { glyph: isReceiving ? "plus" : "arrow-up", tone: "primary" },
        },
        amount: deltas[0]
          ? {
              kind: "single",
              value: deltas[0].amount,
              code: deltas[0].code,
              isCredit: isReceiving,
            }
          : { kind: "none" },
      });
    }
    case "merge-account": {
      return withCommon({
        title: "Account Merge",
        subline: "Operation",
        sublineGlyph: "generic",
        avatar: { kind: "bordered-glyph", glyph: "user" },
        amount: { kind: "none" },
      });
    }
    case "claim-balance": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Claim Claimable Balance",
        subline: "Received",
        sublineGlyph: "received",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: true }
          : { kind: "none" },
      });
    }
    case "lock-balance": {
      const code = deltas[0]?.code ?? "XLM";
      return withCommon({
        title: "Create Claimable Balance",
        subline: "Sent",
        sublineGlyph: "sent",
        avatar: { kind: "token", code },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: false }
          : { kind: "none" },
      });
    }
    case "contract-other": {
      const distinct = new Set(deltas.map((d) => d.code));
      const amount =
        deltas.length === 0
          ? ({ kind: "none" } as const)
          : distinct.size > 1 || deltas.length > 1
            ? ({ kind: "multiple" } as const)
            : ({
                kind: "single" as const,
                value: deltas[0]!.amount,
                code: deltas[0]!.code,
                isCredit: deltas[0]!.isCredit,
              });
      return withCommon({
        title: "Contract Function",
        subline: "Interacted",
        sublineGlyph: "contract",
        avatar: { kind: "bordered-glyph", glyph: "user" },
        amount,
      });
    }
    case "soroban-token-mint": {
      const isReceiving = !!deltas[0]?.isCredit;
      if (isReceiving && deltas[0]) {
        return withCommon({
          title: deltas[0].code,
          subline: "Received",
          sublineGlyph: "received",
          avatar: { kind: "token", code: deltas[0].code },
          amount: {
            kind: "single",
            value: deltas[0].amount,
            code: deltas[0].code,
            isCredit: true,
          },
        });
      }
      return withCommon({
        title: "Mint",
        subline: "Minted",
        sublineGlyph: "generic",
        avatar: { kind: "bordered-glyph", glyph: "user" },
        amount: deltas[0]
          ? { kind: "single", value: deltas[0].amount, code: deltas[0].code, isCredit: false }
          : { kind: "none" },
      });
    }
    case "manage-buy-offer":
    case "manage-sell-offer":
    case "passive-sell-offer":
    case "manage-data":
    case "set-options":
    case "set-trustline-flags":
    case "allow-trust":
    case "begin-sponsoring":
    case "end-sponsoring":
    case "revoke-sponsorship":
    case "clawback":
    case "bump-sequence":
    case "inflation":
    case "extend-footprint-ttl":
    case "restore-footprint": {
      return withCommon(genericRow(TITLE_BY_KIND[primary.kind] ?? humanizeOpType(primary.rawType)));
    }
    case "classic-other": {
      return withCommon(genericRow(humanizeOpType(primary.rawType)));
    }
    default:
      return withCommon(genericRow(humanizeOpType(primary.rawType)));
  }
}
