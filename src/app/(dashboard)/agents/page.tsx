"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AgentCard } from "@/features/agents/components/agent-card";
import { FilterBar } from "@/features/agents/components/filter-bar";
import { HeroSection } from "@/features/agents/components/hero-section";
import { AGENTS } from "@/features/chat/config/agents.config";
import { TOUR_NAMES } from "@/features/onboarding/config/tour-steps";
import { usePageTour } from "@/features/onboarding/hooks/use-onboarding";
import { useSearchAssistantsAssistantsSearchPost } from "@/gen-ai";
import type { Assistant } from "@/gen-ai/types/assistant";
import { $ } from "@/lib/kubb";

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

const AGENT_GROUPS: Record<string, "Protocol Agents" | "Common Agents"> = {
  blend_agent: "Protocol Agents",
  soroswap_agent: "Protocol Agents",
  phoenix_agent: "Protocol Agents",
  aquarius_agent: "Protocol Agents",
  defindex_agent: "Protocol Agents",
  templar_agent: "Protocol Agents",
  allbridge_agent: "Protocol Agents",
  sdex_agent: "Protocol Agents",
  bridge_agent: "Common Agents",
  yield_agent: "Common Agents",
  research_agent: "Common Agents",
  info_agent: "Common Agents",
  supervisor: "Common Agents",
};

const AGENT_PROTOCOLS: Record<string, string[]> = {
  blend_agent: ["Blend V2", "Blend Backstop"],
  soroswap_agent: ["Soroswap", "Stellar DEX (SDEX)"],
  phoenix_agent: ["Phoenix"],
  aquarius_agent: ["Aquarius"],
  defindex_agent: ["DeFindex"],
  templar_agent: ["Templar"],
  allbridge_agent: ["Allbridge"],
  sdex_agent: ["SDEX"],
  bridge_agent: ["Allbridge", "NEAR Intents"],
  yield_agent: ["Blend", "Soroswap", "Phoenix", "Aquarius", "DeFindex", "Templar"],
};

const AGENT_TYPE_FALLBACK: Record<string, "Execution" | "Discovery" | "Assistant"> = {
  supervisor: "Assistant",
  info_agent: "Discovery",
  research_agent: "Discovery",
  yield_agent: "Discovery",
  bridge_agent: "Execution",
  allbridge_agent: "Execution",
  sdex_agent: "Execution",
  blend_agent: "Execution",
  soroswap_agent: "Execution",
  phoenix_agent: "Execution",
  aquarius_agent: "Execution",
  defindex_agent: "Execution",
  templar_agent: "Execution",
};

