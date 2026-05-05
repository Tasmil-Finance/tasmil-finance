import { render, screen } from "@testing-library/react";
import { StepDone } from "./step-done";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

beforeEach(() => {
  replace.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("StepDone", () => {
  it("renders success message", () => {
    render(<StepDone />);
    expect(screen.getByRole("heading", { name: /all set/i })).toBeInTheDocument();
    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
  });

  it("redirects to /farming after 1500ms", () => {
    render(<StepDone />);
    expect(replace).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1500);
    expect(replace).toHaveBeenCalledWith("/farming");
  });
});
