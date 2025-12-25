"use client";

import Image from "next/image";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "../../lib/utils";
import { Typography } from "../ui/typography";

// TopNavProps now supports optional description for richer context in header
interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  header: {
    title: string;
    icon?: string;
    description?: string; // Optional description field
  };
}

// TopNav displays title, icon, and (if present) description under the title
export function TopNav({ className, header, ...props }: TopNavProps) {
  const { title, icon, description } = header;
  const isMobile = useIsMobile();
  return (
    <nav
      className={cn(
        "flex flex-row items-center space-x-1 md:flex lg:space-x-3",
        className
      )}
      {...props}
    >
      {/* Show icon on desktop for visual context */}
      {!isMobile && icon && (
        <Image alt="logo" height={45} src={icon || ""} width={45} />
      )}
      <div className="flex flex-col gap-2">
        {/* Main title */}
        <Typography className="font-semibold text-2xl">{title}</Typography>
        {/* Optional description for extra context */}
        {description && (
          <Typography className="mt-1 text-ellipsis text-muted-foreground text-xs md:text-sm">
            {description}
          </Typography>
        )}
      </div>
    </nav>
  );
}
