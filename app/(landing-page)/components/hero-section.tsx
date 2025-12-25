"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FiArrowDown } from "react-icons/fi";
import { Button } from "@/components/ui/button-v2";
import { Typography } from "@/components/ui/typography";
import { PATHS, SECTION_IDS } from "@/constants/routes";
import { useIsMobile } from "@/hooks/use-mobile";

export const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const heroMainImage = "/images/landing-v3/hero/bg.png";
  const chestAbstractImage = "/images/landing-v3/hero/chest_abstract.png";

  useEffect(() => {
    // Play the background video when component mounts
    if (videoRef.current) {
      // Force video to play in case autoplay is blocked
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Playback started successfully
            console.log("Video playback started");
          })
          .catch((error) => {
            // Auto-play was prevented
            console.error("Background video autoplay failed:", error);
            // Try to play again on user interaction
            document.addEventListener(
              "click",
              () => {
                videoRef.current?.play();
              },
              { once: true }
            );
          });
      }
    }
  }, []);

  // Scroll to video section function
  const scrollToVideo = () => {
    const videoSection = document.querySelector(
      `[data-section-id="${SECTION_IDS.VIDEO}"]`
    );
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
  };

  return (
    <div className="relative flex h-[calc(100vh)] w-full items-center justify-center pt-8">
      {/* Background img */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image
          alt="Hero Background"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          className="object-cover"
          fill
          placeholder="blur"
          priority
          quality={80}
          sizes="100vh"
          src={heroMainImage}
        />

        {/* Black gradient overlay from bottom to 30% */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.3) 80%, transparent 100%)",
          }}
        />
      </div>

      {/* Content container */}
      <div className="relative z-10 mt-12 flex w-full flex-col items-center justify-center px-4">
        {/* Main content */}
        <div className="mt-8 flex flex-col items-center gap-10 md:gap-16">
          {isMobile ? (
            // Mobile layout - single column
            <div className="flex w-auto flex-col items-center gap-4 text-center">
              {/* Abstract image for mobile - moved to top */}
              <div className="w-[250px]">
                <Image
                  alt="Abstract Chest"
                  className="h-auto w-full animate-bounce object-contain"
                  height={250}
                  quality={90}
                  src={chestAbstractImage}
                  style={{
                    animation: "bounce 3s ease-in-out infinite",
                  }}
                  width={250}
                />
              </div>

              <Typography
                className="text-center font-semibold text-4xl uppercase md:text-4xl"
                gradient={true}
                variant="h1"
              >
                Your AI-Powered Gateway
              </Typography>
              <Typography
                className="mt-[-10px] text-center font-semibold text-4xl uppercase md:text-4xl"
                gradient={true}
                variant="h1"
              >
                to U2U DeFi
              </Typography>

              <div className="my-3 max-w-lg">
                <Typography
                  className="text-center text-gray-300 text-xl"
                  variant="p"
                >
                  Experience seamless DeFi on U2U blockchain with AI agents,
                  smart swaps, and real-time insights through conversational
                  interactions.
                </Typography>
              </div>

              {/* <Link
                aria-label="Launch Tasmil Finance"
                className="flex cursor-pointer items-center justify-center rounded-lg px-2 font-mono text-base text-black uppercase shadow-[0_0_15px_rgba(181,234,255,0.5)] transition-all duration-300 hover:tracking-wider hover:shadow-[0_0_25px_rgba(181,234,255,0.7)]"
                href={PATHS.DEFI_AGENT}
                rel="noopener noreferrer"
                tabIndex={0}
                target="_blank"
              >
                <span className="mr-2 flex items-center">
                  <Image
                    alt="Tasmil Finance Logo"
                    className="inline-block"
                    height={24}
                    priority
                    src="/images/logo.png"
                    width={24}
                  />
                </span>
                LAUNCH TASMIL FINANCE
              </Link> */}

              <Link
                aria-label="Launch Tasmil Finance"
                className="cursor-pointer"
                href={PATHS.DEFI_AGENT}
                rel="noopener noreferrer"
                tabIndex={0}
                target="_blank"
              >
                <Button
                  className="cursor-pointer rounded-lg px-2 font-mono text-base text-black uppercase shadow-[0_0_15px_rgba(181,234,255,0.5)] transition-all duration-300 hover:tracking-wider hover:shadow-[0_0_25px_rgba(181,234,255,0.7)]"
                  logo="/images/logo.png"
                  logoAlt="Tasmil Finance Logo"
                  logoSize={24}
                  size="lg"
                  variant="gradient"
                >
                  LAUNCH TASMIL FINANCE
                </Button>
              </Link>
            </div>
          ) : (
            // Desktop layout - two columns
            <div className="grid w-full max-w-7xl grid-cols-2 items-center gap-16">
              {/* Left Column - Content */}
              <div className="flex flex-col items-center gap-8">
                <div className="flex flex-col gap-2 text-center">
                  <Typography
                    className="text-center font-bold text-5xl uppercase xl:text-5xl"
                    gradient={true}
                    variant="h1"
                  >
                    Your AI-Powered Gateway
                  </Typography>
                  <Typography
                    className="text-center font-bold text-5xl uppercase xl:text-5xl"
                    gradient={true}
                    variant="h1"
                  >
                    to U2U DeFi
                  </Typography>
                </div>

                <div className="max-w-xl">
                  <Typography
                    className="text-center text-2xl text-gray-300 leading-relaxed"
                    variant="p"
                  >
                    Experience seamless DeFi on U2U blockchain with AI agents,
                    smart swaps, liquidity optimization, and real-time market
                    insights through conversational interactions.
                  </Typography>
                </div>

                <Link
                  aria-label="Launch Tasmil Finance"
                  className="cursor-pointer"
                  href={PATHS.DEFI_AGENT}
                  rel="noopener noreferrer"
                  tabIndex={0}
                  target="_blank"
                >
                  <Button
                    className="cursor-pointer rounded-lg px-2 font-mono text-base text-black uppercase shadow-[0_0_15px_rgba(181,234,255,0.5)] transition-all duration-300 hover:tracking-wider hover:shadow-[0_0_25px_rgba(181,234,255,0.7)]"
                    logo="/images/logo.png"
                    logoAlt="Tasmil Finance Logo"
                    logoSize={24}
                    size="lg"
                    variant="gradient"
                  >
                    LAUNCH TASMIL FINANCE
                  </Button>
                </Link>
              </div>

              {/* Right Column - Abstract Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-[400px]">
                  <Image
                    alt="Abstract Chest"
                    className="h-auto w-full object-contain"
                    height={400}
                    priority
                    quality={90}
                    src={chestAbstractImage}
                    style={{
                      animation: "float 3s ease-in-out infinite",
                    }}
                    width={400}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            aria-label="Scroll to video section"
            className="flex h-12 w-12 animate-floating-arrow cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-md transition-all duration-1000 hover:scale-110 hover:border-primary/50 hover:bg-white/20"
            onClick={scrollToVideo}
            type="button"
          >
            <FiArrowDown className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>

      {/* Custom CSS for floating animation */}
      <style global jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};
