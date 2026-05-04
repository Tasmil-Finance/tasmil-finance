import { render, screen } from "@testing-library/react";
import { Bot, Tractor } from "lucide-react";
import { TopNavBar } from "./top-nav-bar";

const pathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

jest.mock("@/features/credits/credits-pill", () => ({
  CreditsPill: () => <div data-testid="credits-pill" />,
}));

jest.mock("@/shared/components/connect-wallet-button", () => ({
  ConnectWalletButton: () => <div data-testid="connect-wallet-button" />,
}));

jest.mock("@/shared/ui/multi-sidebar", () => ({
  MultiSidebarTrigger: ({ children, side }: { side: string; children?: React.ReactNode }) => (
    <button data-testid="multi-sidebar-trigger" data-side={side}>
      {children}
    </button>
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
    pathnameMock.mockReturnValue("/chat");
  });

  it("renders the brand name", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    expect(screen.getByText("Tasmil")).toBeInTheDocument();
  });

  it("renders nav links from sidebarData", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    const links = screen.getAllByTestId("nav-link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/chat");
    expect(links[1]).toHaveAttribute("href", "/farming");
  });

  it("renders right cluster: CreditsPill + ConnectWalletButton", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    expect(screen.getByTestId("credits-pill")).toBeInTheDocument();
    expect(screen.getByTestId("connect-wallet-button")).toBeInTheDocument();
  });

  it("renders chat-history trigger when showRightSidebar=true", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={true} />);
    const trigger = screen.getByTestId("multi-sidebar-trigger");
    expect(trigger).toHaveAttribute("data-side", "right");
  });

  it("hides chat-history trigger when showRightSidebar=false", () => {
    render(<TopNavBar sidebarData={fakeData} showRightSidebar={false} />);
    expect(screen.queryByTestId("multi-sidebar-trigger")).toBeNull();
  });
});
