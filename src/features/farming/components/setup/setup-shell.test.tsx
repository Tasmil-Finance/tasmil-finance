import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupShell } from "./setup-shell";

describe("SetupShell", () => {
  it("renders step indicator and children", () => {
    render(
      <SetupShell currentStep={2} totalSteps={5} onCta={() => {}} ctaLabel="Continue">
        <div>body</div>
      </SetupShell>
    );
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
  });

  it("calls onCta when CTA clicked", async () => {
    const onCta = jest.fn();
    render(
      <SetupShell currentStep={1} totalSteps={5} onCta={onCta} ctaLabel="Next">
        <div />
      </SetupShell>
    );
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onCta).toHaveBeenCalled();
  });

  it("renders back button only when onBack provided", () => {
    const { rerender } = render(
      <SetupShell currentStep={1} totalSteps={5} onCta={() => {}} ctaLabel="Next">
        <div />
      </SetupShell>
    );
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();

    const onBack = jest.fn();
    rerender(
      <SetupShell currentStep={2} totalSteps={5} onBack={onBack} onCta={() => {}} ctaLabel="Next">
        <div />
      </SetupShell>
    );
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("hides CTA when hideCta is true", () => {
    render(
      <SetupShell currentStep={1} totalSteps={5} onCta={() => {}} ctaLabel="Next" hideCta>
        <div />
      </SetupShell>
    );
    expect(screen.queryByRole("button", { name: /next/i })).toBeNull();
  });
});
