import { fireEvent, render, screen } from "@testing-library/react";
import type { ActivityItem, PositionData } from "@/features/account/types";
import { PerformanceTab } from "./performance-tab";

const position = {
  positions: [],
  status: "ACTIVE",
  preset: "BALANCED",
  baseAsset: "USDC",
  activeAssets: ["USDC"],
} as unknown as PositionData;

describe("PerformanceTab", () => {
  it("renders chart, allocation, and activity sidebar", () => {
    render(
      <PerformanceTab
        position={position}
        activities={[]}
        activitiesLoading={false}
        unallocatedWalletUsd={0}
        publicKey="GABC"
        onOpenDrawer={() => {}}
      />
    );
    expect(screen.getByText("Portfolio Value")).toBeInTheDocument();
    expect(screen.getByText("Allocation")).toBeInTheDocument();
    expect(screen.getAllByText("Activity").length).toBeGreaterThan(0);
  });

  it("calls onOpenDrawer when 'See all' is clicked", () => {
    const onOpenDrawer = jest.fn();
    render(
      <PerformanceTab
        position={position}
        activities={[{ id: "1", type: "FUND", createdAt: "2026-05-01" } as ActivityItem]}
        activitiesLoading={false}
        unallocatedWalletUsd={0}
        publicKey="GABC"
        onOpenDrawer={onOpenDrawer}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /see all/i }));
    expect(onOpenDrawer).toHaveBeenCalled();
  });
});
