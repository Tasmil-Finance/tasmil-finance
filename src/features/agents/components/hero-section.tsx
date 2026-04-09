'use client';

import Image from 'next/image';
import { AGENTS } from '@/features/chat/config/agents.config';

interface HeroSectionProps {
  agentCount: number;
}

export function HeroSection({ agentCount }: HeroSectionProps) {
  const allAgents = Object.values(AGENTS).map((agent) => ({
    name: agent.name,
    icon: agent.icon || '/agents/supervisor-agent.png',
  }));
  const visibleAgents = allAgents.slice(0, 4);

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
          <h1 className="mb-4 font-bold text-4xl tracking-tight text-foreground md:text-5xl">
            Explore AI Tasmil Agents
          </h1>

          <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Discover AI Tasmil Agents — specialized, collaborative AI Agents
            that power Intelligence and Strategies
          </p>

          <div className="flex items-center gap-4">
            <div className="group/agents relative flex -space-x-2">
              {visibleAgents.map((agent) => (
                <div
                  key={agent.name}
                  className="relative z-10 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-background ring-2 ring-card transition-transform duration-300 hover:z-20 hover:scale-110"
                  title={agent.name}
                >
                  <Image
                    src={agent.icon}
                    alt={agent.name}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}

              <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-max max-w-[260px] flex-wrap gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-lg group-hover/agents:flex">
                {allAgents.map((agent) => (
                  <div
                    key={`${agent.name}-tooltip`}
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <div className="relative h-5 w-5 overflow-hidden rounded-full">
                      <Image
                        src={agent.icon}
                        alt={agent.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>{agent.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="ml-2 text-sm font-medium text-muted-foreground">
              {agentCount}+ Agents
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
