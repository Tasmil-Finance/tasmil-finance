import { Bot, ChevronRight, Settings, Sparkles } from "lucide-react";
import Image from "next/image";
import type { Assistant } from "@/gen/types/assistant";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardFooter, CardHeader } from "@/shared/ui/card";

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

// Map chain name to icon path
const CHAIN_ICONS: Record<string, string> = {
  stellar: "/token/stellar.png",
  ethereum: "/images/tokens/eth.png",
  arbitrum: "/images/tokens/arb.png",
  optimism: "/images/tokens/op.png",
  polygon: "/images/tokens/matic.png",
  bsc: "/images/tokens/bnb.png",
  avalanche: "/images/tokens/avax.png",
  base: "/images/tokens/base.png",
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
      className="flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium"
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {chain.charAt(0).toUpperCase()}
    </span>
  );
}

export function AgentCard({ assistant, onClick }: AgentCardProps) {
  const metadata = assistant.metadata as AssistantMetadata;

  const agentName = metadata?.name || assistant.name || "Unknown Agent";
  const agentType = metadata?.type || "Intelligence";
  const agentIcon = metadata?.icon;
  const agentDescription = metadata?.description || ["No description available"];
  const supportedChains = metadata?.supportedChains || [];

  return (
    <Card
      className="group relative flex h-full flex-col overflow-hidden border-border bg-card p-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="relative p-6 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Agent Icon - Floating, Transparent, No Background */}
          <div className="relative h-12 w-12 flex items-center justify-center shrink-0">
            {agentIcon ? (
              <Image
                src={agentIcon}
                alt={agentName}
                width={48}
                height={48}
                className="object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <Bot className="h-8 w-8 text-muted-foreground z-10" />
            )}
          </div>

          <Badge
            variant="outline"
            className={`border-border bg-background/50 backdrop-blur-md px-3 py-1 ${agentType === 'Strategy' ? 'text-accent-foreground' : 'text-primary'
              }`}
          >
            {agentType === 'Strategy' ? <Settings className="mr-1 h-3 w-3" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {agentType}
          </Badge>
        </div>

        {/* Content */}
        <div>
          <h3 className="mb-3 font-bold text-xl text-foreground group-hover:text-primary transition-colors">{agentName}</h3>
          <ul className="space-y-2 mb-6">
            {agentDescription.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground group-hover:bg-primary/50 transition-colors" />
                <span className="line-clamp-2 leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardHeader>

      {/* Footer */}
      <CardFooter className="mt-auto border-t border-border bg-muted/20 p-4 group-hover:bg-muted/40 transition-colors">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Supported Chains</span>
            <div className="flex -space-x-2">
              {supportedChains.slice(0, 4).map((chain, i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-background ring-2 ring-card flex items-center justify-center overflow-hidden">
                  <ChainIcon chain={chain} size={24} />
                </div>
              ))}
              {supportedChains.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-muted ring-2 ring-card flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                  +{supportedChains.length - 4}
                </div>
              )}
            </div>
          </div>

          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
