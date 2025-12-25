"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BsTwitterX } from "react-icons/bs";
import { FaTelegram } from "react-icons/fa";
import { FiArrowUpRight, FiMenu, FiX } from "react-icons/fi";
import { Button } from "@/components/ui/button-v2";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { PATHS, SECTION_IDS } from "@/constants/routes";
import { cn } from "@/lib/utils";

// Add these styles at the top of the file
const styles = {
  indicatorTransition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
  navbarTransition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
};

type IndicatorStyle = {
  left: string;
  width: string;
  transition: string;
  opacity: number;
};

// Separate Announcement Bar component
// const AnnouncementBar = () => {
//   // Cache images
//   const saliteImage = "/images/landing-v3/navbar/salite.png";
//   const fireIcon = "/images/landing-v3/navbar/fire-icon.gif";

//   return (
//     <div
//       className="w-full relative backdrop-blur-md flex justify-center items-center h-12 gap-6 overflow-hidden"
//       style={{
//         background: "rgba(0, 0, 0, 0.3)",
//       }}
//     >
//       <div className="absolute top-[-20px] right-[-50px] w-[600px] h-auto opacity-30 z-0">
//         <Image
//           src={saliteImage}
//           alt="salite"
//           width={600}
//           height={400}
//           loading="lazy"
//           className="object-cover w-full h-auto"
//         />
//       </div>
//       <div className="flex items-center gap-2 z-10">
//         <div className="h-5 w-5 relative">
//           <Image
//             src={fireIcon}
//             alt="Emoji"
//             width={20}
//             height={20}
//             className="object-contain"
//           />
//         </div>
//         <Typography
//           font="geistMono"
//           size="base-geist"
//           color="submerged"
//           className="text-xs md:text-base"
//         >
//           Tasmil Finance is LIVE now!
//         </Typography>
//       </div>

//       <Link href={PATHS.DEFI_AGENT} className="group z-10">
//         <Button
//           variant="gradient"
//           size="sm"
//           className="font-mono text-black text-xs md:text-sm font-semibold uppercase transition-all duration-300 hover:tracking-wider"
//         >
//           EXPLORE NOW
//           <FiArrowUpRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
//         </Button>
//       </Link>
//     </div>
//   );
// };

type SectionId =
  | "hero"
  | "about"
  | "number"
  | "coreTechnology"
  | "benefit"
  | "abstract"
  | "faq"
  | "support";

// Update MainNavbar props interface
type MainNavbarProps = {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  isAnnouncementVisible: boolean;
  onSectionClick?: (sectionId: SectionId) => void;
  isScrolled: boolean;
};

