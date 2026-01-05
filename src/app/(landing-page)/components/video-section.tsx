"use client";

import { HeroVideoDialog } from "@/components/ui/hero-video-dialog";
import { Typography } from "@/components/ui/typography";

export const VideoSection = () => {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center px-4 py-20 md:px-8"
      data-section-id="video"
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/60" />

      {/* Content container */}
      <div className="relative z-10 flex w-full max-w-6xl flex-col items-center gap-16">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-6 text-center">
          <Typography
            className="text-center font-bold text-4xl uppercase md:text-5xl"
            gradient={true}
            variant="h1"
          >
            See Tasmil Finance in Action
          </Typography>

          <div className="max-w-2xl">
            <Typography
              className="text-center text-gray-300 text-xl leading-relaxed md:text-2xl"
              variant="p"
            >
              Watch how our AI-powered DeFi platform transforms your U2U blockchain trading
              experience with intelligent automation and real-time insights.
            </Typography>
          </div>
        </div>

        {/* Video Demo */}
        <div className="relative w-full max-w-4xl">
          <HeroVideoDialog
            animationStyle="from-center"
            className="block dark:hidden"
            thumbnailAlt="Tasmil Finance Demo Video"
            thumbnailSrc="/images/landing-v3/video-thumbnail.png"
            videoSrc="https://www.youtube.com/embed/VoLY1gjz5mg"
          />
          <HeroVideoDialog
            animationStyle="from-center"
            className="hidden dark:block"
            thumbnailAlt="Tasmil Finance Demo Video"
            thumbnailSrc="/images/landing-v3/video-thumbnail.png"
            videoSrc="https://www.youtube.com/embed/VoLY1gjz5mg"
          />
        </div>

        {/* Additional Features */}
        <div className="mt-8 grid w-full grid-cols-1 gap-8 md:grid-cols-3">
          <div className="text-center">
            <Typography className="mb-4 font-semibold text-2xl text-white md:text-3xl" variant="h3">
              AI-Powered Trading
            </Typography>
            <Typography className="text-base text-gray-400 leading-relaxed md:text-lg" variant="p">
              Experience intelligent trading decisions with our advanced AI algorithms that analyze
              market trends in real-time.
            </Typography>
          </div>

          <div className="text-center">
            <Typography className="mb-4 font-semibold text-2xl text-white md:text-3xl" variant="h3">
              U2U Ecosystem Integration
            </Typography>
            <Typography className="text-base text-gray-400 leading-relaxed md:text-lg" variant="p">
              Connect with U2U's major DeFi protocols and manage your portfolio from a single,
              intuitive interface built for U2U blockchain.
            </Typography>
          </div>

          <div className="text-center">
            <Typography className="mb-4 font-semibold text-2xl text-white md:text-3xl" variant="h3">
              Real-Time U2U Analytics
            </Typography>
            <Typography className="text-base text-gray-400 leading-relaxed md:text-lg" variant="p">
              Get instant insights into U2U market conditions, portfolio performance, and trading
              opportunities across the U2U ecosystem.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
};
