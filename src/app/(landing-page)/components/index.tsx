"use client";

import { useEffect, useRef, useState } from "react";
import { SECTION_IDS } from "@/constants/routes";
import { AbstractSection } from "./abstract-section";
import { BenefitSection } from "./benefit-section";
import { FAQSection } from "./faq-section";
import { FooterSection } from "./footer-section";
import { HeroSection } from "./hero-section";
import { Navbar } from "./navbar";
import { VideoSection } from "./video-section";

type SectionId = "hero" | "video" | "benefits" | "abstract" | "faq" | "footer";

export default function LandingPage() {
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    hero: false,
    video: false,
    benefits: false,
    abstract: false,
    faq: false,
    footer: false,
  });

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
      threshold: 0.15,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute("data-section-id");
        if (sectionId && entry.isIntersecting) {
          setVisibleSections((prev) => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.setAttribute("data-section-id", key);
        observer.observe(ref.current);
      }
    });

    return () => observer.disconnect();
  }, [sectionRefs]);

  // Reset active tab initially
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("sectionChange", { detail: "" }));
  }, []);

  // Add scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < 200) {
        document.dispatchEvent(new CustomEvent("sectionChange", { detail: "" }));
        return;
      }

      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY + viewportHeight * 0.4;

      let currentSectionId: SectionId | null = null;
      let highestVisibleSection = -Infinity;

      Object.entries(sectionRefs).forEach(([key, ref]) => {
        if (ref.current) {
          const element = ref.current;
          const { offsetTop, offsetHeight } = element;
          const sectionTop = offsetTop;
          const sectionBottom = offsetTop + offsetHeight;

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

      if (currentSectionId) {
        if (currentSectionId === SECTION_IDS.BENEFITS) {
          document.dispatchEvent(new CustomEvent("sectionChange", { detail: "DEFI AGENT" }));
        } else if (currentSectionId === SECTION_IDS.VIDEO) {
          document.dispatchEvent(new CustomEvent("sectionChange", { detail: "DEMO" }));
        } else {
          document.dispatchEvent(new CustomEvent("sectionChange", { detail: "" }));
        }
      } else {
        document.dispatchEvent(new CustomEvent("sectionChange", { detail: "" }));
      }
    };

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
    const initialCheckTimeout = setTimeout(handleScroll, 500);

    return () => {
      window.removeEventListener("scroll", scrollListener);
      clearTimeout(initialCheckTimeout);
    };
  }, [sectionRefs]);

  // Define animation classes for sections
  const getSectionAnimationClass = (sectionId: string) => {
    return visibleSections[sectionId]
      ? "opacity-100 translate-y-0 transition-all duration-1000"
      : "opacity-0 translate-y-16 transition-all duration-1000";
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black text-foreground">
      {/* Content */}
      <div className="relative flex min-h-screen flex-col">
        <Navbar />

        <div ref={sectionRefs.hero} className={getSectionAnimationClass("hero")}>
          <HeroSection />
        </div>

        <div ref={sectionRefs.video} className={getSectionAnimationClass("video")}>
          <VideoSection />
        </div>

        <div ref={sectionRefs.benefits} className={getSectionAnimationClass("benefits")}>
          <BenefitSection />
        </div>

        <div ref={sectionRefs.abstract} className={getSectionAnimationClass("abstract")}>
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
  );
}
