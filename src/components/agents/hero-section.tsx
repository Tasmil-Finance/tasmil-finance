"use client";

import Image from "next/image";
import { Bot, Brain, Zap, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import LightPillar from "@/components/ui/light-pillar";
import { TokenIcon } from "@web3icons/react/dynamic";

const avatarIcons = [Bot, Brain, Zap, TrendingUp];

// Token symbols to display around the pillar - positioned naturally around
const tokens = [
  { symbol: "btc", position: { top: "10%", right: "15%" }, size: 40 },
  { symbol: "eth", position: { top: "15%", right: "35%" }, size: 38 },
  { symbol: "sol", position: { top: "35%", right: "8%" }, size: 36 },
  { symbol: "u2u", position: { top: "45%", right: "25%" }, size: 42, isCustom: true },
  { symbol: "bnb", position: { bottom: "20%", right: "12%" }, size: 38 },
  { symbol: "avax", position: { bottom: "5%", right: "25%" }, size: 36 },
  { symbol: "usdt", position: { top: "70%", right: "40%" }, size: 36 },
];

interface HeroSectionProps {
  agentCount: number;
}

export function HeroSection({ agentCount }: HeroSectionProps) {
  return (
    <section className="py-8">
      <div className="relative h-[400px] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-cyan-950/50 via-blue-950/30 to-slate-950 shadow-lg">
        {/* Background LightPillar - Full width and height */}
        <div className="pointer-events-none absolute inset-0 h-full w-full">
          <LightPillar
            topColor="#74d0f5"
            bottomColor="#B5EAFF"
            intensity={1.1}
            rotationSpeed={0.7}
            glowAmount={0.005}
            pillarWidth={3.0}
            pillarHeight={0.7}
            noiseIntensity={0.5}
            pillarRotation={50}
            interactive={true}
            mixBlendMode="normal"
          />
        </div>

        {/* Floating token icons - scattered around with background */}
        {tokens.map((token, index) => (
          <div
            key={token.symbol}
            className="pointer-events-none absolute z-[5] animate-float"
            style={{
              ...token.position,
              animationDelay: `${index * 0.4}s`,
              animationDuration: `${3.5 + (index % 3) * 0.5}s`,
            }}
          >
            <div className="rounded-full border bg-black/40 p-2.5 shadow-xl backdrop-blur-md">
              {token.isCustom ? (
                <Image
                  src="/token/u2u.png"
                  alt="U2U"
                  width={token.size}
                  height={token.size}
                  className="rounded-full drop-shadow-lg"
                />
              ) : (
                <TokenIcon
                  symbol={token.symbol}
                  variant="branded"
                  size={token.size}
                  className="drop-shadow-lg"
                />
              )}
            </div>
          </div>
        ))}

        {/* Text content - On top with padding */}
        <div className="relative z-10 flex h-full max-w-3xl flex-col justify-center p-8 md:p-12">
          <h1 className="mb-6 font-bold text-4xl text-foreground md:text-5xl lg:text-6xl">
            Explore AI Tasmil Agents
          </h1>

          <p className="mb-8 max-w-[70%] text-foreground/90 text-lg leading-relaxed md:text-xl">
            Discover AI Tasmil Agents — specialized, collaborative AI Agents that power Intelligence
            and Strategies
          </p>

          <div className="flex items-center gap-4">
            <div className="-space-x-2 flex">
              {avatarIcons.map((Icon, index) => (
                <Avatar key={index} className="h-10 w-10 bg-white/10 backdrop-blur-sm">
                  <AvatarFallback className="bg-transparent">
                    <Icon size={16} className="text-foreground" />
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="font-medium text-base text-foreground/90 md:text-lg">
              {agentCount}+ Agents
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
