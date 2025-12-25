"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/agents/hero-section";
import { FilterBar } from "@/components/agents/filter-bar";
import { AgentCard } from "@/components/agents/agent-card";
import { generateUUID } from "@/lib/utils";
import { useAgentsControllerGetAllAgents } from "@/gen/hooks/agents-hooks";
import { $ } from "@/lib/kubb-config";
// Removed unused import

// Agent type from API response
type Agent = {
  id: string;
  name: string;
  description: string[];
  type: 'Strategy' | 'Intelligence';
  icon: string;
  supportedChains: string[];
};

interface AgentsListProps {
  initialAgents?: Agent[];
}

export function AgentsList({ initialAgents }: AgentsListProps) {
  const getAllAgentsQuery = useAgentsControllerGetAllAgents({
    ...$,
  });
  
  // Use React Query data if available, otherwise use initialAgents
  const agents = useMemo(() => {
    const data = getAllAgentsQuery.data;
    console.log('[AgentsList] Query data:', { data, isLoading: getAllAgentsQuery.isLoading, error: getAllAgentsQuery.error });
    
    // API might return array directly or wrapped in an object
    if (Array.isArray(data)) {
      return data as Agent[];
    }
    if (data && typeof data === 'object' && 'data' in data && Array.isArray(data.data)) {
      return data.data as Agent[];
    }
    if (data && typeof data === 'object' && 'agents' in data && Array.isArray(data.agents)) {
      return data.agents as Agent[];
    }
    
    return initialAgents || [];
  }, [getAllAgentsQuery.data, getAllAgentsQuery.isLoading, getAllAgentsQuery.error, initialAgents]);
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [promptToDeFi, setPromptToDeFi] = useState(false);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesFilter =
        activeFilter === "All" ||
        agent.type.toLowerCase() === activeFilter.toLowerCase();

    const matchesSearch =
        !searchQuery ||
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.some((desc) =>
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // For now, we don't have hasPromptToDeFi field in Agent type
      // This can be added later if needed
      const matchesPromptToDeFi = !promptToDeFi; // Always true for now

      return matchesFilter && matchesSearch && matchesPromptToDeFi;
  });
  }, [activeFilter, searchQuery, promptToDeFi, agents]);

  const handleAgentClick = (agentId: string) => {
    const chatId = generateUUID();
    router.push(`/agents/${agentId}/chat/${chatId}`);
  };

  // Show loading state
  if (getAllAgentsQuery.isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <HeroSection agentCount={0} />
          <div className="text-center py-16">
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (getAllAgentsQuery.error) {
    console.error('[AgentsList] Error loading agents:', getAllAgentsQuery.error);
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <HeroSection agentCount={0} />
          <div className="text-center py-16">
            <p className="text-destructive">Failed to load agents. Please try again.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <HeroSection agentCount={agents.length} />

        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          promptToDeFi={promptToDeFi}
          onPromptToDeFiChange={setPromptToDeFi}
        />

        <section className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => handleAgentClick(agent.id)}
                hasPromptToDeFi={false} // Can be updated when backend provides this field
            />
          ))}
        </div>

        {filteredAgents.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {getAllAgentsQuery.isLoading ? 'Loading agents...' : 'No agents found matching your criteria.'}
              </p>
          </div>
        )}
        </section>
      </div>
    </main>
  );
}

