import { Bot, ChevronRight, Layers, Sparkles } from "lucide-react";
import Image from "next/image";
import type { Assistant } from "@/gen/types/assistant";
import { Badge } from "@/shared/ui/badge";
import BorderGlow from "@/shared/ui/border-glow";
import { Button } from "@/shared/ui/button";
import { CardFooter, CardHeader } from "@/shared/ui/card";

// Define metadata interface based on the response structure
interface AssistantMetadata {
  id?: string;
  icon?: string;
  name?: string;
  tags?: string[];
  type?: "Execution" | "Discovery" | "Assistant";
  author?: string;
  version?: string;
  category?: string;
  created_by?: string;
  description?: string[];
  capabilities?: string[];
  supportedChains?: string[];
  supportedProtocols?: string[];
  agentGroup?: "Protocol Agents" | "Common Agents";
}

interface AgentCardProps {
  assistant: Assistant;
  onClick: () => void;
}

// Map chain name to icon path (files in /public/token/)
const CHAIN_ICONS: Record<string, string> = {
  stellar: "/token/xlm.png",
  ethereum: "/token/ethereum.png",
  arbitrum: "/token/arb.png",
  optimism: "/token/optimism.png",
  polygon: "/token/polygon.png",
  bsc: "/token/bsc.png",
  avalanche: "/token/avalanche.png",
  base: "/token/base.png",
  solana: "/token/solana.png",
};

function getChainIconPath(chainName: string): string | null {
  const normalized = chainName.toLowerCase().replace(/\s+/g, "");
  return CHAIN_ICONS[normalized] || null;
}

// Chain icon component
function ChainIcon({ chain, size = 20 }: { chain: string; size?: number }) {
  const iconPath = getChainIconPath(chain);

  if (iconPath) {
    return (
      <Image
        src={iconPath}
        alt={chain}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  // Fallback: first letter
  return (
    <span
      className="flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {chain.charAt(0).toUpperCase()}
    </span>
  );
}

export function AgentCard({ assistant, onClick }: AgentCardProps) {
  const metadata = assistant.metadata as AssistantMetadata;

  const agentName = metadata?.name || assistant.name || "Unknown Agent";
  const agentType = metadata?.type || "Discovery";
  const agentIcon = metadata?.icon;
  const agentDescription = metadata?.description || ["No description available"];
  const supportedChains = metadata?.supportedChains || [];
  const agentGroup = metadata?.agentGroup;

  const topBadgeLabel =
    agentGroup === "Protocol Agents"
      ? "Protocol"
      : agentGroup === "Common Agents"
        ? "Common"
        : agentType;

  return (
    <button onClick={onClick} className="h-full cursor-pointer text-left" type="button">
      <BorderGlow
        className="group relative flex h-full flex-col overflow-hidden"
        backgroundColor="#18181b"
        borderRadius={8}
        edgeSensitivity={12}
        glowColor="189 100 66"
        glowRadius={40}
        glowIntensity={1.2}
        coneSpread={28}
        colors={["#52e5ff", "#36b1ff", "#e4f5ff"]}
      >
        <CardHeader className="relative flex-1 p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            {/* Agent Icon */}
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted/30">
              {agentIcon ? (
                <Image
                  src={agentIcon}
                  alt={agentName}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Bot className="h-7 w-7 text-muted-foreground" />
                </div>
              )}
            </div>

            <Badge
              variant="outline"
              className={`border-border bg-background/50 px-3 py-1 backdrop-blur-md ${
                agentGroup === "Protocol Agents"
                  ? "text-primary"
                  : agentGroup === "Common Agents"
                    ? "text-accent-foreground"
                    : agentType === "Assistant"
                      ? "text-primary"
                      : "text-muted-foreground"
              }`}
            >
              {agentGroup ? (
                <Layers className="mr-1 h-3 w-3" />
              ) : (
                <Sparkles className="mr-1 h-3 w-3" />
              )}
              {topBadgeLabel}
            </Badge>
          </div>

          {/* Content */}
          <div>
            <h3 className="mb-3 font-bold text-foreground text-xl transition-colors group-hover:text-primary">
              {agentName}
            </h3>

            <ul className="mb-6 space-y-2">
              {agentDescription.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground transition-colors group-hover:bg-primary/50" />
                  <span className="line-clamp-2 leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardHeader>

        {/* Footer */}
        <CardFooter className="mt-auto border-border border-t bg-muted/20 p-4 transition-colors group-hover:bg-muted/40">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground text-xs">Supported Chains</span>
              <div className="-space-x-2 group/chains relative flex">
                {supportedChains.slice(0, 4).map((chain, i) => (
                  <div key={i} title={chain}>
                    <ChainIcon chain={chain} size={32} />
                  </div>
                ))}
                {supportedChains.length > 4 && (
                  <div className="flex h-8 w-8 cursor-default items-center justify-center rounded-full border border-white/70 bg-white font-semibold text-[10px] text-black">
                    +{supportedChains.length - 4}
                  </div>
                )}
                {supportedChains.length > 4 && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 hidden w-max max-w-[220px] flex-wrap gap-1.5 rounded-lg border border-border bg-popover p-2 shadow-lg group-hover/chains:flex">
                    {supportedChains.map((chain, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 text-muted-foreground text-xs"
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full">
                          <ChainIcon chain={chain} size={16} />
                        </div>
                        <span>{chain}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </BorderGlow>
    </button>
  );
}
