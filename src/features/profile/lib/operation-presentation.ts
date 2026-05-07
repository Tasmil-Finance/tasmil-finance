import { formatRowDate } from "@/shared/utils/date-group";
import type { RowPresentation, TxGroup } from "./types";

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
    default:
      return withCommon({
        title: primary.rawType,
        subline: "Operation",
        sublineGlyph: "generic",
        avatar: { kind: "bordered-glyph", glyph: "user" },
        amount: { kind: "none" },
      });
  }
}
