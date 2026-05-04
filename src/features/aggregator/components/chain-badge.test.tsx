import { render, screen } from "@testing-library/react";
import { ChainBadge } from "./chain-badge";

describe("ChainBadge", () => {
  it("renders a single icon when chainIn === chainOut", () => {
    render(<ChainBadge chainIn="stellar" chainOut="stellar" />);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("alt", "Stellar");
  });

  it("renders two icons + arrow when chainIn !== chainOut", () => {
    render(<ChainBadge chainIn="stellar" chainOut="ethereum" />);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("alt", "Stellar");
    expect(imgs[1]).toHaveAttribute("alt", "Ethereum");
    // ArrowRight from lucide-react renders an <svg>; assert it exists
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("falls back to Globe icon for an unknown chain id", () => {
    render(<ChainBadge chainIn="linea" chainOut="linea" />);
    // No <img> for unknown — Globe SVG only
    expect(screen.queryByRole("img")).toBeNull();
    expect(document.querySelector("svg")).toBeInTheDocument();
  });

  it("renders one img + one Globe when one chain is unknown", () => {
    render(<ChainBadge chainIn="stellar" chainOut="linea" />);
    expect(screen.getAllByRole("img")).toHaveLength(1);
    // Multiple SVGs allowed (Globe + ArrowRight)
    expect(document.querySelectorAll("svg").length).toBeGreaterThanOrEqual(2);
  });
});
