import { render, screen } from "@testing-library/react";
import { Bot, Tractor } from "lucide-react";
import { TopNavBar } from "./top-nav-bar";

const pathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

jest.mock("@/shared/components/connect-wallet-button", () => ({
  ConnectWalletButton: ({ variant }: { variant?: string }) => (
    <div data-testid="connect-wallet-button" data-variant={variant ?? "default"} />
  ),
}));

jest.mock("@/shared/layout/nav-link", () => ({
  NavLink: ({ item }: { item: { title: string; url: string } }) => (
    <a data-testid="nav-link" href={item.url}>
      {item.title}
    </a>
  ),
}));

const fakeData = {
  user: { name: "u", email: "e", avatar: "/a.svg" },
  header: { logo_url: "/logo.png", brand_name: "Tasmil", tagline: "" },
  navGroups: [
    {
      items: [
        { title: "Chat", url: "/chat", icon: Bot },
        { title: "Farming", url: "/farming", icon: Tractor },
      ],
    },
  ],
};

describe("TopNavBar", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/farming");
  });

  it("renders the brand name with shimmer animation classes", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    const brand = screen.getByText("Tasmil");
    expect(brand).toBeInTheDocument();
    expect(brand.className).toMatch(/animate-shimmer-text/);
    expect(brand.className).toMatch(/bg-clip-text/);
  });

  it("renders nav links from sidebarData", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    const links = screen.getAllByTestId("nav-link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/chat");
    expect(links[1]).toHaveAttribute("href", "/farming");
  });

  it("renders ConnectWalletButton with variant='topbar'", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    expect(screen.getByTestId("connect-wallet-button")).toHaveAttribute("data-variant", "topbar");
  });

  it("does NOT render CreditsPill in the top bar", () => {
    render(<TopNavBar sidebarData={fakeData} />);
    expect(screen.queryByTestId("credits-pill")).toBeNull();
  });

  it("does NOT render the Clock chat-history trigger on any route", () => {
    pathnameMock.mockReturnValue("/chat/new");
    const { container } = render(<TopNavBar sidebarData={fakeData} showRightSidebar={true} />);
    expect(container.querySelector("svg.lucide-clock")).toBeNull();
  });
});
