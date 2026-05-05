import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepDeposit } from "./step-deposit";

const baseProps = {
  asset: "USDC" as const,
  preset: "Balanced" as const,
  estimatedApy: 8.4,
  poolCount: 3,
  balance: 250,
  isFunding: false,
  onFund: jest.fn(),
};

beforeEach(() => {
  baseProps.onFund.mockClear();
});

describe("StepDeposit", () => {
  it("renders Your Deposit hero, available, APR and Markets cells", () => {
    render(<StepDeposit {...baseProps} />);
    expect(screen.getByText(/your deposit/i)).toBeInTheDocument();
    expect(screen.getByText(/250.* available/i)).toBeInTheDocument();
    expect(screen.getByText("8.4%")).toBeInTheDocument();
    expect(screen.getByText(/3 markets/i)).toBeInTheDocument();
  });

  it("Max button fills input with full balance for USDC", async () => {
    render(<StepDeposit {...baseProps} />);
    await userEvent.click(screen.getByRole("button", { name: /max/i }));
    expect((screen.getByLabelText(/deposit amount/i) as HTMLInputElement).value).toBe("250.00");
  });

  it("Deposit button disabled when amount empty or below min", async () => {
    render(<StepDeposit {...baseProps} />);
    expect(screen.getByRole("button", { name: /deposit/i })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/deposit amount/i), "0.5");
    expect(screen.getByRole("button", { name: /deposit/i })).toBeDisabled();
  });

  it("Deposit button calls onFund with parsed amount + asset", async () => {
    render(<StepDeposit {...baseProps} />);
    await userEvent.type(screen.getByLabelText(/deposit amount/i), "50");
    await userEvent.click(screen.getByRole("button", { name: /deposit/i }));
    expect(baseProps.onFund).toHaveBeenCalledWith(50, "USDC");
  });

  it("Deposit button disabled when amount exceeds balance", async () => {
    render(<StepDeposit {...baseProps} />);
    await userEvent.type(screen.getByLabelText(/deposit amount/i), "9999");
    expect(screen.getByRole("button", { name: /deposit/i })).toBeDisabled();
  });
});
