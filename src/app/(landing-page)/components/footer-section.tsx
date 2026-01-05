"use client";

import { ArrowUp, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { PATHS } from "@/constants/routes";

const FOOTER_IMAGES = {
  background: "/images/landing-v3/footer-bg.png",
} as const;

export function FooterSection() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubscribe = () => {
    if (!email) {
      alert("Please enter your email address");
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert("Please enter a valid email address");
      return;
    }

    alert("Thank you for subscribing to our newsletter!");
    setEmail("");
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative flex h-[90vh] w-full flex-col overflow-hidden text-white md:h-[100vh]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          alt="Footer background"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
          className="object-cover object-center"
          fill
          placeholder="blur"
          priority
          quality={80}
          sizes="100vw"
          src={FOOTER_IMAGES.background}
        />
      </div>

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Content Container */}
      <div className="z-10 flex flex-1 flex-col justify-between px-4 pt-14 pb-4 md:px-10 md:pt-24 md:pb-6">
        {/* Main Content */}
        <div className="max-w-4xl">
          <Typography
            as="h2"
            className="mb-6 max-w-2xl text-4xl leading-tight"
            gradient
            variant="h2"
            weight="bold"
          >
            REVOLUTIONIZE YOUR U2U DEFI EXPERIENCE WITH TASMIL FINANCE
          </Typography>

          <Typography
            as="div"
            className="mt-4 mb-6 max-w-2xl text-lg text-white opacity-90 md:mt-6 md:mb-10 md:w-[60%] md:text-xl"
          >
            Experience the future of decentralized finance on U2U blockchain with our AI-powered
            platform. Trade, manage liquidity, and optimize your U2U portfolio with intelligent
            automation and conversational AI agents.
          </Typography>

          <button
            className="group relative flex transform items-center overflow-hidden rounded-lg bg-gradient-to-b from-[#B5EAFF] to-[#00BFFF] p-1 transition-all duration-300 hover:scale-105 hover:from-[#C5F0FF] hover:to-[#1CCFFF]"
            onClick={() => router.push(PATHS.AGENTS)}
            style={{
              boxShadow: "0 0 15px rgba(181, 234, 255, 0.5)",
            }}
          >
            {/* Glow effect */}
            <div className="-translate-x-1/2 absolute top-0 left-1/2 h-4 w-[50%] rounded-full bg-white/80 blur-xl" />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black transition-colors duration-300 group-hover:bg-[#0a0a0a] sm:h-10 sm:w-10">
              <Image
                alt="Tasmil Finance Logo"
                className="transition-transform duration-300 group-hover:scale-110 sm:h-8 sm:w-8"
                height={24}
                loading="eager"
                quality={90}
                src="/images/logo.png"
                width={24}
              />
            </div>
            <Typography className="px-2 text-black text-sm uppercase tracking-wide transition-all duration-300 group-hover:tracking-wider sm:px-3 sm:text-base">
              LAUNCH TASMIL FINANCE
            </Typography>
          </button>
        </div>

        {/* Stay in the Loop Section */}
        <div className="w-full rounded-lg bg-black/10 p-4 shadow-lg drop-shadow-lg backdrop-blur-lg sm:w-[80%] sm:p-6 md:w-[60%] lg:w-[40%]">
          <Typography className="mb-4 text-base text-white md:mb-6 md:text-xl" weight="semibold">
            STAY IN THE LOOP
          </Typography>

          {/* Subscription input */}
          <div className="w-full">
            <div className="flex w-full flex-row items-stretch gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:items-center sm:gap-0">
              <div className="w-full pl-6">
                <input
                  className="h-14 w-full border-none bg-transparent font-geistMono text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-0"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  type="email"
                  value={email}
                />
              </div>
              <div className="w-auto">
                <button
                  className="mt-2 mr-2 h-10 w-auto transform rounded-md bg-white px-4 font-medium text-black transition-all duration-300 hover:scale-[1.02] hover:bg-gray-100 hover:shadow-md sm:px-5 md:mt-0"
                  onClick={handleSubscribe}
                >
                  <Typography className="whitespace-nowrap font-mono text-black text-sm transition-all duration-300 hover:tracking-wider">
                    SUBSCRIBE NOW
                  </Typography>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <div className="absolute right-4 bottom-[25%] z-20 hidden sm:right-10 sm:bottom-[20%] sm:block">
        <button
          aria-label="Back to top"
          className="group relative flex cursor-pointer flex-col items-center"
          onClick={scrollToTop}
        >
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/10 bg-white/10 backdrop-blur-lg transition-all duration-300 group-hover:bg-white/20 sm:h-[64px] sm:w-[64px]">
            <ArrowUp
              className="group-hover:-translate-y-0.5 text-white transition-all duration-300 group-hover:scale-110"
              size={20}
            />
            <div className="absolute inset-0 rounded-full border border-white/20 transition-colors duration-300 group-hover:border-white/40" />
          </div>
          <Typography className="mt-2 text-center text-sm text-white/80 transition-colors duration-300 group-hover:text-white">
            Back to top
          </Typography>
        </button>
      </div>

      {/* Footer Bottom */}
      <div className="relative z-10 w-full">
        {/* Mobile Footer */}
        <div className="block w-full p-3 sm:hidden">
          <div className="flex flex-col gap-6 rounded-lg bg-black/50 px-4 py-4 backdrop-blur-sm">
            <div className="flex flex-row items-center justify-between gap-6">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <Image
                  alt="Tasmil Finance logo"
                  height={32}
                  loading="lazy"
                  quality={90}
                  src="/images/logo.png"
                  width={32}
                />
                <Typography
                  as="span"
                  className="text-base text-white"
                  gradient={true}
                  weight="bold"
                >
                  Tasmil Finance
                </Typography>
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link aria-label="Twitter" className="group" href={PATHS.X}>
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                          <X className="text-lg text-white" />
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
            </div>

            {/* Copyright */}
            <Typography className="text-center text-gray-400 text-xs" variant="small">
              © 2025 TASMIL FINANCE. ALL RIGHTS RESERVED.
            </Typography>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden w-full items-center justify-between border-gray-800 border-t bg-black/50 px-8 py-4 backdrop-blur-sm sm:flex">
          <div className="flex items-center gap-2">
            <Image
              alt="Tasmil Finance logo"
              className="h-8 w-8"
              height={28}
              src="/images/logo.png"
              width={28}
            />
            <Typography as="span" className="text-lg" gradient={true} size="lg" weight="bold">
              Tasmil Finance
            </Typography>
          </div>

          <Typography className="text-gray-400" size="base">
            © 2025 TASMIL FINANCE. ALL RIGHTS RESERVED.
          </Typography>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link aria-label="Twitter" className="group" href={PATHS.X}>
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/10 backdrop-blur-sm hover:bg-white/20">
                      <X className="text-lg text-white transition-transform group-hover:scale-110" />
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
        </div>
      </div>
    </section>
  );
}
