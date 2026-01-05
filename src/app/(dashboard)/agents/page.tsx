"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/agents/hero-section";
import { FilterBar } from "@/components/agents/filter-bar";
import { AgentCard } from "@/components/agents/agent-card";
import { useSearchAssistantsAssistantsSearchPost, useCreateThreadThreadsPost } from "@/gen";
import { $ } from "@/lib/kubb";
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

export default function AgentsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Call hook để lấy agents với body rỗng
  const searchAssistants = useSearchAssistantsAssistantsSearchPost($);
  
  // Hook để tạo thread mới
  const createThread = useCreateThreadThreadsPost($);

  // Load agents khi component mount
  useEffect(() => {
    if (!searchAssistants.data && !searchAssistants.isPending) {
      searchAssistants.mutate({ data: {} });
    }
  }, []);

  // Get unique types from API data for filter bar
  const availableTypes = useMemo(() => {
    if (!searchAssistants.data) return [];
    
    const types = searchAssistants.data
      .map(assistant => (assistant.metadata as AssistantMetadata)?.type)
      .filter((type): type is "Strategy" | "Intelligence" => Boolean(type))
      .filter((type, index, array) => array.indexOf(type) === index);
    
    return types;
  }, [searchAssistants.data]);

  // Filter agents based on type and search query
  const filteredAgents = useMemo(() => {
    if (!searchAssistants.data) return [];

    return searchAssistants.data.filter((assistant) => {
      const metadata = assistant.metadata as AssistantMetadata;
      
      const matchesFilter =
        activeFilter === "All" || metadata?.type === activeFilter;

      const matchesSearch =
        !searchQuery ||
        metadata?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metadata?.description?.some((desc: string) => 
          desc.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesFilter && matchesSearch;
    });
  }, [searchAssistants.data, activeFilter, searchQuery]);

  const handleAgentClick = async (assistant: Assistant) => {
    try {
      // Tạo thread mới với metadata chứa graph_id và assistant_id
      const threadResponse = await createThread.mutateAsync({
        data: {
          metadata: {
            graph_id: assistant.graph_id,
            assistant_id: assistant.assistant_id,
          },
        },
      });

      // Navigate trực tiếp đến thread vừa tạo
      router.push(`/chat/${assistant.name}/${threadResponse.thread_id}`);
    } catch (error) {
      console.error('Failed to create thread:', error);
      // Fallback to old behavior if thread creation fails
      router.push(`/chat/${assistant.name}/new`);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <HeroSection agentCount={searchAssistants.data?.length || 0} />

        <FilterBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableTypes={availableTypes}
        />

        <section className="py-8">
          {searchAssistants.isPending && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Loading agents...</p>
            </div>
          )}

          {searchAssistants.error && (
            <div className="py-16 text-center">
              <p className="text-red-500">Error loading agents: {searchAssistants.error.message}</p>
            </div>
          )}

          {!searchAssistants.isPending && !searchAssistants.error && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAgents.map((assistant) => (
                <AgentCard 
                  key={assistant.assistant_id} 
                  assistant={assistant} 
                  onClick={() => handleAgentClick(assistant)} 
                />
              ))}
            </div>
          )}

          {!searchAssistants.isPending && filteredAgents.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No agents found matching your criteria.</p>
            </div>
          )}

          {createThread.isPending && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background p-6 rounded-lg">
                <p className="text-foreground">Creating new chat...</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}