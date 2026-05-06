import { groupByTransaction } from "./group-by-transaction";
import type { DecodedOp, TxAttrs } from "./types";

function op(over: Partial<DecodedOp>): DecodedOp {
  return {
    id: "id",
    txHash: "tx1",
    pagingToken: "1",
    createdAt: "2026-05-04T10:00:00Z",
    kind: "send",
    successful: true,
    deltas: [],
    rawType: "payment",
    ...over,
  };
}

const noAttrs: Record<string, TxAttrs> = {};

describe("groupByTransaction", () => {
  it("returns one group per tx hash", () => {
    const ops = [
      op({
        id: "a",
        txHash: "t1",
        kind: "lp-deposit",
        deltas: [{ code: "USDC", amount: "100", isCredit: false }],
      }),
      op({
        id: "b",
        txHash: "t1",
        kind: "send",
        deltas: [{ code: "XLM", amount: "10", isCredit: false }],
      }),
      op({
        id: "c",
        txHash: "t2",
        kind: "receive",
        deltas: [{ code: "BLND", amount: "5", isCredit: true }],
      }),
    ];
    const groups = groupByTransaction(ops, noAttrs);
    expect(groups).toHaveLength(2);
    expect(groups[0]!.ops).toHaveLength(2);
    expect(groups[1]!.ops).toHaveLength(1);
  });

  it("primary picks first swap when present", () => {
    const groups = groupByTransaction(
      [
        op({ id: "a", kind: "send", deltas: [{ code: "X", amount: "1", isCredit: false }] }),
        op({ id: "b", kind: "swap", deltas: [{ code: "X", amount: "1", isCredit: false }] }),
        op({ id: "c", kind: "lp-deposit" }),
      ],
      noAttrs
    );
    expect(groups[0]!.primary.id).toBe("b");
  });

  it("primary picks first lend-deposit when no swap", () => {
    const groups = groupByTransaction(
      [op({ id: "a", kind: "send" }), op({ id: "b", kind: "lend-deposit" })],
      noAttrs
    );
    expect(groups[0]!.primary.id).toBe("b");
  });

  it("falls back to largest abs delta when no DeFi op present", () => {
    const groups = groupByTransaction(
      [
        op({ id: "a", kind: "send", deltas: [{ code: "X", amount: "1", isCredit: false }] }),
        op({ id: "b", kind: "send", deltas: [{ code: "X", amount: "1000", isCredit: false }] }),
      ],
      noAttrs
    );
    expect(groups[0]!.primary.id).toBe("b");
  });

  it("group is unsuccessful if any op failed", () => {
    const groups = groupByTransaction(
      [
        op({ id: "a", kind: "send", successful: true }),
        op({ id: "b", kind: "send", successful: false }),
      ],
      noAttrs
    );
    expect(groups[0]!.successful).toBe(false);
  });

  it("attaches tx attrs by hash", () => {
    const groups = groupByTransaction([op({ id: "a", txHash: "tABC" })], {
      tABC: { feeChargedStroops: "100", memo: "hi", ledger: 42, operationCount: 1 },
    });
    expect(groups[0]!.attrs.feeChargedStroops).toBe("100");
    expect(groups[0]!.attrs.memo).toBe("hi");
  });
});
