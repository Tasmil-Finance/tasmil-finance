import {
  IconLayoutDashboard,
  IconPackages,
  IconTool,
  IconUsers,
} from "@tabler/icons-react";
import { PATHS } from "@/constants/routes";
import type { SidebarData } from "../types";

export const sidebarData: SidebarData = {
  user: {
    name: "reoring",
    email: "reoring@gmail.com",
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
          icon: IconLayoutDashboard,
        },
      ],
    },
    {
      items: [
        {
          title: "Agents",
          url: PATHS.AGENTS,
          icon: IconTool,
        },
      ],
    },
    {
      items: [
        {
          title: "Community",
          url: "/community",
          icon: IconUsers,
        },
      ],
    },
    {
      items: [
        {
          title: "Portfolio",
          url: PATHS.PORTFOLIO,
          icon: IconPackages,
        },
      ],
    },
  ],
};
