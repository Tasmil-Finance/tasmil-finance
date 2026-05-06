import { fireEvent, render, screen } from "@testing-library/react";
import { ActivityDrawer } from "./activity-drawer";

describe("ActivityDrawer", () => {
  it("does not render content when closed", () => {
    render(
      <ActivityDrawer open={false} onOpenChange={() => {}} activities={[]} isLoading={false} />
    );
    expect(screen.queryAllByText(/activity timeline/i)).toHaveLength(0);
  });

  it("renders content when open", () => {
    render(
      <ActivityDrawer open={true} onOpenChange={() => {}} activities={[]} isLoading={false} />
    );
    expect(screen.queryAllByText(/activity timeline/i).length).toBeGreaterThan(0);
  });

  it("calls onOpenChange(false) on close button click", () => {
    const onOpenChange = jest.fn();
    render(
      <ActivityDrawer open={true} onOpenChange={onOpenChange} activities={[]} isLoading={false} />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
