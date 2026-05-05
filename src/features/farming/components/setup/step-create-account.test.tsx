import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepCreateAccount } from "./step-create-account";

const mockHook = jest.fn();
jest.mock("@/features/account/hooks/use-onboarding-deploy", () => ({
  useOnboardingDeploy: (...args: unknown[]) => mockHook(...args),
}));

const idleState = {
  deploy: jest.fn(),
  retry: jest.fn(),
  isDeploying: false,
  deploySubStep: "idle" as const,
  deployCompleted: false,
  setupCompleted: false,
  deployError: null,
  deployErrorWasRejection: false,
  allDone: false,
};

beforeEach(() => {
  mockHook.mockReturnValue({ ...idleState });
});

describe("StepCreateAccount", () => {
  it("renders title, two-tx explainer, and Sign orb", () => {
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /create smart wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/two transactions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign with your wallet/i })).toBeInTheDocument();
  });

  it("calls deploy() when Sign orb clicked", async () => {
    const deploy = jest.fn();
    mockHook.mockReturnValue({ ...idleState, deploy });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /sign with your wallet/i }));
    expect(deploy).toHaveBeenCalled();
  });

  it("fires onComplete when allDone becomes true", () => {
    const onComplete = jest.fn();
    mockHook.mockReturnValue({
      ...idleState,
      deploySubStep: "done",
      deployCompleted: true,
      setupCompleted: true,
      allDone: true,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalled();
  });

  it("renders rejection error with Retry button", () => {
    mockHook.mockReturnValue({
      ...idleState,
      deployError: "Signing was cancelled in your wallet.",
      deployErrorWasRejection: true,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    expect(screen.getByText(/signing was cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders back button when onBack provided", async () => {
    const onBack = jest.fn();
    render(
      <StepCreateAccount
        publicKey="GABC"
        preset="Balanced"
        onComplete={jest.fn()}
        onBack={onBack}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
