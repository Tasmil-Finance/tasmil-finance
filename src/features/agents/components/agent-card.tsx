import { TokenIcon } from "@web3icons/react/dynamic";
import { Bot, ChevronRight, Settings, Sparkles } from "lucide-react";
import Image from "next/image";
import type { Assistant } from "@/gen/types/assistant";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { GlassCard } from "@/shared/ui/glass-card";

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

// Map chain name to token symbol for web3icons
const getChainTokenSymbol = (chainName: string): string => {
  const chainMap: Record<string, string> = {
    ethereum: "eth",
    eth: "eth",
    arbitrum: "arb",
    avalanche: "avax",
    avax: "avax",
    bnb: "bnb",
    bsc: "bnb",
    base: "base",
    blast: "blast",
    celo: "celo",
    fantom: "ftm",
    gnosis: "gno",
    linea: "linea",
    manta: "manta",
    mantle: "mnt",
    metis: "metis",
    mode: "mode",
    moonbeam: "glmr",
    optimism: "op",
    op: "op",
    polygon: "matic",
    scroll: "scr",
    solana: "sol",
    aurora: "aurora",
    zksync: "zk",
  };

  const normalized = chainName.toLowerCase().replace(/\s+/g, "");
  return chainMap[normalized] || normalized;
};

// Check if chain is U2U (use PNG instead of web3icons)
const isU2UChain = (chainName: string): boolean => {
  const normalized = chainName.toLowerCase().replace(/\s+/g, "");
  return normalized === "u2u" || normalized === "u2usolaris";
};

// Chain icon component
function ChainIcon({ chain, size = 20 }: { chain: string; size?: number }) {
  if (isU2UChain(chain)) {
    return (
      <Image
        src="/images/tokens/u2u.png"
        alt="U2U"
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    );
  }

  return <TokenIcon symbol={getChainTokenSymbol(chain)} variant="branded" size={size} />;
}

export function AgentCard({ assistant, onClick }: AgentCardProps) {
  const metadata = assistant.metadata as AssistantMetadata;

  const agentName = metadata?.name || assistant.name || "Unknown Agent";
  const agentType = metadata?.type || "Intelligence";
  const agentIcon = metadata?.icon;
  const agentDescription = metadata?.description || ["No description available"];
  const supportedChains = metadata?.supportedChains || [];

  return (
    <GlassCard
      className="group relative flex h-full flex-col overflow-hidden border-white/5 bg-zinc-900/40 p-0 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/5"
      onClick={onClick}
    >
      <div className="relative p-6 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          {/* Agent Icon - Floating, Transparent, No Background */}
          <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
            {agentIcon ? (
              <Image
                src={agentIcon}
                alt={agentName}
                width={64}
                height={64}
                className="object-contain drop-shadow-2xl z-10 group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <Bot className="h-10 w-10 text-zinc-500 z-10" />
            )}
          </div>

          <Badge
            variant="outline"
            className={`border-white/10 bg-white/5 backdrop-blur-md px-3 py-1 ${agentType === 'Strategy' ? 'text-emerald-400' : 'text-blue-400'
              }`}
          >
            {agentType === 'Strategy' ? <Settings className="mr-1 h-3 w-3" /> : <Sparkles className="mr-1 h-3 w-3" />}
            {agentType}
          </Badge>
        </div>

        {/* Content */}
        <div>
          <h3 className="mb-3 font-bold text-xl text-white group-hover:text-cyan-400 transition-colors">{agentName}</h3>
          <ul className="space-y-2 mb-6">
            {agentDescription.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-zinc-400 text-sm">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600 group-hover:bg-cyan-500/50 transition-colors" />
                <span className="line-clamp-2 leading-relaxed">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-white/5 bg-white/[0.02] p-4 group-hover:bg-white/[0.04] transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Supported Chains</span>
            <div className="flex -space-x-2">
              {supportedChains.slice(0, 4).map((chain, i) => (
                <div key={i} className="h-6 w-6 rounded-full bg-zinc-900 ring-2 ring-zinc-900 flex items-center justify-center overflow-hidden">
                  <ChainIcon chain={chain} size={16} />
                </div>
              ))}
              {supportedChains.length > 4 && (
                <div className="h-6 w-6 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                  +{supportedChains.length - 4}
                </div>
              )}
            </div>
          </div>

          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
