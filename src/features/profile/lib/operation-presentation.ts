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

  if (!group.successful) {
    return {
      ...FAILED_PRESENTATION,
      date,
      ...(more !== undefined ? { moreOpsLabel: more } : {}),
    };
  }

  // Subsequent tasks fill this in. For now, every successful group falls
  // through to a placeholder generic row so the module compiles.
  return {
    title: group.primary.rawType,
    subline: "Operation",
    sublineGlyph: "generic",
    avatar: { kind: "bordered-glyph", glyph: "user" },
    amount: { kind: "none" },
    date,
    ...(more !== undefined ? { moreOpsLabel: more } : {}),
  };
}
