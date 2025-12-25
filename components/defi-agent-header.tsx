"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { DefiAgentControls } from "./defi-agent-controls";
import { DefiAgentSidebarToggle } from "./defi-agent-sidebar-toggle";
import { Typography } from "./ui/typography";
import { ArrowLeft } from "lucide-react";

type DefiAgentHeaderProps = {
  className?: string;
};

export function DefiAgentHeader({ className }: DefiAgentHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-16 w-full items-center gap-3 bg-background p-4 sm:gap-4",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      <Button
        className="h-8 w-8 p-0"
        onClick={handleBack}
        type="button"
        variant="outline"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-3">
        <Typography className="font-bold text-3xl text-foreground">
          New Chat
        </Typography>
      </div>
      <div className="ml-auto flex items-center space-x-4">
        <DefiAgentControls
          showNewChatButton={true}
          showVisibilitySelector={false}
        />
        <DefiAgentSidebarToggle />
      </div>
    </header>
  );
}
