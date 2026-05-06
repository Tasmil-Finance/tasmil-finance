import { fireEvent, render, screen } from "@testing-library/react";
import { type FilterState, TransactionFilterBar } from "../transaction-filter-bar";

describe("<TransactionFilterBar>", () => {
  it("renders chip per category", () => {
    render(<TransactionFilterBar value={{ filters: [], query: "" }} onChange={() => {}} />);
    for (const label of ["All", "Send/Receive", "Swap", "DeFi", "Other", "Failed"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("toggles a chip on click", () => {
    let state: FilterState = { filters: [], query: "" };
    render(
      <TransactionFilterBar
        value={state}
        onChange={(s) => {
          state = s;
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Swap" }));
    expect(state.filters).toEqual(["swap"]);
  });

  it("updates query on input", () => {
    let state: FilterState = { filters: [], query: "" };
    render(
      <TransactionFilterBar
        value={state}
        onChange={(s) => {
          state = s;
        }}
      />
    );
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "abc" } });
    expect(state.query).toBe("abc");
  });
});