// Main Navbar component
const MainNavbar = ({
  isMobileMenuOpen,
  toggleMobileMenu,
  isScrolled,
}: // onSectionClick,
MainNavbarProps) => {
  const router = useRouter();
  type TabName = "DEMO" | "DEFI AGENT" | "DOCS";
  const [activeTab, setActiveTab] = useState<TabName>("DEMO");
  const [indicatorStyle, setIndicatorStyle] = useState<IndicatorStyle>({
    left: "0px",
    width: "40px",
    transition: styles.indicatorTransition,
    opacity: 0,
  });

  // Listen for section changes with debounce
  useEffect(() => {
    const handleSectionChange = (event: CustomEvent<TabName>) => {
      requestAnimationFrame(() => {
        setActiveTab(event.detail);
      });
    };

    document.addEventListener(
      "sectionChange",
      handleSectionChange as EventListener
    );
    return () => {
      document.removeEventListener(
        "sectionChange",
        handleSectionChange as EventListener
      );
    };
  }, []);

  // Update indicator position with RAF and better transition
  const updateIndicatorPosition = () => {
    requestAnimationFrame(() => {
      const activeTabRef = getActiveTabRef();
      const containerRef = navContainerRef;

      if (activeTabRef?.current && containerRef?.current && activeTab) {
        const tabRect = activeTabRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const centerPosition =
          tabRect.left - containerRect.left + tabRect.width / 2;
        const indicatorWidth = Math.min(tabRect.width * 0.25, 24); // 25% of tab width or max 24px

        setIndicatorStyle({
          left: `${centerPosition}px`,
          width: `${indicatorWidth}px`,
          transition: styles.indicatorTransition,
          opacity: 1,
        });
      } else {
        // No active tab or refs not available
        setIndicatorStyle((prev) => ({
          ...prev,
          opacity: 0,
          transition: styles.indicatorTransition,
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
  }, [activeTab, updateIndicatorPosition]);

  // Handle scroll to section with immediate tab update
  const handleTabClick = (tab: TabName) => {
    setActiveTab(tab);

    // Handle routing or scrolling based on selected tab
    switch (tab) {
      case "DEMO": {
        // Scroll to video section
        const videoSection = document.querySelector(
          `[data-section-id="${SECTION_IDS.VIDEO}"]`
        ) as HTMLElement;
        if (videoSection) {
          const navbarHeight = 72;
          const elementPosition = videoSection.getBoundingClientRect().top;
          const offsetPosition =
            elementPosition + window.pageYOffset - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
        break;
      }
      case "DEFI AGENT":
        router.push(PATHS.DEFI_AGENT);
        break;
      case "DOCS":
        window.open(PATHS.DOCS, "_blank");
        break;
      default:
        break;
    }
  };

  // Refs for each tab element
  const frameworkRef = useRef<HTMLDivElement>(null);
  const useCaseRef = useRef<HTMLDivElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Get the active tab ref based on current selection
  const getActiveTabRef = () => {
    switch (activeTab) {
      case "DEMO":
        return frameworkRef;
      case "DEFI AGENT":
        return useCaseRef;
      case "DOCS":
        return rewardRef;
      default:
        return null;
    }
  };

  // Navigation menu items data
  const menuItems = [
    { label: "DEMO", icon: <FiArrowUpRight className="h-5 w-5" /> },
    { label: "DEFI AGENT", icon: <FiArrowUpRight className="h-5 w-5" /> },
    {
      label: "DOCS",
      icon: <FiArrowUpRight className="h-5 w-5" />,
    },
  ];

  return (
    <div
      className={
        "fixed top-0 left-0 flex h-[72px] w-full items-center justify-between px-8 transition-all duration-300 md:px-16"
      }
      style={{ transition: styles.navbarTransition }}
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
              style={{ transition: styles.indicatorTransition }}
            />

            {/* Indicator bar */}
            <div
              className="absolute bottom-0 h-[2px] w-full rounded-full bg-white"
              style={{ transition: styles.indicatorTransition }}
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
                <span className="uppercase transition-colors duration-300">
                  DEMO
                </span>
              </Typography>
            </Link>
          </div>
          <div className="relative" ref={useCaseRef}>
            <Link
              className="group flex items-center px-4 py-3 transition-all duration-300 hover:bg-white/10"
              href={`${PATHS.DEFI_AGENT}`}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick("DEFI AGENT");
              }}
            >
              <Typography
                className={cn(
                  activeTab === "DEFI AGENT"
                    ? "text-embossed"
                    : "text-submerged group-hover:text-embossed/80",
                  "text-white"
                )}
                size="sm"
              >
                <span className="uppercase transition-colors duration-300">
                  DEFI AGENT
                </span>
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
                <span className="uppercase transition-colors duration-300">
                  DOCS
                </span>
              </Typography>
            </Link>
          </div>
        </div>
      </div>

      {/* Logo - Left aligned on mobile, center on desktop */}
      <Link
        className={
          "md:-translate-x-1/2 md:-translate-y-1/2 flex flex-row items-center gap-2 md:absolute md:top-1/2 md:left-1/2 md:transform"
        }
        href="/"
      >
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

      {/* Mobile Menu Toggle - Right aligned on mobile */}
      <div className="md:hidden">
        <button
          className="rounded-md p-2 transition-colors duration-300 hover:bg-white/5"
          onClick={toggleMobileMenu}
          type="button"
        >
          <FiMenu className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* CTA Button (Desktop) - Right side */}
      <div className="hidden md:block">
        <Link
          aria-label="Launch Tasmil Finance"
          className="cursor-pointer"
          href={PATHS.DEFI_AGENT}
          rel="noopener noreferrer"
          tabIndex={0}
          target="_blank"
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
                isScrolled
                  ? "bg-black/90 backdrop-blur-lg"
                  : "bg-black/80 backdrop-blur-[32px]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full"
                  onClick={toggleMobileMenu}
                  type="button"
                >
                  <FiX className="h-6 w-6 text-white" />
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
                {menuItems.map((item, index) => (
                  <button
                    className="flex w-full items-center justify-between border-white/10 border-b px-4 py-8 text-left transition-all duration-300 hover:bg-white/5"
                    key={index}
                    onClick={() => {
                      toggleMobileMenu();
                    }}
                    type="button"
                  >
                    <div className="inline-flex items-center gap-2">
                      <div
                        className={`font-mono font-normal text-sm ${
                          activeTab === item.label
                            ? "text-primary"
                            : "text-white"
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
                      <Link
                        aria-label="Twitter"
                        className="group"
                        href={PATHS.X}
                      >
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                          <BsTwitterX className="h-4 w-4 text-white group-hover:scale-110" />
                          <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40" />
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Twitter</span>
                    </TooltipContent>
                  </Tooltip>

                  {/* <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={PATHS.TELEGRAM}
                        aria-label="Telegram"
                        className="group"
                      >
                        <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/5 hover:bg-white/20">
                          <FaTelegram className="w-4 h-4 text-white group-hover:scale-110" />
                          <div className="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40"></div>
                        </div>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <span>Telegram</span>
                    </TooltipContent>
                  </Tooltip> */}
                </TooltipProvider>
              </div>

              {/* Tasmil Finance logo */}
              <Link
                className={
                  "md:-translate-x-1/2 md:-translate-y-1/2 flex flex-row items-center gap-2 md:absolute md:top-1/2 md:left-1/2 md:transform"
                }
                href="/"
              >
                <div className="relative flex h-8 w-8 items-center justify-center md:h-10 md:w-10">
                  <Image
                    alt="logo"
                    height={40}
                    src={"/images/logo.png"}
                    width={40}
                  />
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
interface NavbarProps {
  onSectionClick?: (sectionId: SectionId) => void;
}

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
          // Scrolling down
          setIsAnnouncementVisible(false);
        } else if (currentScrollY === 0) {
          // At the top of the page
          setIsAnnouncementVisible(true);
        } else if (currentScrollY < lastScrollY.current) {
          // Scrolling up but not at top
          setIsAnnouncementVisible(true);
        }

        lastScrollY.current = currentScrollY;
      }, 50); // Small delay for smoother transitions
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
      {/* Announcement Bar */}
      {/* <div
        className={`transform transition-transform duration-300 ease-in-out ${
          isAnnouncementVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <AnnouncementBar />
      </div> */}

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
