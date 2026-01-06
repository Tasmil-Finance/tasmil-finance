import { Home, Bot, TrendingUp } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: any;
  badge?: string;
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export interface SidebarData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  header: {
    logo_url: string;
    brand_name: string;
    tagline: string;
  };
  navGroups: NavGroup[];
}

export const sidebarData: SidebarData = {
  user: {
    name: "User",
    email: "user@tasmil.finance",
    avatar: "/avatars/default.svg",
  },
  header: {
    logo_url: "/images/logo.png",
    brand_name: "Tasmil",
    tagline: "Your supreme agent",
  },
  navGroups: [
    {
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
      ],
    },
    {
      items: [
        {
          title: "Agents",
          url: "/agents",
          icon: Bot,
        },
      ],
    },
    {
      items: [
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: TrendingUp,
        },
      ],
    },
  ],
};
