import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepConnect } from "./step-connect";

const connect = jest.fn();
const mockUseWallet = jest.fn();
jest.mock("@/shared/context/wallet-context", () => ({
  useWallet: () => mockUseWallet(),
}));

beforeEach(() => {
  connect.mockClear();
  mockUseWallet.mockReturnValue({ isConnected: false, connect });
});

describe("StepConnect", () => {
  it("renders Get started title and Continue orb button", () => {
    render(<StepConnect onConnected={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /get started/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("calls connect() when disconnected and orb clicked", async () => {
    render(<StepConnect onConnected={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(connect).toHaveBeenCalled();
  });

  it("calls onConnected() when connected and orb clicked", async () => {
    const onConnected = jest.fn();
    mockUseWallet.mockReturnValue({ isConnected: true, connect });
    render(<StepConnect onConnected={onConnected} />);
    // The useEffect fires onConnected on mount; clear and verify click also fires it
    onConnected.mockClear();
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(onConnected).toHaveBeenCalled();
  });

  it("auto-fires onConnected when isConnected becomes true", () => {
    const onConnected = jest.fn();
    const { rerender } = render(<StepConnect onConnected={onConnected} />);
    expect(onConnected).not.toHaveBeenCalled();
    mockUseWallet.mockReturnValue({ isConnected: true, connect });
    rerender(<StepConnect onConnected={onConnected} />);
    expect(onConnected).toHaveBeenCalled();
  });

  it("renders bottom corner copy", () => {
    render(<StepConnect onConnected={jest.fn()} />);
    expect(screen.getByText(/your portfolio keeps/i)).toBeInTheDocument();
    expect(screen.getByText(/© 2026 Tasmil/i)).toBeInTheDocument();
  });
});
