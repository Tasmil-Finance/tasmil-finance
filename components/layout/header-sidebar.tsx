"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button-v2";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Typography } from "@/components/ui/typography";

export function HeaderSidebar({
  header,
}: {
  header: {
    logo_url: string;
    brand_name: string;
    tagline: string;
  };
}) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <div className="relative">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <Image
                alt={header.brand_name}
                height={45}
                src={header.logo_url}
                width={45}
              />
              <div className="ml-1 grid flex-1 gap-1 text-left leading-tight">
                <div className="flex items-center gap-2">
                  <Typography className="font-semibold text-xl" gradient>
                    {header.brand_name}
                  </Typography>
                  <Badge
                    className="h-4 rounded-full border-0 bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] px-1.5 py-0 font-bold text-[8px] text-black"
                    variant="outline"
                  >
                    TESTNET
                  </Badge>
                </div>
                <Typography className="text-sm">{header.tagline}</Typography>
              </div>
            </SidebarMenuButton>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Toggle Button */}
      <Button
        className="-right-3 -translate-y-1/2 absolute top-1/2 z-50 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-md hover:bg-accent"
        onClick={toggleSidebar}
        variant="ghost"
      >
        {open ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
