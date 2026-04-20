import { render, screen } from "@testing-library/react";
import { WelcomeRewardPage } from "./welcome-reward-page";

jest.mock("../hooks/use-welcome-reward", () => ({
  useWelcomeReward: jest.fn(),
}));

const { useWelcomeReward } = jest.requireMock("../hooks/use-welcome-reward") as {
  useWelcomeReward: jest.Mock;
};

describe("WelcomeRewardPage", () => {
  it("shows locked progress plus counting rules and supported apps", () => {
    useWelcomeReward.mockReturnValue({
      status: {
        reserved: true,
        welcomeCardSeen: true,
        currentVolumeUsd: 6.5,
        targetVolumeUsd: 10,
        progressPercent: 65,
        unlocked: false,
        unlockedAt: null,
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<WelcomeRewardPage />);

    expect(screen.getByText("Trade ≥ $10 volume to unlock")).toBeInTheDocument();
    expect(screen.getByText("$6.50 of $10.00")).toBeInTheDocument();
    expect(screen.getByText("65% complete")).toBeInTheDocument();
    expect(screen.getByText("How volume counts")).toBeInTheDocument();
    expect(screen.getByText("Supported apps")).toBeInTheDocument();
    expect(
      screen.getByText("Only supported Tasmil-routed transactions count in the current phase.")
    ).toBeInTheDocument();
    expect(screen.getByText("Blend Protocol")).toBeInTheDocument();
    expect(screen.getByText("Aquarius")).toBeInTheDocument();
    expect(screen.getByText("Stellar DEX")).toBeInTheDocument();
    expect(screen.getByText("DeFindex")).toBeInTheDocument();
  });

  it("shows the unlocked state once cumulative volume crosses the threshold", () => {
    useWelcomeReward.mockReturnValue({
      status: {
        reserved: true,
        welcomeCardSeen: true,
        currentVolumeUsd: 12,
        targetVolumeUsd: 10,
        progressPercent: 100,
        unlocked: true,
        unlockedAt: "2026-04-20T11:00:00.000Z",
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<WelcomeRewardPage />);

    expect(screen.getByText("Reward unlocked")).toBeInTheDocument();
    expect(screen.getByText("$12.00 of $10.00")).toBeInTheDocument();
    expect(screen.getByText(/^Unlocked on$/i)).toBeInTheDocument();
  });
});
