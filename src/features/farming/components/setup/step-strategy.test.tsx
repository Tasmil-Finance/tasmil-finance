import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepStrategy } from "./step-strategy";

const defaultProps = {
  mode: "AUTO" as const,
  onSelect: jest.fn(),
};

beforeEach(() => {
  defaultProps.onSelect.mockClear();
});

describe("StepStrategy", () => {
  it("renders Agent Strategy title and Auto/Custom circles", () => {
    render(<StepStrategy {...defaultProps} />);
    expect(screen.getByRole("heading", { name: /agent strategy/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /auto/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /custom/i })).toBeInTheDocument();
  });

  it("Auto circle reflects selected state when mode=AUTO", () => {
    render(<StepStrategy {...defaultProps} mode="AUTO" />);
    expect(screen.getByRole("radio", { name: /auto/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /custom/i })).toHaveAttribute("aria-checked", "false");
  });

  it("clicking Custom calls onSelect with CUSTOM", async () => {
    const onSelect = jest.fn();
    render(<StepStrategy {...defaultProps} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("radio", { name: /custom/i }));
    expect(onSelect).toHaveBeenCalledWith("CUSTOM");
  });

  it("clicking Auto calls onSelect with AUTO", async () => {
    const onSelect = jest.fn();
    render(<StepStrategy {...defaultProps} mode="CUSTOM" onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("radio", { name: /auto/i }));
    expect(onSelect).toHaveBeenCalledWith("AUTO");
  });

  it("back button renders only when onBack provided", async () => {
    const { rerender } = render(<StepStrategy {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();

    const onBack = jest.fn();
    rerender(<StepStrategy {...defaultProps} onBack={onBack} />);
    const backBtn = screen.getByRole("button", { name: /back/i });
    await userEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
