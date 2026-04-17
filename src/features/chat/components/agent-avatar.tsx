"use client";

import Image from "next/image";
import { useState } from "react";
import { Bot } from "lucide-react";
import { getAgentConfig } from "@/features/chat/config/agents.config";
import { useChatState } from "@/features/chat/hooks";

interface AgentAvatarProps {
  size?: "sm" | "md" | "lg";
  showBorder?: boolean;
}

export function AgentAvatar({ size = "md", showBorder = false }: AgentAvatarProps) {
  const { agentId } = useChatState();
  const [error, setError] = useState(false);

  // Get the agent config to find the icon
  const agentConfig = agentId ? getAgentConfig(agentId) : null;
  const logoSrc = agentConfig?.icon || "/images/logo.png";

  // Size configurations
  const sizeConfig = {
    sm: { container: "h-8 w-8", image: 32 },
    md: { container: "h-10 w-10", image: 40 },
    lg: { container: "h-20 w-20 md:h-24 md:w-24", image: 96 },
  };

  const config = sizeConfig[size];
  const borderClass = showBorder ? "border border-border/60 bg-muted/30" : "";

  return (
    <div
      className={`flex ${config.container} shrink-0 items-center justify-center overflow-hidden rounded-full ${borderClass}`}
    >
      {error ? (
        <Bot className="h-1/2 w-1/2 text-muted-foreground" />
      ) : (
        <Image
          src={logoSrc}
          alt="AI Assistant"
          width={config.image}
          height={config.image}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
