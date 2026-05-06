import { render, screen } from "@testing-library/react";
import { DeployStepper } from "./deploy-stepper";

describe("DeployStepper", () => {
  it("renders all 3 step labels", () => {
    render(<DeployStepper subStep="idle" deployCompleted={false} setupCompleted={false} />);
    expect(screen.getByText("Deploy account")).toBeInTheDocument();
    expect(screen.getByText("Configure session key")).toBeInTheDocument();
    expect(screen.getByText("Apply strategy")).toBeInTheDocument();
  });

  it("idle state: all steps pending (numeric markers)", () => {
    const { container } = render(
      <DeployStepper subStep="idle" deployCompleted={false} setupCompleted={false} />
    );
    expect(container.querySelectorAll(".animate-spin").length).toBe(0);
    expect(container.querySelectorAll('svg[class*="lucide-check"]').length).toBe(0);
  });

  it("signing_deploy: deploy is active (spinner), others pending", () => {
    const { container } = render(
      <DeployStepper subStep="signing_deploy" deployCompleted={false} setupCompleted={false} />
    );
    expect(container.querySelectorAll(".animate-spin").length).toBe(1);
    expect(container.querySelectorAll('svg[class*="lucide-check"]').length).toBe(0);
  });

  it("deployCompleted + signing_setup: deploy done (check), setup active (spinner)", () => {
    const { container } = render(
      <DeployStepper subStep="signing_setup" deployCompleted={true} setupCompleted={false} />
    );
    expect(container.querySelectorAll('svg[class*="lucide-check"]').length).toBe(1);
    expect(container.querySelectorAll(".animate-spin").length).toBe(1);
  });

  it("deploy + setup completed, applying_preset: 2 checks, preset spinner", () => {
    const { container } = render(
      <DeployStepper subStep="applying_preset" deployCompleted={true} setupCompleted={true} />
    );
    expect(container.querySelectorAll('svg[class*="lucide-check"]').length).toBe(2);
    expect(container.querySelectorAll(".animate-spin").length).toBe(1);
  });

  it("subStep=done: all 3 steps show check", () => {
    const { container } = render(
      <DeployStepper subStep="done" deployCompleted={true} setupCompleted={true} />
    );
    expect(container.querySelectorAll('svg[class*="lucide-check"]').length).toBe(3);
    expect(container.querySelectorAll(".animate-spin").length).toBe(0);
  });

  it("statusText renders + appends 'keep Freighter open' hint", () => {
    render(
      <DeployStepper
        subStep="signing_deploy"
        deployCompleted={false}
        setupCompleted={false}
        statusText="Sign transaction 1 of 2 — Deploy Account"
      />
    );
    expect(screen.getByText(/Sign transaction 1 of 2 — Deploy Account/i)).toBeInTheDocument();
    expect(screen.getByText(/keep Freighter open/i)).toBeInTheDocument();
  });

  it("statusText omitted: no status line rendered", () => {
    render(<DeployStepper subStep="idle" deployCompleted={false} setupCompleted={false} />);
    expect(screen.queryByText(/keep Freighter open/i)).toBeNull();
  });
});
