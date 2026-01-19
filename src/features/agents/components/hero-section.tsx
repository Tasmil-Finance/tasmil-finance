"use client";

import { Bot, Brain, TrendingUp, Zap } from "lucide-react";
import Image from "next/image";

const avatarIcons = [Bot, Brain, Zap, TrendingUp];

interface HeroSectionProps {
  agentCount: number;
}

export function HeroSection({ agentCount }: HeroSectionProps) {
  return (
    <section className="py-6">
      <div className="relative h-[360px] w-full overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a0a] shadow-2xl">
        {/* Background Image - Professional Isometric */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/agents-hero-professional.png"
            alt="Agents Hero Background"
            fill
            className="object-cover opacity-80"
            priority
          />
          {/* Overlay gradient to ensure text readability on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        </div>



        {/* Content */}
        <div className="relative z-20 flex h-full flex-col justify-center px-8 md:px-16">
          <h1 className="mb-4 font-bold text-4xl text-white md:text-5xl lg:text-6xl tracking-tight">
            Explore AI Tasmil Agents
          </h1>

          <p className="mb-8 max-w-xl text-zinc-300 text-lg leading-relaxed">
            Discover AI Tasmil Agents — specialized, collaborative AI Agents
            that power Intelligence and Strategies
          </p>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {avatarIcons.map((Icon, index) => (
                <div key={index} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-md">
                  <Icon size={16} className="text-zinc-400" />
                </div>
              ))}
            </div>
            <span className="font-medium text-zinc-400 text-sm">
              {agentCount}+ Agents
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
