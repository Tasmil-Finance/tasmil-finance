"use client";

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
  { symbol: "matic", position: { top: "45%", right: "25%" }, size: 34 },
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
      <div className="relative h-[400px] rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-950/50 via-blue-950/30 to-slate-950 border border-border shadow-lg">
        {/* Background LightPillar - Full width and height */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
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
            className="absolute animate-float pointer-events-none z-[5]"
            style={{
              ...token.position,
              animationDelay: `${index * 0.4}s`,
              animationDuration: `${3.5 + (index % 3) * 0.5}s`,
            }}
          >
            <div className="p-2.5 bg-black/40 backdrop-blur-md border rounded-full shadow-xl">
              <TokenIcon 
                symbol={token.symbol} 
                variant="branded" 
                size={token.size}
                className="drop-shadow-lg"
              />
            </div>
          </div>
        ))}

        {/* Text content - On top with padding */}
        <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
            Explore AI Agent Swarm
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/90 mb-8 leading-relaxed max-w-[70%]">
            Discover AI Agent Swarm — specialized, collaborative AI Agents
            that power Intelligence and Strategies
          </p>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {avatarIcons.map((Icon, index) => (
                <Avatar key={index} className="h-10 w-10 bg-white/10 backdrop-blur-sm">
                  <AvatarFallback className="bg-transparent">
                    <Icon size={16} className="text-foreground" />
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-base md:text-lg text-foreground/90 font-medium">{agentCount}+ Agents</span>
          </div>
        </div>
      </div>
    </section>
  );
}

