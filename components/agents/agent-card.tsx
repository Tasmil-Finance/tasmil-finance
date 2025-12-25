"use client";

import { LucideIcon, Settings, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// Agent type from API response
type Agent = {
  id: string;
  name: string;
  description: string[];
  type: 'Strategy' | 'Intelligence';
  icon: string;
  supportedChains: string[];
};

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  hasPromptToDeFi?: boolean;
}

// Map agent type to icon
const getTypeIcon = (type: string): LucideIcon => {
  return type === "Strategy" ? Settings : Sparkles;
};

export function AgentCard({ agent, onClick, hasPromptToDeFi = false }: AgentCardProps) {
  const TypeIcon = getTypeIcon(agent.type);
  
  // Extract first few chains for display
  const displayChains = agent.supportedChains.slice(0, 3);
  const extraChains = agent.supportedChains.length - displayChains.length;

  return (
    <Card 
      className="group relative transition-all duration-300 hover:border-muted-foreground/30 cursor-pointer"
      onClick={onClick}
    >
      {hasPromptToDeFi && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="gap-1">
            <Sparkles size={12} />
            Prompt-to-DeFi
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="p-3 w-fit rounded-lg bg-secondary mb-4">
          {agent.icon ? (
            <img
              src={agent.icon}
              alt={agent.name}
              className="w-6 h-6 rounded object-cover"
            />
          ) : (
            <TypeIcon size={24} className="text-foreground" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
      </CardHeader>

      <CardContent className="space-y-6">
        <ul className="space-y-2">
          {agent.description.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-muted-foreground mt-0.5">•</span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <TypeIcon size={12} />
            {agent.type}
          </Badge>
        </div>

        {agent.supportedChains.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Supported Chains</span>
              <div className="flex items-center gap-1">
                {displayChains.map((chain, index) => (
                  <Avatar key={index} className="h-6 w-6">
                    <AvatarFallback className="text-xs font-medium bg-secondary">
                      {chain[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {extraChains > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">+{extraChains}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

