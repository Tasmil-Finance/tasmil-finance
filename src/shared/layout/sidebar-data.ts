import { ArrowLeftRight, Bot, Droplets, Home, Tractor, Wallet, KeyRound, Mail } from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon?: any;
  badge?: string;
  testnetOnly?: boolean;
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

const isTestnet = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] !== "mainnet";

function filterNavGroups(groups: NavGroup[]): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.testnetOnly || isTestnet),
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
          title: "Faucet",
          url: "/faucet",
          icon: Droplets,
          testnetOnly: true,
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
