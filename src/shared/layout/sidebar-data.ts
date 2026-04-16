import { ArrowLeftRight, Bot, Home, Tractor, Wallet, KeyRound, Mail } from "lucide-react";

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
          icon: Wallet,
        },
      ],
    },
    {
      items: [
        {
          title: "Farming",
          url: "/farming",
          icon: Tractor,
        },
      ],
    },
    {
      items: [
        {
          title: "Bridge",
          url: "/bridge",
          icon: ArrowLeftRight,
        },
      ],
    }
  ],
};

export const adminSidebarData: SidebarData = {
  user: {
    name: "Admin",
    email: "admin@tasmil.finance",
    avatar: "/avatars/default.svg",
  },
  header: {
    logo_url: "/images/logo.png",
    brand_name: "Tasmil",
    tagline: "Admin Panel",
  },
  navGroups: [
    {
      title: "Overview",
      items: [
        { title: "Dashboard", url: "/admin/dashboard", icon: Home },
      ],
    },
    {
      title: "Waitlist",
      items: [
        { title: "Access Codes", url: "/admin/codes", icon: KeyRound },
        { title: "Campaigns", url: "/admin/campaigns", icon: Mail },
      ],
    },
  ],
};
