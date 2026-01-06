"use client";

import { sidebarData } from "@/components/layout/sidebar-data";
import { HeaderSidebar } from "@/components/layout/header-sidebar";
import { NavGroup } from "@/components/layout/nav-group";
import { FooterSidebarSection } from "@/components/layout/footer-sidebar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" side="left" variant="floating" {...props}>
      <SidebarHeader>
        <HeaderSidebar header={sidebarData.header} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((navGroup, index) => (
          <NavGroup key={index} {...navGroup} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <FooterSidebarSection />
      </SidebarFooter>
    </Sidebar>
  );
}
