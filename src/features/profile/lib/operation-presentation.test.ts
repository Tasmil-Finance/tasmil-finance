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

describe("presentRow — payment kinds", () => {
  it("send: title is asset code, subline is Sent, avatar is token, amount is signed debit", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "send",
        deltas: [{ code: "XLM", amount: "10", isCredit: false }],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("XLM");
    expect(row.subline).toBe("Sent");
    expect(row.sublineGlyph).toBe("sent");
    expect(row.avatar).toEqual({ kind: "token", code: "XLM" });
    expect(row.amount).toEqual({ kind: "single", value: "10", code: "XLM", isCredit: false });
  });

  it("receive: title is asset code, subline is Received, avatar is token, amount is signed credit", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "receive",
        deltas: [{ code: "USDC", amount: "5.5", isCredit: true }],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("USDC");
    expect(row.subline).toBe("Received");
    expect(row.sublineGlyph).toBe("received");
    expect(row.avatar).toEqual({ kind: "token", code: "USDC" });
    expect(row.amount).toEqual({ kind: "single", value: "5.5", code: "USDC", isCredit: true });
  });

  it("swap: title is 'SRC to DST', subline is Swapped, avatar is swap-dual, amount uses dst credit", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "swap",
        deltas: [
          { code: "XLM", amount: "100", isCredit: false },
          { code: "USDC", amount: "23.5", isCredit: true },
        ],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("XLM to USDC");
    expect(row.subline).toBe("Swapped");
    expect(row.sublineGlyph).toBe("swap");
    expect(row.avatar).toEqual({ kind: "swap-dual", src: "XLM", dst: "USDC" });
    expect(row.amount).toEqual({ kind: "single", value: "23.5", code: "USDC", isCredit: true });
  });
});

describe("presentRow — defi / trustline / create-account / claim", () => {
  function single(kind: TxGroup["primary"]["kind"], delta: { code: string; amount: string; isCredit: boolean }) {
    const g = makeGroup({ primary: { ...makeGroup().primary, kind, deltas: [delta] } });
    g.ops = [g.primary];
    return g;
  }

  it("lp-deposit", () => {
    const row = presentRow(single("lp-deposit", { code: "USDC", amount: "5", isCredit: false }), VIEWER);
    expect(row.title).toBe("Liquidity Pool Deposit");
    expect(row.subline).toBe("Sent");
    expect(row.sublineGlyph).toBe("sent");
    expect(row.avatar).toEqual({ kind: "token", code: "USDC" });
    expect(row.amount).toEqual({ kind: "single", value: "5", code: "USDC", isCredit: false });
  });

  it("lp-withdraw", () => {
    const row = presentRow(single("lp-withdraw", { code: "USDC", amount: "5", isCredit: true }), VIEWER);
    expect(row.title).toBe("Liquidity Pool Withdraw");
    expect(row.subline).toBe("Received");
    expect(row.sublineGlyph).toBe("received");
  });

  it("lend-deposit", () => {
    const row = presentRow(single("lend-deposit", { code: "XLM", amount: "1", isCredit: false }), VIEWER);
    expect(row.title).toBe("Deposit");
    expect(row.subline).toBe("Sent");
  });

  it("lend-withdraw", () => {
    const row = presentRow(single("lend-withdraw", { code: "XLM", amount: "1", isCredit: true }), VIEWER);
    expect(row.title).toBe("Withdraw");
    expect(row.subline).toBe("Received");
  });

  it("harvest", () => {
    const row = presentRow(single("harvest", { code: "BLND", amount: "12", isCredit: true }), VIEWER);
    expect(row.title).toBe("Harvest");
    expect(row.subline).toBe("Received");
    expect(row.sublineGlyph).toBe("received");
  });

  it("trustline-add", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "trustline-add",
        deltas: [{ code: "AQUA", amount: "0", isCredit: false }],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("Add trustline");
    expect(row.subline).toBe("Added");
    expect(row.sublineGlyph).toBe("add");
    expect(row.avatar).toEqual({ kind: "token", code: "AQUA" });
  });

  it("trustline-remove", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "trustline-remove",
        deltas: [{ code: "AQUA", amount: "0", isCredit: false }],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("Remove trustline");
    expect(row.subline).toBe("Removed");
    expect(row.sublineGlyph).toBe("remove");
  });

  it("create-account received", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "create-account",
        deltas: [{ code: "XLM", amount: "5", isCredit: true }],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("Create Account");
    expect(row.subline).toBe("Received");
    expect(row.avatar).toEqual({
      kind: "bordered-glyph",
      glyph: "user",
      corner: { glyph: "plus", tone: "primary" },
    });
  });

  it("create-account sent", () => {
    const g = makeGroup({
      primary: {
        ...makeGroup().primary,
        kind: "create-account",
        deltas: [{ code: "XLM", amount: "5", isCredit: false }],
      },
    });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("Create Account");
    expect(row.subline).toBe("Sent");
    expect(row.avatar).toEqual({
      kind: "bordered-glyph",
      glyph: "user",
      corner: { glyph: "arrow-up", tone: "primary" },
    });
  });

  it("merge-account uses bordered user", () => {
    const g = makeGroup({ primary: { ...makeGroup().primary, kind: "merge-account", deltas: [] } });
    g.ops = [g.primary];
    const row = presentRow(g, VIEWER);
    expect(row.title).toBe("Account Merge");
    expect(row.subline).toBe("Operation");
    expect(row.sublineGlyph).toBe("generic");
    expect(row.avatar).toEqual({ kind: "bordered-glyph", glyph: "user" });
  });

  it("claim-balance is treated as Received", () => {
    const row = presentRow(single("claim-balance", { code: "USDC", amount: "10", isCredit: true }), VIEWER);
    expect(row.title).toBe("Claim Claimable Balance");
    expect(row.subline).toBe("Received");
    expect(row.avatar).toEqual({ kind: "token", code: "USDC" });
  });

  it("lock-balance is treated as Sent", () => {
    const row = presentRow(single("lock-balance", { code: "USDC", amount: "10", isCredit: false }), VIEWER);
    expect(row.title).toBe("Create Claimable Balance");
    expect(row.subline).toBe("Sent");
  });
});
