import { decodeOperation, type RawHorizonOp } from "./decode-operation";
import type { SorobanTokenMeta } from "./types";

const ADDR = "GA7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7XYZ7";
const OTHER = "GBOTHER1OTHER1OTHER1OTHER1OTHER1OTHER1OTHER1OTHER1";

function base(over: Partial<RawHorizonOp> = {}): RawHorizonOp {
  return {
    id: "op1",
    type: "payment",
    created_at: "2026-05-04T10:00:00Z",
    transaction_hash: "tx1",
    paging_token: "1",
    transaction_successful: true,
    ...over,
  };
}

const noMeta = () => undefined;

describe("decodeOperation — classic ops", () => {
  it("classifies outgoing payment as send", () => {
    const op = base({
      type: "payment",
      from: ADDR,
      to: OTHER,
      amount: "10.0000000",
      asset_type: "native",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("send");
    expect(r.deltas).toEqual([
      { code: "XLM", amount: "10", isCredit: false, issuer: undefined, contractId: undefined },
    ]);
    expect(r.counterparty).toBe(OTHER);
  });

  it("classifies incoming payment as receive", () => {
    const op = base({
      type: "payment",
      from: OTHER,
      to: ADDR,
      amount: "5.5",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      asset_type: "credit_alphanum4",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("receive");
    expect(r.deltas[0]).toMatchObject({ code: "USDC", amount: "5.5", isCredit: true });
    expect(r.counterparty).toBe(OTHER);
  });

  it("classifies path_payment as swap", () => {
    const op = base({
      type: "path_payment_strict_send",
      from: ADDR,
      to: ADDR,
      source_amount: "100",
      source_asset_type: "native",
      amount: "23.5",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      asset_type: "credit_alphanum4",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("swap");
    expect(r.deltas).toEqual([
      { code: "XLM", amount: "100", isCredit: false, issuer: undefined, contractId: undefined },
      { code: "USDC", amount: "23.5", isCredit: true, issuer: "GA_ISSUER", contractId: undefined },
    ]);
  });

  it("classifies create_account when wallet is funded as receive", () => {
    const op = base({
      type: "create_account",
      funder: OTHER,
      account: ADDR,
      starting_balance: "10",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("create-account");
    expect(r.deltas[0]).toMatchObject({ code: "XLM", amount: "10", isCredit: true });
  });

  it("classifies change_trust limit=0 as trustline-remove", () => {
    const op = base({
      type: "change_trust",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      limit: "0.0000000",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("trustline-remove");
  });

  it("classifies change_trust limit>0 as trustline-add", () => {
    const op = base({
      type: "change_trust",
      asset_code: "USDC",
      asset_issuer: "GA_ISSUER",
      limit: "1000",
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.kind).toBe("trustline-add");
  });

  it("propagates failed transactions", () => {
    const op = base({
      type: "payment",
      from: ADDR,
      to: OTHER,
      amount: "1",
      asset_type: "native",
      transaction_successful: false,
    });
    const r = decodeOperation(op, ADDR, noMeta);
    expect(r.successful).toBe(false);
  });

  it("classifies manage_sell_offer as dex-offer", () => {
    const r = decodeOperation(base({ type: "manage_sell_offer" }), ADDR, noMeta);
    expect(r.kind).toBe("dex-offer");
  });

  it("classifies liquidity_pool_deposit as lp-deposit (stellar)", () => {
    const r = decodeOperation(base({ type: "liquidity_pool_deposit" }), ADDR, noMeta);
    expect(r.kind).toBe("lp-deposit");
    expect(r.protocol).toBe("stellar");
  });

  it("classifies unknown classic type as classic-other", () => {
    const r = decodeOperation(base({ type: "set_options" }), ADDR, noMeta);
    expect(r.kind).toBe("classic-other");
  });
});

const META: Record<string, SorobanTokenMeta> = {
  CC_USDC: { code: "USDC", decimals: 7, contractId: "CC_USDC" },
  CC_BLND: { code: "BLND", decimals: 7, contractId: "CC_BLND" },
  CC_XLM: { code: "XLM", decimals: 7, contractId: "CC_XLM" },
};
const meta = (id: string) => META[id];

describe("decodeOperation — Soroban via asset_balance_changes", () => {
  it("classifies single-credit transfer as receive", () => {
    const op = base({
      type: "invoke_host_function",
      function: "HostFunctionTypeHostFunctionTypeInvokeContract",
      asset_balance_changes: [
        {
          type: "transfer",
          from: OTHER,
          to: ADDR,
          amount: "12345678",
          asset_type: "credit_alphanum4",
          asset_issuer: "CC_USDC",
          asset_code: "USDC",
        },
      ],
    });
    const r = decodeOperation(op, ADDR, meta);
    expect(r.kind).toBe("receive");
    expect(r.deltas).toEqual([
      {
        code: "USDC",
        amount: "1.2345678",
        isCredit: true,
        issuer: "CC_USDC",
        contractId: "CC_USDC",
      },
    ]);
  });

  it("classifies single-debit transfer as send", () => {
    const op = base({
      type: "invoke_host_function",
      asset_balance_changes: [
        {
          type: "transfer",
          from: ADDR,
          to: OTHER,
          amount: "10000000",
          asset_type: "credit_alphanum4",
          asset_issuer: "CC_USDC",
          asset_code: "USDC",
        },
      ],
    });
    const r = decodeOperation(op, ADDR, meta);
    expect(r.kind).toBe("send");
    expect(r.deltas[0]).toMatchObject({ amount: "1", isCredit: false });
  });

  it("classifies one debit + one credit as swap", () => {
    const op = base({
      type: "invoke_host_function",
      asset_balance_changes: [
        { type: "transfer", from: ADDR, to: "C_ROUTER", amount: "100000000", asset_type: "native" },
        {
          type: "transfer",
          from: "C_ROUTER",
          to: ADDR,
          amount: "23500000",
          asset_type: "credit_alphanum4",
          asset_issuer: "CC_USDC",
          asset_code: "USDC",
        },
      ],
    });
    const r = decodeOperation(op, ADDR, meta);
    expect(r.kind).toBe("swap");
    expect(r.deltas).toHaveLength(2);
    expect(r.deltas[0]).toMatchObject({ code: "XLM", isCredit: false });
    expect(r.deltas[1]).toMatchObject({ code: "USDC", isCredit: true });
  });

  it("classifies known-protocol single-debit as lend-deposit", () => {
    // CDF37Z2B... is the mainnet blend USDC strategy from protocol-registry.
    const op = base({
      type: "invoke_host_function",
      asset_balance_changes: [
        {
          type: "transfer",
          from: ADDR,
          to: "CDF37Z2B5JDF5UB3I3Y3COFTH3I3JF3ECKKIXDZBOUAVEO7LN5LH2SXN",
          amount: "1000000",
          asset_type: "credit_alphanum4",
          asset_code: "USDC",
          asset_issuer: "CC_USDC",
        },
      ],
    });
    const orig = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
    process.env.NEXT_PUBLIC_STELLAR_NETWORK = "mainnet";
    try {
      jest.resetModules();
      const { decodeOperation: fresh } = require("./decode-operation");
      const r = fresh(op, ADDR, meta);
      expect(r.protocol).toBe("blend");
      expect(r.kind).toBe("lend-deposit");
    } finally {
      if (orig === undefined) {
        delete process.env.NEXT_PUBLIC_STELLAR_NETWORK;
      } else {
        process.env.NEXT_PUBLIC_STELLAR_NETWORK = orig;
      }
    }
  });

  it("falls back to contract-other when balance changes are empty", () => {
    const op = base({
      type: "invoke_host_function",
      function: "do_thing",
      asset_balance_changes: [],
    });
    const r = decodeOperation(op, ADDR, meta);
    expect(r.kind).toBe("contract-other");
    expect(r.rawFnName).toBe("do_thing");
    expect(r.successful).toBe(true);
    expect(r.deltas).toEqual([]);
  });

  it("classifies single-credit + fnName=harvest as harvest", () => {
    const op = base({
      type: "invoke_host_function",
      function: "harvest",
      asset_balance_changes: [
        {
          type: "transfer",
          from: OTHER,
          to: ADDR,
          amount: "5000000",
          asset_type: "credit_alphanum4",
          asset_issuer: "CC_BLND",
          asset_code: "BLND",
        },
      ],
    });
    const r = decodeOperation(op, ADDR, meta);
    expect(r.kind).toBe("harvest");
  });

  it("uses 7-decimal fallback when token meta unknown", () => {
    const op = base({
      type: "invoke_host_function",
      asset_balance_changes: [
        {
          type: "transfer",
          from: OTHER,
          to: ADDR,
          amount: "10000000",
          asset_type: "credit_alphanum4",
          asset_issuer: "CC_UNKNOWN",
          asset_code: "FOO",
        },
      ],
    });
    const r = decodeOperation(op, ADDR, () => undefined);
    expect(r.deltas[0]).toMatchObject({ code: "FOO", amount: "1" });
  });
});
