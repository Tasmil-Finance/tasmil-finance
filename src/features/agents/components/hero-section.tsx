"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import Image from "next/image";
import { useState } from "react";


function AgentIcon({
  src,
  name,
  fill,
  size,
}: {
  src: string;
  name: string;
  fill?: boolean;
  size?: number;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }
  if (fill) {
    return (
      <Image src={src} alt={name} fill className="object-cover" onError={() => setError(true)} />
    );
  }
  return (
    <Image
      src={src}
      alt={name}
      width={size ?? 36}
      height={size ?? 36}
      className="h-full w-full object-cover"
      onError={() => setError(true)}
    />
  );
}

interface HeroSectionProps {
  agentCount: number;
  agents: { name: string; icon: string }[];
}

export function HeroSection({ agentCount, agents }: HeroSectionProps) {
  const allAgents = agents;
  const visibleAgents = allAgents.slice(0, 4);

  return (
    <section data-onborda="agents-hero" className="py-6">
      <motion.div
        className="relative h-[360px] w-full overflow-hidden rounded-3xl border border-border bg-background shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
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
          <motion.h1
            className="mb-4 font-bold text-4xl text-foreground tracking-tight md:text-5xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Explore AI Tasmil Agents
          </motion.h1>

          <motion.p
            className="mb-8 max-w-xl text-lg text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            Discover AI Tasmil Agents — specialized, collaborative AI Agents that power Intelligence
            and Strategies
          </motion.p>

          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="group/agents -space-x-2 relative flex">
              {visibleAgents.map((agent, i) => (
                <motion.div
                  key={agent.name}
                  className="relative z-10 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-card transition-transform duration-300 hover:z-20 hover:scale-110"
                  title={agent.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.55 + i * 0.08,
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <AgentIcon src={agent.icon} name={agent.name} size={36} />
                </motion.div>
              ))}

              <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-max max-w-[260px] flex-wrap gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-lg group-hover/agents:flex">
                {allAgents.map((agent) => (
                  <div
                    key={`${agent.name}-tooltip`}
                    className="flex items-center gap-2 text-muted-foreground text-xs"
                  >
                    <div className="relative h-5 w-5 overflow-hidden rounded-full">
                      <AgentIcon src={agent.icon} name={agent.name} fill />
                    </div>
                    <span>{agent.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="ml-2 font-medium text-muted-foreground text-sm">
              {agentCount}+ Agents
            </span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
