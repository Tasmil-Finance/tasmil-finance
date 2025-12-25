"use client";

import { useEffect, useState, useRef } from "react";

import { Navbar } from "./navbar";
import { HeroSection } from "./hero-section";
import { VideoSection } from "./video-section";
import { FooterSection } from "./footer-section";
import { AbstractSection } from "./abstract-section";
import { FAQSection } from "./faq-section";
import { BenefitSection } from "./benefit-section";
import { SECTION_IDS } from "@/constants/routes";

type SectionId =
  | "hero"
  | "video"
  | "benefits"
  | "abstract"
  | "faq"
  | "footer";

export default function LandingPage() {
  const [visibleSections, setVisibleSections] = useState<{
    [key: string]: boolean;
  }>({
    hero: false,
    video: false,
    benefits: false,
    abstract: false,
    faq: false,
    footer: false,
  });

  // Refs for sections
  const sectionRefs = {
    hero: useRef<HTMLDivElement>(null),
    video: useRef<HTMLDivElement>(null),
    benefits: useRef<HTMLDivElement>(null),
    abstract: useRef<HTMLDivElement>(null),
    faq: useRef<HTMLDivElement>(null),
    footer: useRef<HTMLDivElement>(null),
  };

  // Add intersection observer to handle section animations on scroll
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15, // Trigger when 15% of the section is visible
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute("data-section-id");
        if (sectionId && entry.isIntersecting) {
          setVisibleSections((prev) => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    // Observe all sections
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.setAttribute("data-section-id", key);
        observer.observe(ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  // Function to scroll to section with better handling
  // const scrollToSection = (sectionId: SectionId) => {
  //   const section = sectionRefs[sectionId]?.current;
  //   if (section) {
  //     // Calculate offset based on announcement bar visibility
  //     const announcementHeight = 48; // Height of announcement bar
  //     const navbarHeight = 72; // Height of navbar
  //     const totalOffset =
  //       navbarHeight + (window.scrollY === 0 ? announcementHeight : 0);

  //     setTimeout(() => {
  //       const elementPosition = section.getBoundingClientRect().top;
  //       const offsetPosition =
  //         elementPosition + window.pageYOffset - totalOffset;

  //       window.scrollTo({
  //         top: offsetPosition,
  //         behavior: "smooth",
  //       });
  //     }, 50);
  //   }
  // };

  // Reset active tab initially (clear any previously active tab)
  useEffect(() => {
    // Clear any active tab when page loads
    document.dispatchEvent(new CustomEvent("sectionChange", { detail: "" }));
  }, []);

  // Add scroll spy effect with improved timing and detection
  useEffect(() => {
    const handleScroll = () => {
      // If we're at the top, clear active tab
      if (window.scrollY < 200) {
        document.dispatchEvent(
          new CustomEvent("sectionChange", { detail: "" }),
        );
        return;
      }

      // Get viewport height
      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY + viewportHeight * 0.4; // 40% down the viewport

      // Check each section's position
      let currentSectionId: SectionId | null = null;
      let highestVisibleSection = -Infinity;

      // Find the most visible section
      Object.entries(sectionRefs).forEach(([key, ref]) => {
        if (ref.current) {
          const element = ref.current;
          const { offsetTop, offsetHeight } = element;

          // Calculate how much of the section is visible
          const sectionTop = offsetTop;
          const sectionBottom = offsetTop + offsetHeight;

          // If scrollPosition is within this section and it's higher up than any previous section
          if (
            scrollPosition >= sectionTop &&
            scrollPosition < sectionBottom &&
            sectionTop > highestVisibleSection
          ) {
            currentSectionId = key as SectionId;
            highestVisibleSection = sectionTop;
          }
        }
      });

      // Update current section and dispatch event for navbar
      if (currentSectionId) {
        // Map section names to tab names
        if (currentSectionId === SECTION_IDS.BENEFITS) {
          document.dispatchEvent(
            new CustomEvent("sectionChange", { detail: "DEFI AGENT" }),
          );
        } else if (currentSectionId === SECTION_IDS.VIDEO) {
          document.dispatchEvent(
            new CustomEvent("sectionChange", { detail: "DEMO" }),
          );
        } else {
          // Clear active tab if not in a relevant section
          document.dispatchEvent(
            new CustomEvent("sectionChange", { detail: "" }),
          );
        }
      } else {
        // Clear active tab if no section is currently visible
        document.dispatchEvent(
          new CustomEvent("sectionChange", { detail: "" }),
        );
      }
    };

    // Use requestAnimationFrame for smoother detection
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", scrollListener, { passive: true });

    // Initial check after a delay to make sure DOM is fully rendered
    const initialCheckTimeout = setTimeout(handleScroll, 500);

    return () => {
      window.removeEventListener("scroll", scrollListener);
      clearTimeout(initialCheckTimeout);
    };
  }, []);

  // Define animation classes for sections
  const getSectionAnimationClass = (sectionId: string) => {
    return visibleSections[sectionId]
      ? "opacity-100 translate-y-0 transition-all duration-1000"
      : "opacity-0 translate-y-16 transition-all duration-1000";
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-foreground relative overflow-hidden">
      {/* Content */}
      <div className="relative flex flex-col min-h-screen">
        <Navbar />

        <div
          ref={sectionRefs.hero}
          className={getSectionAnimationClass("hero")}
        >
          <HeroSection />
        </div>

        <div
          ref={sectionRefs.video}
          className={getSectionAnimationClass("video")}
        >
          <VideoSection />
        </div>

        <div
          ref={sectionRefs.benefits}
          className={getSectionAnimationClass("benefits")}
        >
          <BenefitSection />
        </div>

        <div
          ref={sectionRefs.abstract}
          className={getSectionAnimationClass("abstract")}
        >
          <AbstractSection />
        </div>


        <div ref={sectionRefs.faq} className={getSectionAnimationClass("faq")}>
          <FAQSection />
        </div>

        <div ref={sectionRefs.footer} className={getSectionAnimationClass("footer")}>
          <FooterSection />
        </div>
      </div>
    </div>
  )
}
