import { fireEvent, render, screen } from "@testing-library/react";
import type { TxGroup } from "../../lib/types";
import { TransactionRow } from "../transaction-row";

function makeGroup(over: Partial<TxGroup> = {}): TxGroup {
  return {
    txHash: "tx_abc",
    createdAt: "2026-05-04T10:00:00Z",
    successful: true,
    primary: {
      id: "op1",
      txHash: "tx_abc",
      pagingToken: "1",
      createdAt: "2026-05-04T10:00:00Z",
      kind: "send",
      successful: true,
      deltas: [{ code: "XLM", amount: "10", isCredit: false }],
      rawType: "payment",
    },
    ops: [
      {
        id: "op1",
        txHash: "tx_abc",
        pagingToken: "1",
        createdAt: "2026-05-04T10:00:00Z",
        kind: "send",
        successful: true,
        deltas: [{ code: "XLM", amount: "10", isCredit: false }],
        rawType: "payment",
      },
    ],
    attrs: {},
    ...over,
  };
}

describe("<TransactionRow>", () => {
  it("renders the kind label", () => {
    render(<TransactionRow group={makeGroup()} address="GA" />);
    expect(screen.getByText("Sent")).toBeInTheDocument();
  });

  it("renders signed amount with destructive colour for debits", () => {
    render(<TransactionRow group={makeGroup()} address="GA" />);
    const amount = screen.getByTestId("primary-amount");
    expect(amount).toHaveTextContent("−10");
    expect(amount.className).toMatch(/destructive/);
  });

  it("renders +N ops badge for multi-op groups", () => {
    const g = makeGroup();
    g.ops = [g.primary, { ...g.primary, id: "op2" }, { ...g.primary, id: "op3" }];
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByText(/\+ 2 ops/)).toBeInTheDocument();
  });

  it("renders failed variant for failed transactions", () => {
    const g = makeGroup({ successful: false });
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByText("Transaction Failed")).toBeInTheDocument();
  });

  it("renders SRC → DST for swaps", () => {
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
    render(<TransactionRow group={g} address="GA" />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("→")).toBeInTheDocument();
  });

  it("toggles detail panel on click", () => {
    render(<TransactionRow group={makeGroup()} address="GA" />);
    expect(screen.queryByTestId("tx-detail-panel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /sent/i }));
    expect(screen.getByTestId("tx-detail-panel")).toBeInTheDocument();
  });
});
