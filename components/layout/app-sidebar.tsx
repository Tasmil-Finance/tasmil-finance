"use client";

import { sidebarData } from "@/components/layout/data/sidebar-data";
import { HeaderSidebar } from "@/components/layout/header-sidebar";
import { NavGroup } from "@/components/layout/nav-group";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { FooterSidebarSection } from "./footer-sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" side="left" variant="floating" {...props}>
      <SidebarHeader>
        <HeaderSidebar header={sidebarData.header} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((navGroup) => (
          <NavGroup key={navGroup.title} {...navGroup} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <FooterSidebarSection />
      </SidebarFooter>
    </Sidebar>
  );
}
