"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button-v2";
import { useSidebar } from "@/shared/ui/sidebar";
import { Typography } from "@/shared/ui/typography";

const NETWORK_LABEL = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] === "mainnet" ? "MAINNET" : "TESTNET";

export function HeaderSidebar({
  header,
}: {
  header: {
    logo_url: string;
    brand_name: string;
    tagline: string;
  };
}) {
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div className="relative">
      <Link
        href="/agents"
        data-onborda="sidebar-header"
        className={`flex h-12 w-full items-center gap-2 p-3 ${isCollapsed ? "justify-center" : ""}`}
      >
        <Image
          alt={header.brand_name}
          height={45}
          src={header.logo_url}
          width={45}
          className="flex-shrink-0"
        />
        {!isCollapsed && (
          <div className="ml-1 grid flex-1 gap-1 text-left leading-tight">
            <div className="flex items-center gap-2">
              <span className="animate-shimmer-text bg-gradient-to-r from-[#b5eaff] via-white to-[#00bfff] bg-clip-text text-transparent bg-[length:200%_100%] font-semibold text-xl">
                {header.brand_name}
              </span>
              <Badge
                className="h-4 rounded-full border-0 bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] px-1.5 py-0 font-bold text-[8px] text-black"
                variant="outline"
              >
                {NETWORK_LABEL}
              </Badge>
            </div>
            <Typography className="text-sm">{header.tagline}</Typography>
          </div>
        )}
      </Link>

      {/* Toggle Button */}
      <Button
        className="-right-3 -translate-y-1/2 absolute top-1/2 z-50 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-md hover:bg-accent"
        onClick={toggleSidebar}
        variant="ghost"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
}
