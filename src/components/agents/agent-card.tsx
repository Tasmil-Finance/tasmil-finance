"use client";

import Image from "next/image";
import { type LucideIcon, Settings, Sparkles, Bot } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Assistant } from "@/gen/types/assistant";

// Define metadata interface based on the response structure
interface AssistantMetadata {
  id?: string;
  icon?: string;
  name?: string;
  tags?: string[];
  type?: "Strategy" | "Intelligence";
  author?: string;
  version?: string;
  category?: string;
  created_by?: string;
  description?: string[];
  capabilities?: string[];
  supportedChains?: string[];
}

interface AgentCardProps {
  assistant: Assistant;
  onClick: () => void;
}

// Map agent type to icon
const getTypeIcon = (type: string): LucideIcon => {
  return type === "Strategy" ? Settings : Sparkles;
};

// Map chain name to display name and color
const getChainInfo = (chainName: string) => {
  const chainMap: Record<string, { name: string; color: string }> = {
    ethereum: { name: "ETH", color: "bg-blue-500" },
    eth: { name: "ETH", color: "bg-blue-500" },
    polygon: { name: "MATIC", color: "bg-purple-500" },
    bsc: { name: "BSC", color: "bg-yellow-500" },
    arbitrum: { name: "ARB", color: "bg-blue-400" },
    optimism: { name: "OP", color: "bg-red-500" },
    avalanche: { name: "AVAX", color: "bg-red-400" },
    fantom: { name: "FTM", color: "bg-blue-600" },
    u2u: { name: "U2U", color: "bg-cyan-500" },
    "u2u solaris": { name: "U2", color: "bg-cyan-500" },
  };

  const normalized = chainName.toLowerCase();
  return chainMap[normalized] || { name: chainName.toUpperCase().slice(0, 3), color: "bg-gray-500" };
};

// Chain icon component
function ChainIcon({ chain }: { chain: string }) {
  const chainInfo = getChainInfo(chain);

  return (
    <Avatar className="flex h-8 w-8 items-center justify-center ring-0">
      <AvatarFallback className={`${chainInfo.color} font-bold text-white text-xs`}>
        {chainInfo.name.slice(0, 2)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AgentCard({ assistant, onClick }: AgentCardProps) {
  const metadata = assistant.metadata as AssistantMetadata;
  
  const agentName = metadata?.name || assistant.name || "Unknown Agent";
  const agentType = metadata?.type || "Intelligence";
  const agentIcon = metadata?.icon;
  const agentDescription = metadata?.description || ["No description available"];
  const supportedChains = metadata?.supportedChains || ["U2U Solaris"];
  
  const TypeIcon = getTypeIcon(agentType);

  // Extract first 5 chains for display
  const displayChains = supportedChains.slice(0, 5);
  const extraChains = supportedChains.length - 5;

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-300 hover:border-muted-foreground/30 hover:shadow-lg"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        {/* Icon and Title in horizontal layout */}
        <div className="flex items-center gap-4">
          {/* Agent Icon */}
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
            {agentIcon ? (
              <Image
                src={agentIcon}
                alt={agentName}
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
            ) : (
              <Bot size={40} className="text-primary" />
            )}
          </div>

          {/* Title and Type Badge */}
          <div className="min-w-0 flex-1">
            <h3 className="mb-2 font-semibold text-foreground text-lg">{agentName}</h3>
            <Badge variant="outline" className="gap-1">
              <TypeIcon size={12} />
              {agentType}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col space-y-6">
        <ul className="min-h-[96px] flex-1 space-y-2">
          {agentDescription.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
              <span className="mt-0.5 text-muted-foreground">•</span>
              {feature}
            </li>
          ))}
        </ul>

        {supportedChains.length > 0 && (
          <div className="border-border border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Supported Chains</span>
              <div className="-space-x-2 flex items-center">
                {displayChains.map((chain, index) => (
                  <ChainIcon key={index} chain={chain} />
                ))}
                {extraChains > 0 && (
                  <Avatar className="z-10 h-8 w-8">
                    <AvatarFallback className="bg-secondary font-medium text-muted-foreground text-xs">
                      +{extraChains}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}