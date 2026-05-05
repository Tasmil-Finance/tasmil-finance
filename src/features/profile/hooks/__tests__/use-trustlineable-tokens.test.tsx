// Use the real react-query (setup-tests.ts globally mocks useQuery to a noop).
jest.unmock("@tanstack/react-query");
jest.mock("@tanstack/react-query", () => jest.requireActual("@tanstack/react-query"));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useTrustlineableTokens } from "../use-trustlineable-tokens";

const mockTokens = [
  { symbol: "USDC", chains: ["stellar", "ethereum"], issuer: "GUSDC" },
  { symbol: "BLND", chains: ["stellar"], issuer: "GBLND" },
  { symbol: "XLM", chains: ["stellar"] }, // no issuer — must be filtered out
  { symbol: "ETH", chains: ["ethereum"], issuer: "irrelevant" }, // not on stellar
];

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ tokens: mockTokens }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.resetAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useTrustlineableTokens", () => {
  it("returns only stellar tokens that have an issuer", async () => {
    const { result } = renderHook(() => useTrustlineableTokens(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const symbols = result.current.data?.map((t) => t.symbol);
    expect(symbols).toEqual(["USDC", "BLND"]);
  });
});
