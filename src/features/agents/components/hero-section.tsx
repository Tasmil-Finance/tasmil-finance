"use client";

import Image from "next/image";

interface HeroSectionProps {
  agentCount: number;
}

export function HeroSection({ agentCount }: HeroSectionProps) {
  return (
    <section className="py-6">
      <div className="relative h-[360px] w-full overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        {/* Background Image - Professional Isometric */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/agents-hero-v3.png"
            alt="Agents Hero Background"
            fill
            className="object-cover opacity-80"
            priority
          />
          {/* Overlay gradient to ensure text readability on the left */}
          <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/50 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-20 flex h-full flex-col justify-center px-8 md:px-16">
          <h1 className="mb-4 font-bold text-4xl text-foreground md:text-5xl lg:text-6xl tracking-tight">
            Explore AI Tasmil Agents
          </h1>

          <p className="mb-8 max-w-xl text-muted-foreground text-lg leading-relaxed">
            Discover AI Tasmil Agents — specialized, collaborative AI Agents that power Intelligence
            and Strategies
          </p>

          <div className="flex items-center gap-4">
            <div className="flex gap-3">
              {[
                "/agents/yield-agent-v6.png",
                "/agents/research-agent-v6.png",
                "/agents/bridge-agent-v6.png",
                "/agents/staking-agent-v6.png",
              ].map((src, index) => (
                <div
                  key={index}
                  className={`relative flex items-center justify-center z-10 hover:scale-110 transition-transform duration-300 ${index === 0 ? "h-6 w-6" : "h-8 w-8"}`}
                >
                  <Image
                    src={src}
                    alt="Agent"
                    width={index === 0 ? 24 : 32}
                    height={index === 0 ? 24 : 32}
                    className="object-contain drop-shadow-lg"
                  />
                </div>
              ))}
            </div>
            <span className="font-medium text-muted-foreground text-sm ml-2">
              {agentCount}+ Agents
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