function toDescriptionBullets(items: string[]): string[] {
  const normalized = items.map((item) => item.trim()).filter(Boolean);

  if (normalized.length === 0) return ["No description available"];

  const first = normalized[0];
  if (normalized.length === 1 && first) {
    const split = first
      .split(/\s*[.;]\s+|\s+—\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (split.length > 1) return split.slice(0, 3);
  }

  return normalized.slice(0, 3).map((line) => {
    const compact = line.replace(/\s+/g, " ").trim();
    if (compact.length <= 62) return compact;
    return `${compact.slice(0, 59).trimEnd()}...`;
  });
}

// Valid agent graph_ids to display (filter out legacy/test agents)
const ALL_AGENT_IDS = [
  "supervisor",
  "info_agent",
  "blend_agent",
  "soroswap_agent",
  "phoenix_agent",
  "aquarius_agent",
  "defindex_agent",
  "templar_agent",
  "allbridge_agent",
  "sdex_agent",
  "bridge_agent",
  "research_agent",
  "yield_agent",
];

const isTestnet = process.env["NEXT_PUBLIC_STELLAR_NETWORK"] !== "mainnet";

// When on testnet, only show agents that support testnet
const VALID_AGENT_IDS = isTestnet
  ? ALL_AGENT_IDS.filter((id) => AGENTS[id]?.testnetAvailable !== false)
  : ALL_AGENT_IDS;

// Map icon paths from /sidebar/ to /agents/ and ensure correct format
const normalizeIconPath = (icon: string | undefined, graphId: string): string => {
  // Force use of local high-quality 3D icons for known agents
  const defaultIcons: Record<string, string> = {
    supervisor: "/agents/supervisor-agent.svg",
    info_agent: "/agents/info-agent.png",
    blend_agent: "/agents/blend-agent.svg",
    soroswap_agent: "/agents/soroswap-agent.svg",
    phoenix_agent: "/agents/phoenix-agent.svg",
    aquarius_agent: "/agents/aquarius-agent.svg",
    defindex_agent: "/agents/defindex-agent.svg",
    templar_agent: "/agents/templar-agent.svg",
    allbridge_agent: "/agents/allbridge-agent.svg",
    sdex_agent: "/agents/sdex-agent.svg",
    bridge_agent: "/agents/bridge-agent-v6.png",
    research_agent: "/agents/research-agent-v6.png",
    yield_agent: "/agents/yield-agent-v6.png",
  };

  if (defaultIcons[graphId]) {
    return defaultIcons[graphId];
  }

  if (!icon) return "/agents/bridge-agent-v6.png";

  // Convert /sidebar/ paths to /agents/ if needed for others
  if (icon.includes("/sidebar/")) {
    return icon.replace("/sidebar/", "/agents/").replace(".png", ".svg");
  }

  return icon;
};

export default function AgentsPage() {
  usePageTour(TOUR_NAMES.agents);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Call hook to get agents with empty body
  const searchAssistants = useSearchAssistantsAssistantsSearchPost($ as any);

  // Load agents when component mounts
  useEffect(() => {
    if (!searchAssistants.data && !searchAssistants.isPending) {
      searchAssistants.mutate({ data: {} });
    }
  }, [searchAssistants.data, searchAssistants.isPending, searchAssistants.mutate]);

  // Get unique types from API data for filter bar (only from valid agents)
  const validAgents = useMemo(() => {
    const byGraphId = new Map<string, Assistant>();

    (searchAssistants.data || [])
      .filter((assistant) => VALID_AGENT_IDS.includes(assistant.graph_id || ""))
      .forEach((assistant) => {
        if (!byGraphId.has(assistant.graph_id || "")) {
          byGraphId.set(assistant.graph_id || "", assistant as Assistant);
        }
      });

    return VALID_AGENT_IDS.map((graphId) => {
      const assistant = byGraphId.get(graphId);
      const metadata = (assistant?.metadata as AssistantMetadata) || {};
      const config = AGENTS[graphId];
      const fallbackDescription = config?.description
        ? [config.description]
        : ["No description available"];
      const rawDescription =
        metadata?.description && metadata.description.length > 0
          ? metadata.description
          : fallbackDescription;
      const fallbackChains = config?.supportedChains?.length ? config.supportedChains : ["Stellar"];

      return {
        ...(assistant || {
          assistant_id: graphId,
          graph_id: graphId,
          name: config?.name || graphId,
          metadata: {},
        }),
        metadata: {
          ...metadata,
          icon: normalizeIconPath(metadata?.icon, graphId),
          name:
            metadata?.name && metadata.name !== "Untitled"
              ? metadata.name
              : config?.name || assistant?.name || graphId,
          type: metadata?.type || AGENT_TYPE_FALLBACK[graphId] || "Discovery",
          description: toDescriptionBullets(rawDescription),
          supportedChains: metadata?.supportedChains?.length
            ? metadata.supportedChains
            : fallbackChains,
          supportedProtocols: metadata?.supportedProtocols?.length
            ? metadata.supportedProtocols
            : AGENT_PROTOCOLS[graphId] || [],
          agentGroup: metadata?.agentGroup || AGENT_GROUPS[graphId],
        },
      } as Assistant;
    });
  }, [searchAssistants.data]);

  const availableFilters = useMemo(() => {
    const groups = validAgents
      .map((assistant) => (assistant.metadata as AssistantMetadata)?.agentGroup)
      .filter((group): group is "Protocol Agents" | "Common Agents" => Boolean(group))
      .filter((group, index, array) => array.indexOf(group) === index);

    return groups;
  }, [validAgents]);

  // Filter agents based on type and search query
  const filteredAgents = useMemo(() => {
    return validAgents.filter((assistant) => {
      const metadata = assistant.metadata as AssistantMetadata;

      const matchesFilter =
        activeFilter === "All" ||
        metadata?.agentGroup === activeFilter ||
        metadata?.type === activeFilter;

      const matchesSearch =
        !searchQuery ||
        metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.description?.some((desc: string) =>
          desc.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesFilter && matchesSearch;
    });
  }, [validAgents, activeFilter, searchQuery]);

  const handleAgentClick = (assistant: Assistant) => {
    // Navigate to /new, thread will be created when sending the first message
    router.push(`/chat/${assistant.graph_id}/new`);
  };

  return (
    <main className="h-full bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <HeroSection agentCount={validAgents.length} />

        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableFilters={availableFilters}
        />

        <section data-onborda="agents-grid" className="py-8">
          {searchAssistants.isPending && (
            <motion.div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[280px] animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
            </motion.div>
          )}

          {searchAssistants.error && (
            <motion.div
              className="py-16 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-destructive">
                Error loading agents: {searchAssistants.error.message}
              </p>
            </motion.div>
          )}

          {!searchAssistants.isPending && !searchAssistants.error && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter + searchQuery}
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filteredAgents.map((assistant: any, idx: number) => (
                  <motion.div
                    key={assistant.assistant_id}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: idx * 0.06,
                      ease: "easeOut",
                    }}
                  >
                    <AgentCard assistant={assistant} onClick={() => handleAgentClick(assistant)} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {!searchAssistants.isPending && filteredAgents.length === 0 && (
            <motion.div
              className="py-16 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-muted-foreground">No agents found matching your criteria.</p>
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}
