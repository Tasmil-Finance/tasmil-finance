"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button-v2";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { PATHS, SECTION_IDS } from "@/constants/routes";
import { cn } from "@/lib/utils";

const TRANSITION_STYLES = {
  indicator: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  navbar: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

type IndicatorStyle = {
  left: string;
  width: string;
  transition: string;
  opacity: number;
};

type SectionId =
  | "hero"
  | "about"
  | "number"
  | "coreTechnology"
  | "benefit"
  | "abstract"
  | "faq"
  | "support";

type TabName = "DEMO" | "AGENTS" | "DOCS";

type MainNavbarProps = {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isAnnouncementVisible: boolean;
  onSectionClick?: (sectionId: SectionId) => void;
  isScrolled: boolean;
};

interface NavbarProps {
  onSectionClick?: (sectionId: SectionId) => void;
}

const MainNavbar = ({ isMobileMenuOpen, toggleMobileMenu, isScrolled }: MainNavbarProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabName>("DEMO");
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: "0px",
    width: "40px",
    transition: TRANSITION_STYLES.indicator,
    opacity: 0,
  });

  // Refs for tab elements
  const frameworkRef = useRef<HTMLDivElement>(null);
  const useCaseRef = useRef<HTMLDivElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Get the active tab ref based on current selection
  const getActiveTabRef = () => {
    switch (activeTab) {
      case "DEMO":
        return frameworkRef;
      case "AGENTS":
        return useCaseRef;
      case "DOCS":
        return rewardRef;
      default:
        return null;
    }
  };

  // Update indicator position with RAF and better transition
  const updateIndicatorPosition = () => {
    requestAnimationFrame(() => {
      const activeTabRef = getActiveTabRef();
      const containerRef = navContainerRef;

      if (activeTabRef?.current && containerRef?.current && activeTab) {
        const tabRect = activeTabRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const centerPosition = tabRect.left - containerRect.left + tabRect.width / 2;
        const indicatorWidth = Math.min(tabRect.width * 0.25, 24);

        setIndicatorStyle({
          left: `${centerPosition}px`,
          width: `${indicatorWidth}px`,
          transition: TRANSITION_STYLES.indicator,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({
          ...prev,
          opacity: 0,
          transition: TRANSITION_STYLES.indicator,
        }));
      }
    });
  };

  // Update position when active tab changes or on resize
  useEffect(() => {
    updateIndicatorPosition();

    const handleResize = () => {
      updateIndicatorPosition();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateIndicatorPosition]);

  // Handle scroll to section with immediate tab update
  const handleTabClick = (tab: TabName) => {
    setActiveTab(tab);

    switch (tab) {
      case "DEMO": {
        const videoSection = document.querySelector(
          `[data-section-id="${SECTION_IDS.VIDEO}"]`
        ) as HTMLElement;
        if (videoSection) {
          const navbarHeight = 72;
          const elementPosition = videoSection.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
        break;
      }
      case "AGENTS":
        router.push(PATHS.AGENTS);
        break;
      case "DOCS":
        router.push(PATHS.DOCS);
        break;
    }
  };

  // Navigation menu items data
  const menuItems = [
    { label: "DEMO" as const, icon: <ArrowUpRight className="h-5 w-5" /> },
    { label: "AGENTS" as const, icon: <ArrowUpRight className="h-5 w-5" /> },
    { label: "DOCS" as const, icon: <ArrowUpRight className="h-5 w-5" /> },
  ];

  return (
    <div
      className="fixed top-0 left-0 flex h-[72px] w-full items-center justify-between px-8 transition-all duration-300 md:px-16"
      style={{ transition: TRANSITION_STYLES.navbar }}
    >
      {/* Left Navigation Menu - Desktop Only */}
      <div className="hidden md:flex">
        <div
          className="relative flex overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-black/30 to-black/20 backdrop-blur-lg"
          ref={navContainerRef}
        >
          {/* Animated Indicator */}
          <div
            className="pointer-events-none absolute bottom-0 h-[2px]"
            style={{
              ...indicatorStyle,
              transform: "translateX(-50%)",
              willChange: "transform, width, opacity",
            }}
          >
            {/* Radial glow background */}
            <div
              className="-bottom-2.5 -translate-x-1/2 absolute left-1/2 h-6 w-6 rounded-full bg-white/40 blur-md"
              style={{ transition: TRANSITION_STYLES.indicator }}
            />

            {/* Indicator bar */}
            <div
              className="absolute bottom-0 h-[2px] w-full rounded-full bg-white"
              style={{ transition: TRANSITION_STYLES.indicator }}
            />
          </div>

          <div className="relative" ref={frameworkRef}>
            <Link
              className="group relative flex items-center px-4 py-3 transition-all duration-300 hover:bg-white/10"
              href={`${PATHS.DEMO}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick("DEMO");
              }}
            >
              <Typography
                className={cn(
                  activeTab === "DEMO"
                    ? "text-embossed"
                    : "text-submerged group-hover:text-embossed/80",
                  "text-white"
                )}
                size="sm"
              >
                <span className="uppercase transition-colors duration-300">DEMO</span>
              </Typography>
            </Link>
          </div>
          <div className="relative" ref={useCaseRef}>
            <Link
              className="group flex items-center px-4 py-3 transition-all duration-300 hover:bg-white/10"
              href={`${PATHS.AGENTS}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick("AGENTS");
              }}
            >
              <Typography
                className={cn(
                  activeTab === "AGENTS"
                    ? "text-embossed"
                    : "text-submerged group-hover:text-embossed/80",
                  "text-white"
                )}
                size="sm"
              >
                <span className="uppercase transition-colors duration-300">AGENTS</span>
              </Typography>
            </Link>
          </div>
          <div className="relative" ref={rewardRef}>
            <Link
              className="group flex items-center gap-2 px-4 py-3 transition-all duration-300 hover:bg-white/10"
              href={PATHS.DOCS}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick("DOCS");
              }}
            >
              <Typography
                className={cn(
                  activeTab === "DOCS"
                    ? "text-embossed"
                    : "text-submerged group-hover:text-embossed/80",
                  "text-white"
                )}
                size="sm"
              >
                <span className="uppercase transition-colors duration-300">DOCS</span>
              </Typography>
            </Link>
          </div>
        </div>
      </div>

      {/* Logo - Left aligned on mobile, center on desktop */}
      <Link
        className="md:-translate-x-1/2 md:-translate-y-1/2 flex flex-row items-center gap-2 md:absolute md:top-1/2 md:left-1/2"
        href="/"
      >
        <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
          <Image alt="logo" height={40} src={"/images/logo.png"} width={40} />
        </div>
        <Typography className="text-xl transition-all duration-300" gradient={true} weight="bold">
          Tasmil Finance
        </Typography>
      </Link>

      {/* Mobile Menu Toggle - Right aligned on mobile */}
      <div className="md:hidden">
        <button
          className="rounded-md p-2 transition-colors duration-300 hover:bg-white/5"
          onClick={toggleMobileMenu}
          type="button"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* CTA Button (Desktop) - Right side */}
      <div className="hidden md:block">
        <Link
          aria-label="Launch Tasmil Finance"
          className="cursor-pointer"
          href={PATHS.AGENTS}
          rel="noopener noreferrer"
          tabIndex={0}
        >
          <Button
            className="rounded-lg px-4 py-2 font-mono font-semibold text-black text-sm uppercase transition-all duration-300 hover:tracking-wider"
            size="default"
            variant="gradient"
          >
            LAUNCH APP
          </Button>
        </Link>
      </div>

      {/* Mobile Menu Modal with slide-down animation */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop overlay with blur effect */}
          <button
            aria-label="Close mobile menu"
            className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md"
            onClick={toggleMobileMenu}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            type="button"
          />

          {/* Modal content */}
          <div
            className="fixed inset-0 z-[1000] flex h-[100dvh] w-full animate-slide-down flex-col overflow-y-auto bg-[#080a06]/95"
            style={{
              animationDuration: "0.3s",
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {/* Top navigation bar */}
            <header
              className={`sticky top-0 z-[1001] flex h-20 w-full items-center justify-between bg-black/80 px-4 py-8 backdrop-blur-[32px] ${
                isScrolled ? "bg-black/90 backdrop-blur-lg" : "bg-black/80 backdrop-blur-[32px]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                  onClick={toggleMobileMenu}
                  type="button"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* {activeAccount?.address ? ( */}
              <Button
                className="font-mono font-semibold text-black text-sm uppercase tracking-tight transition-all duration-300 hover:tracking-wider"
                size="default"
                variant="gradient"
                // onClick={handleLaunchApp}
              >
                LAUNCH TERMINAL
              </Button>
            </header>

            {/* Navigation menu */}
            <nav className="inline-flex w-full flex-col items-start gap-8">
              <div className="inline-flex w-full flex-col items-start">
                {menuItems.map((item) => (
                  <button
                    className="flex w-full items-center justify-between border-white/10 border-b px-4 py-8 text-left transition-all duration-300 hover:bg-white/5"
                    key={item.label}
                    onClick={() => {
                      handleTabClick(item.label);
                      toggleMobileMenu();
                    }}
                    type="button"
                  >
                    <div className="inline-flex items-center gap-2">
                      <div
                        className={`font-mono font-normal text-sm ${
                          activeTab === item.label ? "text-primary" : "text-white"
                        }`}
                      >
                        {item.label}
                      </div>
                    </div>
                    {item.icon}
                  </button>
                ))}
              </div>
            </nav>

            {/* Bottom content with social icons and logo */}
            <div className="flex w-full flex-1 flex-col items-center justify-end gap-12 p-6">
              {/* Social media icons */}
              <div className="flex w-full flex-row items-center justify-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link aria-label="Twitter" className="group" href={PATHS.X}>
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                          <X className="h-4 w-4 text-white group-hover:scale-110" />
                          <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40" />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Twitter</span>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Tasmil Finance logo */}
              <Link className="flex flex-row items-center gap-2" href="/">
                <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
                  <Image alt="logo" height={40} src={"/images/logo.png"} width={40} />
                </div>
                <Typography
                  className="text-xl transition-all duration-300"
                  gradient={true}
                  weight="bold"
                >
                  Tasmil Finance
                </Typography>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Update Navbar component props
export const Navbar = ({ onSectionClick }: NavbarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      const currentScrollY = window.scrollY;

      // Debounce the announcement visibility change
      scrollTimeout.current = setTimeout(() => {
        setIsScrolled(currentScrollY > 50);

        if (currentScrollY > lastScrollY.current && currentScrollY > 0) {
          setIsAnnouncementVisible(false);
        } else if (currentScrollY === 0) {
          setIsAnnouncementVisible(true);
        } else if (currentScrollY < lastScrollY.current) {
          setIsAnnouncementVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }, 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 z-30 flex w-full flex-col">
      {/* Main Navbar */}
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isAnnouncementVisible ? "translate-y-0" : "-translate-y-20"
        }`}
      >
        <MainNavbar
          isAnnouncementVisible={isAnnouncementVisible}
          isMobileMenuOpen={isMobileMenuOpen}
          isScrolled={isScrolled}
          onSectionClick={onSectionClick}
          toggleMobileMenu={toggleMobileMenu}
        />
      </div>
    </div>
  );
};
