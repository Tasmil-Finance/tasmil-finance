import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { TransactionList } from "../transaction-list";

jest.mock("../../hooks/use-stellar-transactions", () => ({
  useStellarTransactions: () => ({
    data: {
      pages: [
        {
          ops: [
            {
              id: "op1",
              type: "payment",
              created_at: "2026-05-04T10:00:00Z",
              transaction_hash: "tx_send",
              paging_token: "1",
              transaction_successful: true,
              from: "GA",
              to: "GBOTHER",
              amount: "10",
              asset_type: "native",
            },
            {
              id: "op2",
              type: "path_payment_strict_send",
              created_at: "2026-05-04T09:55:00Z",
              transaction_hash: "tx_swap",
              paging_token: "2",
              transaction_successful: true,
              from: "GA",
              to: "GA",
              source_amount: "100",
              source_asset_type: "native",
              amount: "23.5",
              asset_code: "USDC",
              asset_issuer: "GA_ISSUER",
              asset_type: "credit_alphanum4",
            },
            {
              id: "op3",
              type: "payment",
              created_at: "2026-05-04T09:50:00Z",
              transaction_hash: "tx_fail",
              paging_token: "3",
              transaction_successful: false,
              from: "GA",
              to: "GBOTHER",
              amount: "1",
              asset_type: "native",
            },
          ],
          attrsByTx: {},
          nextCursor: null,
        },
      ],
    },
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
  }),
}));

jest.mock("../../hooks/use-soroban-token-meta", () => ({
  useSorobanTokenMeta: () => ({ lookup: () => undefined, isLoading: false }),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/portfolio",
}));

function renderList() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <TransactionList address="GA" />
    </QueryClientProvider>
  );
}

describe("<TransactionList>", () => {
  it("renders one row per transaction (3 tx hashes → 3 rows)", async () => {
    renderList();
    await waitFor(() => {
      expect(screen.getByText("XLM")).toBeInTheDocument();
      expect(screen.getByText("XLM to USDC")).toBeInTheDocument();
      expect(screen.getByText("Transaction Failed")).toBeInTheDocument();
    });
  });

  it("renders the swap source/destination", () => {
    renderList();
    expect(screen.getAllByText("XLM").length).toBeGreaterThan(0);
    expect(screen.getByText("XLM to USDC")).toBeInTheDocument();
  });

  it("renders the filter bar", () => {
    renderList();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });
});
