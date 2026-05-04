import { render, screen } from "@testing-library/react";
import { Bot } from "lucide-react";
import { NavLink } from "./nav-link";

const pathnameMock = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

const baseItem = {
  title: "Chat",
  url: "/chat",
  icon: Bot,
};

describe("NavLink", () => {
  it("renders title and icon", () => {
    pathnameMock.mockReturnValue("/something-else");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link", { name: /chat/i })).toBeInTheDocument();
  });

  it("is active when pathname equals item.url", () => {
    pathnameMock.mockReturnValue("/chat");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "true");
  });

  it("is active when pathname starts with item.url + '/'", () => {
    pathnameMock.mockReturnValue("/chat/abc-123");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "true");
  });

  it("is NOT active when pathname is a sibling prefix", () => {
    pathnameMock.mockReturnValue("/chats");
    render(<NavLink item={baseItem} />);
    expect(screen.getByRole("link")).toHaveAttribute("data-active", "false");
  });
});
