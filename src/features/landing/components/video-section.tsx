"use client";

import { Typography } from "@/shared/ui/typography";

export const VideoSection = () => {
  return (
    <div
      className="relative flex min-h-screen w-full items-center justify-center px-4 py-20 md:px-8"
      data-section-id="video"
    >
      {/* Background overlay - Made transparent for 3D visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />

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
              Watch how our AI-powered DeFi platform transforms your Stellar blockchain trading
              experience with intelligent automation and real-time insights.
            </Typography>
          </div>
        </div>

        {/* Video Demo */}
        <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-white/10 shadow-2xl">
          <div className="aspect-video">
            <iframe
              src="https://www.youtube.com/embed/VoLY1gjz5mg"
              className="size-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              title="Tasmil Finance Demo Video"
            />
          </div>
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
              Stellar Ecosystem Integration
            </Typography>
            <Typography className="text-base text-gray-400 leading-relaxed md:text-lg" variant="p">
              Connect with Blend, Soroswap, Aquarius, Phoenix, and the native SDEX. Manage your
              entire Stellar DeFi portfolio from a single, intuitive interface.
            </Typography>
          </div>

          <div className="text-center">
            <Typography className="mb-4 font-semibold text-2xl text-white md:text-3xl" variant="h3">
              Real-Time Stellar Analytics
            </Typography>
            <Typography className="text-base text-gray-400 leading-relaxed md:text-lg" variant="p">
              Get instant insights into XLM market conditions, Soroban contract analytics, and yield
              opportunities across Blend, Aquarius, and Soroswap pools.
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
};
