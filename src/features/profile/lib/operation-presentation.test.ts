import { presentRow } from "./operation-presentation";
import type { TxGroup } from "./types";

const VIEWER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

function makeGroup(over: Partial<TxGroup> = {}): TxGroup {
  const base: TxGroup = {
    txHash: "tx_hash_1",
    createdAt: "2026-05-04T10:00:00.000Z",
    successful: true,
    primary: {
      id: "op_1",
      txHash: "tx_hash_1",
      pagingToken: "1",
      createdAt: "2026-05-04T10:00:00.000Z",
      kind: "send",
      successful: true,
      deltas: [{ code: "XLM", amount: "10", isCredit: false }],
      rawType: "payment",
    },
    ops: [],
    attrs: {},
  };
  base.ops = [base.primary];
  return { ...base, ...over };
}

describe("presentRow — failed override", () => {
  it("returns the failed shape regardless of kind when group.successful is false", () => {
    const g = makeGroup({ successful: false });
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("Transaction Failed");
    expect(row.subline).toBe("Failed");
    expect(row.sublineGlyph).toBe("failed");
    expect(row.avatar).toEqual({
      kind: "bordered-glyph",
      glyph: "wallet",
      corner: { glyph: "x-circle", tone: "destructive" },
    });
    expect(row.amount).toEqual({ kind: "none" });
  });

  it("preserves moreOpsLabel even when failed", () => {
    const g = makeGroup({ successful: false });
    g.ops = [g.primary, { ...g.primary, id: "op_2" }, { ...g.primary, id: "op_3" }];
    const row = presentRow(g, VIEWER);
    expect(row.moreOpsLabel).toBe(" + 2 ops");
  });
});
