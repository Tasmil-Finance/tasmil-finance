import { ArrowLeftRight, Bot, Home, KeyRound, Mail, Tractor, Wallet } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: any;
  badge?: string;
  testnetOnly?: boolean;
  /**
   * Mirror the proxy.ts dev-only gate: hide the entry when
   * NEXT_PUBLIC_APP_ENV !== "development" so the link doesn't 307 to /agents.
   */
  devOnly?: boolean;
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

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet";
const isDev = process.env.NEXT_PUBLIC_APP_ENV === "development";

function filterNavGroups(groups: NavGroup[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.testnetOnly && !isTestnet) return false;
        if (item.devOnly && !isDev) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

const _sidebarData: SidebarData = {
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
    // {
    //   items: [
    //     {
    //       title: "Dashboard",
    //       url: "/dashboard",
    //       icon: Home,
    //     },
    //   ],
    // },
    {
      items: [
        {
          title: "Chat",
          url: "/chat/new",
          icon: Bot,
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
          title: "Aggregator",
          url: "/aggregator",
          icon: ArrowLeftRight,
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
  ],
};

export const sidebarData: SidebarData = {
  ..._sidebarData,
  navGroups: filterNavGroups(_sidebarData.navGroups),
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
      items: [{ title: "Dashboard", url: "/admin/dashboard", icon: Home }],
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
