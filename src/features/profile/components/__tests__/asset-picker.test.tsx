// Use real react-query (global mock in setup-tests.ts)
jest.unmock("@tanstack/react-query");
jest.mock("@tanstack/react-query", () => jest.requireActual("@tanstack/react-query"));

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AssetPicker } from "../asset-picker";

const tokens = [
  { symbol: "USDC", name: "USD Coin", chains: ["stellar"], issuer: "GUSDC" },
  { symbol: "BLND", name: "Blend", chains: ["stellar"], issuer: "GBLND" },
  { symbol: "AQUA", name: "Aquarius", chains: ["stellar"], issuer: "GAQUA" },
];

beforeEach(() => {
  // cmdk calls scrollIntoView on selected items; JSDOM lacks it.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = jest.fn();
  }
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ tokens }),
  }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("AssetPicker", () => {
  it("shows placeholder when value is null", () => {
    wrap(<AssetPicker value={null} onChange={() => {}} excludeKeys={new Set()} />);
    expect(screen.getByRole("button", { name: /select asset/i })).toBeInTheDocument();
  });

  it("shows the selected asset code when value is set", () => {
    wrap(
      <AssetPicker
        value={{ code: "USDC", issuer: "GUSDC" }}
        onChange={() => {}}
        excludeKeys={new Set()}
      />
    );
    expect(screen.getByRole("button")).toHaveTextContent("USDC");
  });

  it("filters out assets in excludeKeys", async () => {
    const user = userEvent.setup();
    wrap(<AssetPicker value={null} onChange={() => {}} excludeKeys={new Set(["USDC:GUSDC"])} />);

    await user.click(screen.getByRole("button", { name: /select asset/i }));
    await waitFor(() => expect(screen.getByText(/Blend/)).toBeInTheDocument());

    expect(screen.queryByText(/USD Coin/)).not.toBeInTheDocument();
    expect(screen.getByText(/Blend/)).toBeInTheDocument();
    expect(screen.getByText(/Aquarius/)).toBeInTheDocument();
  });

  it("calls onChange with {code, issuer} when an item is clicked", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    wrap(<AssetPicker value={null} onChange={onChange} excludeKeys={new Set()} />);

    await user.click(screen.getByRole("button", { name: /select asset/i }));
    await waitFor(() => expect(screen.getByText(/Blend/)).toBeInTheDocument());

    await user.click(screen.getByText(/Blend/));

    expect(onChange).toHaveBeenCalledWith({ code: "BLND", issuer: "GBLND" });
  });
});
