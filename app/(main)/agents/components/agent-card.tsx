"use client";

// Agent type from API response
type Agent = {
  id: string;
  name: string;
  description: string[];
  type: 'Strategy' | 'Intelligence';
  icon: string;
  supportedChains: string[];
};
import { Card } from "@/components/ui/card";

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <Card
      className="p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer h-[400px] flex flex-col group relative"
      onClick={onClick}
    >
      {/* Type Badge */}
      <div className="absolute top-4 right-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            agent.type === "Strategy"
              ? "bg-blue-500/20 text-blue-500"
              : "bg-purple-500/20 text-purple-500"
          }`}
        >
          {agent.type}
        </span>
      </div>

      {/* Agent Icon */}
      <div className="mb-4">
        {agent.icon ? (
          <img
            src={agent.icon}
            alt={agent.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-2xl">
            {agent.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Agent Name */}
      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
        {agent.name}
      </h3>

      {/* Description */}
      <div className="flex-1 space-y-2 mb-4">
        {agent.description.map((desc, index) => (
          <p key={index} className="text-sm text-muted-foreground line-clamp-2">
            {desc}
          </p>
        ))}
      </div>

      {/* Supported Chains */}
      {agent.supportedChains.length > 0 && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {agent.supportedChains.map((chain) => (
              <span
                key={chain}
                className="px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
              >
                {chain}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

