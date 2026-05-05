import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepCreateAccount } from "./step-create-account";

const mockHook = jest.fn();
jest.mock("@/features/account/hooks/use-onboarding-deploy", () => ({
  useOnboardingDeploy: (...args: unknown[]) => mockHook(...args),
}));

beforeEach(() => {
  mockHook.mockReturnValue({
    deploy: jest.fn(),
    retry: jest.fn(),
    isDeploying: false,
    deploySubStep: "idle",
    deployCompleted: false,
    setupCompleted: false,
    deployError: null,
    deployErrorWasRejection: false,
    allDone: false,
  });
});

describe("StepCreateAccount", () => {
  it("renders title + two-tx explainer + sign button", () => {
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /create your smart account/i })).toBeInTheDocument();
    expect(screen.getByText(/two transactions/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign with your wallet/i })).toBeInTheDocument();
  });

  it("calls deploy() when sign button clicked", async () => {
    const deploy = jest.fn();
    mockHook.mockReturnValue({
      deploy,
      retry: jest.fn(),
      isDeploying: false,
      deploySubStep: "idle",
      deployCompleted: false,
      setupCompleted: false,
      deployError: null,
      deployErrorWasRejection: false,
      allDone: false,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /sign with your wallet/i }));
    expect(deploy).toHaveBeenCalled();
  });

  it("calls onComplete when allDone becomes true", () => {
    const onComplete = jest.fn();
    mockHook.mockReturnValue({
      deploy: jest.fn(),
      retry: jest.fn(),
      isDeploying: false,
      deploySubStep: "done",
      deployCompleted: true,
      setupCompleted: true,
      deployError: null,
      deployErrorWasRejection: false,
      allDone: true,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={onComplete} />);
    expect(onComplete).toHaveBeenCalled();
  });

  it("renders rejection error with Retry button", () => {
    mockHook.mockReturnValue({
      deploy: jest.fn(),
      retry: jest.fn(),
      isDeploying: false,
      deploySubStep: "idle",
      deployCompleted: false,
      setupCompleted: false,
      deployError: "Signing was cancelled in your wallet.",
      deployErrorWasRejection: true,
      allDone: false,
    });
    render(<StepCreateAccount publicKey="GABC" preset="Balanced" onComplete={jest.fn()} />);
    expect(screen.getByText(/signing was cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
