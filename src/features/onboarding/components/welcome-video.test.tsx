import { fireEvent, render, screen } from "@testing-library/react";
import { WelcomeVideo } from "./welcome-video";

describe("WelcomeVideo", () => {
  it("shows the play overlay before user interaction", () => {
    render(<WelcomeVideo src="/onboarding/intro.mp4" poster="/onboarding/intro-poster.png" />);
    expect(screen.getByRole("button", { name: /play intro video/i })).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-video-element")).not.toBeInTheDocument();
  });

  it("mounts the <video> element after the play button is clicked", () => {
    render(<WelcomeVideo src="/onboarding/intro.mp4" poster="/onboarding/intro-poster.png" />);
    fireEvent.click(screen.getByRole("button", { name: /play intro video/i }));
    expect(screen.getByTestId("welcome-video-element")).toBeInTheDocument();
  });

  it("falls back to the 'coming soon' overlay when the video errors", () => {
    render(<WelcomeVideo src="/onboarding/intro.mp4" poster="/onboarding/intro-poster.png" />);
    fireEvent.click(screen.getByRole("button", { name: /play intro video/i }));
    const video = screen.getByTestId("welcome-video-element");
    fireEvent.error(video);
    expect(screen.getByText(/video coming soon/i)).toBeInTheDocument();
    expect(screen.queryByTestId("welcome-video-element")).not.toBeInTheDocument();
  });
});
