"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/common/use-mobile";
import { Button } from "./button-v2";

const MULTI_SIDEBAR_COOKIE_NAME = "multi_sidebar_state";
const MULTI_SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type MultiSidebarContextProps = {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  isMobile: boolean;
};

const MultiSidebarContext = React.createContext<MultiSidebarContextProps | null>(null);

export function useMultiSidebar() {
  const context = React.useContext(MultiSidebarContext);
  if (!context) {
    throw new Error("useMultiSidebar must be used within a MultiSidebarProvider.");
  }
  return context;
}

interface MultiSidebarProviderProps {
  children: React.ReactNode;
  defaultLeftOpen?: boolean;
  defaultRightOpen?: boolean;
  className?: string;
}

export function MultiSidebarProvider({
  children,
  defaultLeftOpen = true,
  defaultRightOpen = false,
  className,
}: MultiSidebarProviderProps) {
  const isMobile = useIsMobile();

  // Initialize sidebar states based on device type
  const [leftSidebarOpen, setLeftSidebarOpen] = React.useState(() =>
    isMobile ? false : defaultLeftOpen
  );
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(() =>
    isMobile ? false : defaultRightOpen
  );

  // Handle device type changes
  React.useEffect(() => {
    if (isMobile) {
      // Close sidebars on mobile
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    } else {
      // Restore default state on desktop
      setLeftSidebarOpen(defaultLeftOpen);
      setRightSidebarOpen(defaultRightOpen);
    }
  }, [isMobile, defaultLeftOpen, defaultRightOpen]);

  const toggleLeftSidebar = React.useCallback(() => {
    setLeftSidebarOpen((prev) => {
      const newState = !prev;
      // Save state to cookie only on desktop
      if (!isMobile) {
        document.cookie = `${MULTI_SIDEBAR_COOKIE_NAME}_left=${newState}; path=/; max-age=${MULTI_SIDEBAR_COOKIE_MAX_AGE}`;
      }
      return newState;
    });
  }, [isMobile]);

  const toggleRightSidebar = React.useCallback(() => {
    setRightSidebarOpen((prev) => {
      const newState = !prev;
      // Save state to cookie only on desktop
      if (!isMobile) {
        document.cookie = `${MULTI_SIDEBAR_COOKIE_NAME}_right=${newState}; path=/; max-age=${MULTI_SIDEBAR_COOKIE_MAX_AGE}`;
      }
      return newState;
    });
  }, [isMobile]);

  const contextValue = React.useMemo<MultiSidebarContextProps>(
    () => ({
      leftSidebarOpen,
      rightSidebarOpen,
      setLeftSidebarOpen,
      setRightSidebarOpen,
      toggleLeftSidebar,
      toggleRightSidebar,
      isMobile,
    }),
    [leftSidebarOpen, rightSidebarOpen, toggleLeftSidebar, toggleRightSidebar, isMobile]
  );

  return (
    <MultiSidebarContext.Provider value={contextValue}>
      <div
        className={cn(className)}
        style={
          {
            "--left-sidebar-width": "16rem",
            "--right-sidebar-width": "20rem",
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </MultiSidebarContext.Provider>
  );
}

interface MultiSidebarTriggerProps {
  side: "left" | "right";
  children?: React.ReactNode;
  className?: string;
}

export function MultiSidebarTrigger({ side, children, className }: MultiSidebarTriggerProps) {
  const { toggleLeftSidebar, toggleRightSidebar } = useMultiSidebar();

  const handleClick = side === "left" ? toggleLeftSidebar : toggleRightSidebar;

  return (
    <Button variant="outline" onClick={handleClick} aria-label={`Toggle ${side} sidebar`}>
      {children}
    </Button>
  );
}
