"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FiGlobe, FiMessageCircle, FiTool } from "react-icons/fi";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export const BenefitSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState([false, false, false]);
  const sectionRef = useRef(null);

  // Cache background images
  const crossBgImage = "/images/landing-v3/benefit/cross-bg.png";

  const bg1 = "/images/landing-v3/benefit/bg-1.png";
  const bg2 = "/images/landing-v3/benefit/bg-2.png";
  const bg3 = "/images/landing-v3/benefit/bg-3.png";

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsLoaded(true);
          // Staggered card loading animation
          const timer1 = setTimeout(() => {
            setCardsLoaded((prev) => [true, prev[1], prev[2]]);
          }, 400);

          const timer2 = setTimeout(() => {
            setCardsLoaded((prev) => [prev[0], true, prev[2]]);
          }, 800);

          const timer3 = setTimeout(() => {
            setCardsLoaded((prev) => [prev[0], prev[1], true]);
          }, 1200);

          return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
          };
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.3, // Trigger when 30% of the section is visible
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Data for the three feature cards
  const features = [
    {
      icon: FiMessageCircle,
      label: "AI Agent System",
      title: "Conversational DeFi Intelligence",
      description:
        "Transform complex DeFi operations on U2U into simple conversations. Execute sophisticated strategies across U2U's leading DeFi protocols with natural language commands while maintaining full non-custodial control of your assets.",
      background: bg1,
    },
    {
      icon: FiTool,
      label: "Creator Economy",
      title: "Build, Deploy, Earn on U2U",
      description:
        "Create custom trading agents for U2U DeFi without coding. Design strategies, test in simulation environment, then publish to our marketplace for passive revenue through performance-based fees from the U2U community.",
      background: bg2,
    },
    {
      icon: FiGlobe,
      label: "U2U Ecosystem Integration",
      title: "Native U2U DeFi Gateway",
      description:
        "Seamless integration with U2U blockchain's entire DeFi ecosystem. Real-time portfolio tracking, cross-protocol yield optimization on U2U, and intelligent routing through our self-custody wallet architecture.",
      background: bg3,
    },
  ];

  return (
    <section
      className="relative flex min-h-screen w-full items-center justify-center"
      id="usecase-section"
      ref={sectionRef}
    >
      {/* Background with cross lights */}
      <div className="absolute top-10 right-0 bottom-10 left-0 z-0 h-full w-full">
        <Image
          alt="Benefit background"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          className={`object-cover transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          fill
          placeholder="blur"
          priority
          sizes="100vw"
          src={crossBgImage}
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        {/* Section header */}
        <div
          className={`mb-10 flex flex-col items-center text-center transition-all duration-1000 md:mb-16 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <Typography
            as="span"
            className={`mb-3 text-sm uppercase opacity-80 transition-all duration-700 md:text-base ${
              isLoaded ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
            }`}
            gradient={true}
          >
            / BENEFITS
          </Typography>
          <Typography
            as="h2"
            className={`font-semibold text-3xl uppercase transition-all delay-200 duration-700 md:text-5xl ${
              isLoaded ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"
            }`}
            gradient={true}
            weight="semibold"
          >
            FEATURES
          </Typography>
        </div>

        {/* Feature cards container */}
        <div
          className={`mx-auto max-w-[1100px] transition-all duration-1000 ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
        >
          {/* Desktop and mobile layout */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-[#ffffff1a] md:flex-row">
            {features.map((feature, index) => (
              <div
                className={`group relative flex-1 transition-all duration-700 ${
                  index > 0 ? "border-[#ffffff1a] border-t md:border-t-0 md:border-l" : ""
                } ${cardsLoaded[index] ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}
                key={feature.label}
                style={{
                  transitionDelay: `${index * 200}ms`,
                }}
              >
                <div className="relative flex h-[400px] flex-col bg-[#00000080]/60 p-6 backdrop-blur-[100px] transition-all duration-500 group-hover:bg-[#00000080]/80 md:h-[400px] md:p-8">
                  {/* Icon and label */}
                  <div className="relative z-20 mb-6 flex items-center gap-3">
                    <div
                      className={`relative overflow-hidden rounded-md transition-all duration-500 ${
                        cardsLoaded[index] ? "scale-100 opacity-100" : "scale-50 opacity-0"
                      } group-hover:scale-110`}
                      style={{ transitionDelay: `${600 + index * 100}ms` }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 bg-white/10 backdrop-blur-sm">
                        <feature.icon className="h-6 w-6 text-white transition-transform duration-500" />
                      </div>
                    </div>
                    <div style={{ transitionDelay: `${700 + index * 100}ms` }}>
                      <Typography
                        className={`text-sm text-white transition-all duration-500 ${
                          cardsLoaded[index]
                            ? "translate-x-0 opacity-100"
                            : "-translate-x-4 opacity-0"
                        }`}
                      >
                        {feature.label}
                      </Typography>
                    </div>
                  </div>

                  {/* Background image - 275px height, positioned based on index */}
                  <div
                    className={`absolute inset-0 h-full w-full overflow-hidden transition-all duration-1000 ${
                      cardsLoaded[index] ? "opacity-80" : "opacity-0"
                    } group-hover:opacity-100`}
                    style={{ transitionDelay: `${500 + index * 100}ms` }}
                  >
                    <div
                      className={`relative flex h-full w-full ${
                        index === 1
                          ? "items-end justify-center" // Middle card: bottom position, more padding
                          : "items-start justify-center pt-14" // First and last cards: top position
                      }`}
                    >
                      <div className="relative h-[200px] w-full">
                        <Image
                          alt="Card background"
                          className={`object-contain object-center transition-all duration-500 ${
                            index === 1
                              ? "group-hover:translate-y-[-15px]" // Middle card: move up on hover
                              : "group-hover:translate-y-[-10px]" // First and last: move down on hover
                          } group-hover:scale-105`}
                          fill
                          src={feature.background}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card content - positioned at the bottom */}
                  <div
                    className={cn(
                      "relative z-20 mt-auto transition-all duration-500",
                      index === 1 && "mt-0",
                      cardsLoaded[index] ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    )}
                    style={{ transitionDelay: `${800 + index * 100}ms` }}
                  >
                    <Typography
                      as="h3"
                      className="mb-3 font-semibold text-white text-xl transition-all duration-500 md:text-2xl"
                      weight="semibold"
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      as="p"
                      className="text-[#b1bab4bf] text-base leading-5 transition-all duration-500"
                    >
                      {feature.description}
                    </Typography>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
